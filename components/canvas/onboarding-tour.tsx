"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

const STORAGE_KEY = "softdraw:tour-done";

const steps = [
  {
    popover: {
      title: "Welcome to SoftDraw 👋",
      description:
        "A free, real-time whiteboard — no login needed. Here's a 30-second tour. You can replay it anytime from the <b>?</b> button.",
    },
  },
  {
    element: "[data-tour='toolbar']",
    popover: {
      title: "🧰 Your tools",
      description:
        "Shapes, arrows, text, pen and eraser. On desktop, number keys <b>1–9, 0</b> are shortcuts. Press and <b>drag</b> on the canvas to draw a shape — just like the pen.",
    },
  },
  {
    element: "[data-tour='ai']",
    popover: {
      title: "✨ Generate with AI",
      description:
        "Describe anything — a flowchart, ERD, class or use-case diagram — and AI lays it out for you instantly.",
    },
  },
  {
    element: "[data-tour='more']",
    popover: {
      title: "✋ More tools",
      description:
        "Frames, web embeds, laser & lasso — plus <b>Hand-gesture draw</b> (draw in the air with your webcam), <b>Insert image</b>, and <b>Wireframe → code</b>.",
    },
  },
  {
    element: "[data-tour='menu']",
    popover: {
      title: "☰ Menu",
      description:
        "Export PNG/SVG, switch light/dark theme, set the canvas background, turn Frames into a <b>presentation</b>, or paste Mermaid.",
    },
  },
  {
    element: "[data-tour='zoom']",
    popover: {
      title: "🔍 Move around",
      description:
        "On desktop: <b>Ctrl/⌘ + scroll</b> to zoom, hold <b>Space</b> (or the hand tool) to pan. On mobile: <b>pinch</b> to zoom and drag with two fingers.",
    },
  },
];

const TOUR_CSS = `
.sd-tour.driver-popover {
  background: #ffffff;
  color: #171717;
  border-radius: 16px;
  padding: 20px;
  max-width: min(92vw, 340px);
  box-shadow: 0 24px 60px rgba(0,0,0,.28);
  border: 1px solid rgba(0,0,0,.06);
}
.dark .sd-tour.driver-popover {
  background: #262626;
  color: #f5f5f5;
  border-color: rgba(255,255,255,.08);
}
.sd-tour .driver-popover-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 6px; }
.sd-tour .driver-popover-description { font-size: .9rem; line-height: 1.55; opacity: .9; }
.sd-tour .driver-popover-description b { font-weight: 700; opacity: 1; }
.sd-tour .driver-popover-progress-text { color: #6366f1; font-weight: 600; font-size: .8rem; }
.sd-tour .driver-popover-footer { margin-top: 14px; gap: 8px; }
.sd-tour .driver-popover-navigation-btns { gap: 8px; }
.sd-tour .driver-popover-next-btn,
.sd-tour .driver-popover-prev-btn {
  border: none; border-radius: 9px; padding: 7px 14px; font-weight: 600;
  font-size: .85rem; text-shadow: none; cursor: pointer; transition: background .15s;
}
.sd-tour .driver-popover-next-btn { background: #6366f1; color: #fff; }
.sd-tour .driver-popover-next-btn:hover { background: #4f46e5; }
.sd-tour .driver-popover-prev-btn { background: transparent; color: #6366f1; }
.sd-tour .driver-popover-prev-btn:hover { background: rgba(99,102,241,.1); }
.sd-tour .driver-popover-close-btn { color: #9ca3af; font-size: 1.25rem; }
.sd-tour .driver-popover-close-btn:hover { color: #171717; }
.dark .sd-tour .driver-popover-close-btn:hover { color: #fff; }
.sd-tour .driver-popover-arrow { border-color: #ffffff; }
.dark .sd-tour .driver-popover-arrow { border-color: #262626; }
`;

export function OnboardingTour() {
  const start = () => {
    driver({
      showProgress: true,
      progressText: "{{current}} of {{total}}",
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Got it 🎉",
      overlayColor: "#0f172a",
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 10,
      popoverClass: "sd-tour",
      allowClose: true,
      // Skip steps whose anchor isn't rendered/visible (e.g. hidden on mobile).
      steps: steps.filter((s) => {
        if (!s.element) return true;
        const el = document.querySelector(s.element) as HTMLElement | null;
        return !!el && el.getClientRects().length > 0;
      }),
    }).drive();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Let the menu / command palette start the tour on demand.
    const onStart = () => start();
    window.addEventListener("softdraw:start-tour", onStart);

    let t: ReturnType<typeof setTimeout> | undefined;
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, "1");
      t = setTimeout(start, 900);
    }
    return () => {
      window.removeEventListener("softdraw:start-tour", onStart);
      if (t) clearTimeout(t);
    };
  }, []);

  return (
    <>
      <style>{TOUR_CSS}</style>
      <button
        onClick={start}
        title="Help & tour"
        className="absolute bottom-20 right-3 sm:bottom-3 z-20 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-200 hover:text-black dark:hover:text-white"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    </>
  );
}
