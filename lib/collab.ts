import { nanoid } from "nanoid";

/** Guest collaboration rooms use this id prefix; the liveblocks-auth route
 * grants anyone with the link full access to such rooms. */
export const GUEST_ROOM_PREFIX = "guest-";

export const newGuestRoomId = () => `${GUEST_ROOM_PREFIX}${nanoid(12)}`;

export const roomUrl = (roomId: string) =>
  typeof window !== "undefined"
    ? `${window.location.origin}/r/${roomId}`
    : `/r/${roomId}`;

const ADJECTIVES = [
  "Incredible",
  "Curious",
  "Brave",
  "Clever",
  "Gentle",
  "Swift",
  "Bright",
  "Jolly",
  "Mighty",
  "Cosmic",
  "Fuzzy",
  "Nimble",
];
const ANIMALS = [
  "Beaver",
  "Otter",
  "Falcon",
  "Panda",
  "Fox",
  "Lynx",
  "Heron",
  "Koala",
  "Wolf",
  "Badger",
  "Raven",
  "Turtle",
];

/** A friendly random display name like "Incredible Beaver". */
export function randomGuestName() {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const b = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${a} ${b}`;
}

const NAME_KEY = "softdraw:name";

/** Persisted guest display name (localStorage + a cookie the auth route reads). */
export function getGuestName(): string {
  if (typeof window === "undefined") return "Guest";
  let name = localStorage.getItem(NAME_KEY);
  if (!name) {
    name = randomGuestName();
    setGuestName(name);
  }
  return name;
}

export function setGuestName(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NAME_KEY, name);
  // Cookie is read server-side by /api/liveblocks-auth to label the presence.
  document.cookie = `sd_name=${encodeURIComponent(name)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
