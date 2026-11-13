// Header behaviour: mobile menu, search disclosure, nav dropdowns, scrolled shadow.
// Self-initializing; no exports. Everything works by keyboard, pointer and touch (DESIGN.md 10.0).
(() => {
  const root = document.documentElement;
  const desktop = window.matchMedia("(min-width: 1024px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex='-1'])";
  const EXIT_MS = 150; // --dur-fast; exits are quicker than the 200ms enter.

  // Alert banner: gone once its end time passes; Notice/Closed can be dismissed for the visit.
  function initAlert() {
    const alert = document.querySelector("[data-alert]");
    if (!alert) return;
    const end = alert.getAttribute("data-alert-end");
    const endMs = Date.parse(end);
    const KEY = "courtenay-alert-dismissed";
    let dismissed = null;
    try { dismissed = sessionStorage.getItem(KEY); } catch (e) { /* storage unavailable */ }
    if (Number.isNaN(endMs) || Date.now() >= endMs || dismissed === end) { alert.remove(); return; }
    const button = alert.querySelector("[data-alert-dismiss]");
    if (button) {
      button.addEventListener("click", () => {
        try { sessionStorage.setItem(KEY, end); } catch (e) { /* ignore */ }
        alert.remove();
        // Removing the focused button would drop focus to <body>; keep keyboard users in place.
        const main = document.getElementById("main");
        if (main) main.focus({ preventScroll: true });
      });
    }
    // Remove it while the page is open when the end time arrives.
    const wait = endMs - Date.now();
    if (wait < 2147483647) setTimeout(() => alert.remove(), wait);
  }

  // Staff directory: filter by group. Without JavaScript the buttons stay hidden and every group shows.
  function initStaffFilter() {
    const bar = document.querySelector("[data-staff-filter]");
    if (!bar) return;
    const buttons = Array.from(bar.querySelectorAll("button"));
    const groups = Array.from(document.querySelectorAll("[data-staff-group]"));
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const wanted = button.getAttribute("data-group");
        buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        groups.forEach((g) => { g.hidden = Boolean(wanted) && g.getAttribute("data-staff-group") !== wanted; });
      });
    });
    bar.hidden = false;
  }

  function init() {
    initAlert();
    initStaffFilter();
    const header = document.querySelector("[data-header]");
    if (!header) return;
    initScrollShadow(header);
    const menu = initMenu(header);
    const search = initSearch(header, menu);
    if (menu) menu.onOpen = () => search && search.close(false);
    initSubmenus(header);
  }

  // Shadow only once the page has scrolled (DESIGN.md 10.2: --shadow-header after scroll).
  function initScrollShadow(header) {
    let ticking = false;
    const update = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 0);
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function initMenu(header) {
    const button = header.querySelector("[data-menu-toggle]");
    const panel = button && document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return null;
    let closeTimer = 0;
    let inerted = [];
    // The panel sits directly under the header bar, whatever height the bar wrapped to. The bar
    // can change height while the menu is open (rotation, resize, alert text wrapping), so the
    // offset is measured again on every resize and orientation change.
    let frame = 0;
    const placePanel = () => {
      frame = 0;
      panel.style.setProperty("--menu-top", `${header.getBoundingClientRect().bottom}px`);
    };
    const onViewportChange = () => {
      if (api.isOpen() && !frame) frame = requestAnimationFrame(placePanel);
    };

    const api = {
      isOpen: () => button.getAttribute("aria-expanded") === "true",
      onOpen: null,
      open() {
        if (desktop.matches || api.isOpen()) return;
        if (api.onOpen) api.onOpen();
        clearTimeout(closeTimer);
        placePanel();
        panel.classList.add("is-mounted");
        panel.getBoundingClientRect(); // commit the start state so the enter transition runs
        panel.classList.add("is-open");
        button.setAttribute("aria-expanded", "true");
        root.classList.add("menu-open");
        // Everything outside the menu and its button is unreachable while it is open.
        inerted = [
          ...[...document.body.children].filter((el) => el !== header && !el.inert),
          ...[...header.querySelectorAll(".brand, [data-search-toggle], [data-search]")].filter((el) => !el.inert),
        ];
        inerted.forEach((el) => { el.inert = true; });
        document.addEventListener("keydown", onKeydown);
        window.addEventListener("resize", onViewportChange);
        window.addEventListener("orientationchange", onViewportChange);
      },
      close(returnFocus = true) {
        if (!api.isOpen()) return;
        button.setAttribute("aria-expanded", "false");
        panel.classList.remove("is-open");
        root.classList.remove("menu-open");
        inerted.forEach((el) => { el.inert = false; });
        inerted = [];
        document.removeEventListener("keydown", onKeydown);
        window.removeEventListener("resize", onViewportChange);
        window.removeEventListener("orientationchange", onViewportChange);
        cancelAnimationFrame(frame);
        frame = 0;
        clearTimeout(closeTimer);
        const unmount = () => panel.classList.remove("is-mounted");
        if (reducedMotion.matches) unmount();
        else closeTimer = setTimeout(unmount, EXIT_MS);
        if (returnFocus) button.focus();
      },
    };

    function onKeydown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        api.close();
        return;
      }
      if (event.key !== "Tab") return;
      // Cycle between the menu button and the menu items.
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!event.shiftKey && (active === button || !panel.contains(active))) {
        event.preventDefault();
        first.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        button.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        button.focus();
      } else if (event.shiftKey && active === button) {
        event.preventDefault();
        last.focus();
      }
    }

    button.addEventListener("click", () => (api.isOpen() ? api.close() : api.open()));
    // Following an in-page link (or any link) from the menu closes it.
    panel.addEventListener("click", (event) => {
      if (event.target.closest("a[href]") && api.isOpen()) api.close(false);
    });
    desktop.addEventListener("change", () => api.close(false));
    return api;
  }

  function initSearch(header, menu) {
    const button = header.querySelector("[data-search-toggle]");
    const panel = button && document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return null;
    const input = panel.querySelector("input");
    const api = {
      open() {
        if (menu) menu.close(false);
        panel.hidden = false;
        button.setAttribute("aria-expanded", "true");
        if (input) input.focus();
      },
      close(returnFocus = true) {
        if (panel.hidden) return;
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
        if (returnFocus) button.focus();
      },
    };
    button.addEventListener("click", () => (panel.hidden ? api.open() : api.close()));
    panel.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { event.preventDefault(); api.close(); }
    });
    return api;
  }

  // Desktop dropdowns open on click/tap and Enter/Space (the toggle is a button), never on hover alone.
  function initSubmenus(header) {
    const toggles = [...header.querySelectorAll("[data-submenu-toggle]")];
    if (!toggles.length) return;
    const listFor = (t) => document.getElementById(t.getAttribute("aria-controls"));
    const setOpen = (t, open) => {
      t.setAttribute("aria-expanded", String(open));
      listFor(t).hidden = !open;
    };
    toggles.forEach((t) => {
      t.addEventListener("click", () => {
        const open = t.getAttribute("aria-expanded") !== "true";
        toggles.forEach((other) => other !== t && setOpen(other, false));
        setOpen(t, open);
      });
    });
    document.addEventListener("click", (event) => {
      if (!desktop.matches) return;
      toggles.forEach((t) => {
        if (!t.parentElement.contains(event.target)) setOpen(t, false);
      });
    });
    // Esc closes an open dropdown first and puts focus on its toggle; it does not reach the
    // mobile menu's own Esc handler on document. So in the mobile menu, with a section open,
    // the first Esc closes that section and the second Esc closes the menu.
    // Desktop: only the dropdown that holds focus (focus leaving one already closes it).
    header.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      const open = toggles.filter((x) => x.getAttribute("aria-expanded") === "true");
      const t = open.find((x) => x.parentElement.contains(document.activeElement)) || (!desktop.matches && open[0]);
      if (t) { setOpen(t, false); t.focus(); event.preventDefault(); event.stopPropagation(); }
    });
    // Crossing the desktop breakpoint starts every section closed.
    desktop.addEventListener("change", () => toggles.forEach((t) => setOpen(t, false)));
    // Leaving a dropdown by keyboard closes it.
    header.addEventListener("focusout", (event) => {
      if (!desktop.matches) return;
      toggles.forEach((t) => {
        if (t.getAttribute("aria-expanded") === "true" && !t.parentElement.contains(event.relatedTarget)) setOpen(t, false);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
