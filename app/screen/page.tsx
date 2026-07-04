"use client";

import { useEffect } from "react";
import { ScreenDraw } from "@/components/draw/screen-draw";

// Transparent full-screen annotator. Loaded inside the SoftDraw desktop overlay
// (Electron) to draw over anything on screen — Epic Pen style.
export default function ScreenPage() {
  useEffect(() => {
    const prevHtml = document.documentElement.style.background;
    const prevBody = document.body.style.background;
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    return () => {
      document.documentElement.style.background = prevHtml;
      document.body.style.background = prevBody;
    };
  }, []);

  return <ScreenDraw />;
}
