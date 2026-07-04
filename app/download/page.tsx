import Link from "next/link";
import Image from "next/image";
import { AuroraBackground } from "@/components/reactbits/aurora-background";
import { GradientText } from "@/components/reactbits/gradient-text";
import { Button } from "@/components/ui/button";
import {
  Download,
  MonitorSmartphone,
  Highlighter,
  Layers,
  Keyboard,
  ArrowLeft,
} from "lucide-react";

export const metadata = {
  title: "Download SoftDraw Screen Pen — draw on your screen",
  description:
    "Get the SoftDraw desktop app and annotate anything on your screen, Epic Pen style.",
};

const RELEASES =
  "https://github.com/obaid-ur-rahman-zia/softDraw/releases/latest";

const FEATURES = [
  {
    icon: MonitorSmartphone,
    title: "Draw over anything",
    body: "A transparent overlay sits on top of every app — slides, browsers, videos.",
  },
  {
    icon: Highlighter,
    title: "Pen & highlighter",
    body: "Seven colors, three brush sizes, and a translucent highlighter.",
  },
  {
    icon: Layers,
    title: "Always on top",
    body: "Toggle pass-through to use your desktop, then jump back to drawing.",
  },
  {
    icon: Keyboard,
    title: "Global shortcuts",
    body: "Ctrl+Alt+D to draw, Ctrl+Alt+C to clear, Ctrl+Alt+Q to quit.",
  },
];

export default function DownloadPage() {
  return (
    <AuroraBackground className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to whiteboard
        </Link>

        <div className="mt-16 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg">
            <Image src="/logo.svg" alt="SoftDraw" width={40} height={40} />
          </div>
          <span className="inline-block rounded-full border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300">
            Desktop app · Windows / macOS / Linux
          </span>
          <h1 className="mt-5 text-5xl sm:text-6xl font-extrabold tracking-tight">
            Draw on your <GradientText>whole screen</GradientText>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            SoftDraw Screen Pen turns your desktop into a canvas — annotate
            presentations, tutorials and meetings over any app, Epic Pen style.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="gap-2 bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white hover:opacity-90 shadow-lg"
            >
              <a href={RELEASES} target="_blank" rel="noopener noreferrer">
                <Download className="h-5 w-5" /> Download for Windows
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link href="/screen">
                <Highlighter className="h-5 w-5" /> Try in the browser
              </Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Free & open source. No account required.
          </p>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-5"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-6">
          <h2 className="font-semibold text-lg">Keyboard shortcuts</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-3 text-sm">
            {[
              ["Ctrl + Alt + D", "Draw ↔ Pass-through"],
              ["Ctrl + Alt + C", "Clear the drawing"],
              ["Ctrl + Alt + Q", "Quit"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-lg bg-neutral-100 dark:bg-neutral-800 px-3 py-2"
              >
                <kbd className="font-mono text-xs">{k}</kbd>
                <span className="text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AuroraBackground>
  );
}
