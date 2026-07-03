"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { HelpCircle } from "lucide-react";

const STORAGE_KEY = "softdraw:tour-done";

const steps = [
  {
    popover: {
      title: "Welcome to SoftDraw ✏️",
      description:
        "A quick 30-second tour of the whiteboard. You can replay it anytime from the ? button.",
    },
  },
  {
    element: "[data-tour='toolbar']",
    popover: {
      title: "Tools",
      description:
        "Shapes, arrows, text, pen and eraser. Number keys (1–9, 0) are shortcuts. To draw a shape, press and drag on the canvas — just like the pen.",
    },
  },
  {
    element: "[data-tour='ai']",
    popover: {
      title: "Generate with AI",
      description:
        "Describe anything — flowchart, ERD, class diagram — and AI builds a clean, laid-out diagram for you.",
    },
  },
  {
    element: "[data-tour='menu']",
    popover: {
      title: "Menu",
      description:
        "Export as PNG/SVG, switch light/dark theme, set the canvas background, or paste Mermaid to generate a diagram.",
    },
  },
  {
    element: "[data-tour='zoom']",
    popover: {
      title: "Zoom & pan",
      description:
        "Ctrl/⌘ + scroll to zoom, and hold Space (or the hand tool) to pan around the canvas.",
    },
  },
];

export function OnboardingTour() {
  const start = () => {
    driver({
      showProgress: true,
      nextBtnText: "Next →",
      prevBtnText: "← Back",
      doneBtnText: "Done",
      steps,
    }).drive();
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, "1");
      const t = setTimeout(start, 900);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <button
      onClick={start}
      title="Help & tour"
      className="absolute bottom-3 right-3 z-20 h-9 w-9 rounded-full bg-white dark:bg-neutral-800 shadow-md flex items-center justify-center text-neutral-600 dark:text-neutral-200 hover:text-black dark:hover:text-white"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  );
}
