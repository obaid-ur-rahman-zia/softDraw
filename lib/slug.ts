import { nanoid } from "nanoid";

/** Turns a display name into a URL-safe, collision-resistant slug. */
export function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `${base || "team"}-${nanoid(6).toLowerCase()}`;
}
