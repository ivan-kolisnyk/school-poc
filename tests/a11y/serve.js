// Tiny static server: maps /school-poc/* to _site/* so the built site works under its path prefix.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../_site");
const PREFIX = "/school-poc/";
const port = Number(process.env.PORT || 4173);
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".ico": "image/x-icon",
  ".pdf": "application/pdf", ".xml": "application/xml", ".txt": "text/plain",
};

async function resolveFile(urlPath) {
  const rel = decodeURIComponent(urlPath.slice(PREFIX.length));
  const file = path.join(root, rel);
  if (!file.startsWith(root)) return null;
  const candidates = [file, path.join(file, "index.html")];
  for (const c of candidates) {
    try { if ((await stat(c)).isFile()) return c; } catch { /* next */ }
  }
  return null;
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");
  let file;
  try {
    file = pathname.startsWith(PREFIX) ? await resolveFile(pathname) : null;
  } catch (e) {
    // A malformed escape such as /school-poc/%E0%A4%A must not crash the server.
    if (e instanceof URIError) { res.writeHead(400, { "content-type": "text/plain" }).end("Bad request"); return; }
    throw e;
  }
  let status = 200;
  if (!file) { file = path.join(root, "404.html"); status = 404; }
  try {
    const body = await readFile(file);
    res.writeHead(status, { "content-type": types[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`Serving _site at http://localhost:${port}${PREFIX}`));
