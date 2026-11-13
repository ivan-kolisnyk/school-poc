import { test } from "node:test";
import assert from "node:assert/strict";
import { heroPhotoIssue } from "../../lib/home.js";

test("heroPhotoIssue: no photo set is fine (the placeholder shows)", () => {
  assert.equal(heroPhotoIssue({}), null);
  assert.equal(heroPhotoIssue({ hero_image: "  " }), null);
});

test("heroPhotoIssue: a photo needs alt text", () => {
  assert.match(heroPhotoIssue({ hero_image: "/images/hero.jpg" }), /no hero_alt/);
  assert.match(heroPhotoIssue({ hero_image: "/images/hero.jpg", hero_alt: " " }), /no hero_alt/);
});

test("heroPhotoIssue: a photo whose file is missing is reported", () => {
  const issue = heroPhotoIssue({ hero_image: "/images/gone.jpg", hero_alt: "Kids at recess" }, () => false);
  assert.match(issue, /not found: \/images\/gone\.jpg/);
});

test("heroPhotoIssue: photo, alt text and file present", () => {
  assert.equal(heroPhotoIssue({ hero_image: "/images/hero.jpg", hero_alt: "Kids at recess" }, () => true), null);
});
