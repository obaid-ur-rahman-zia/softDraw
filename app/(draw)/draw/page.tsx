import { redirect } from "next/navigation";

// The guest whiteboard now lives at the root "/". Keep this path as a
// backwards-compatible alias.
export default function DrawPage() {
  redirect("/");
}
