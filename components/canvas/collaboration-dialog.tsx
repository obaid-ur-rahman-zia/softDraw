"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Play, LogOut, Users, Lock } from "lucide-react";
import { getGuestName, setGuestName, roomUrl } from "@/lib/collab";

interface CollaborationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when a live session is active (rendered inside the room). */
  roomId?: string | null;
  /** Start a new session from a local board. */
  onStart?: (name: string) => void;
  /** Leave / stop the current session. */
  onStop?: () => void;
}

export function CollaborationDialog({
  open,
  onOpenChange,
  roomId,
  onStart,
  onStop,
}: CollaborationDialogProps) {
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);

  const active = !!roomId;
  const link = roomId ? roomUrl(roomId) : "";

  useEffect(() => {
    if (open) setName(getGuestName());
  }, [open]);

  // Persist the name so the presence label + future sessions use it.
  useEffect(() => {
    if (name.trim()) setGuestName(name.trim());
  }, [name]);

  useEffect(() => {
    if (!active || !link) {
      setQr(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(link, { width: 220, margin: 1 })
      .then((url) => !cancelled && setQr(url))
      .catch(() => !cancelled && setQr(null));
    return () => {
      cancelled = true;
    };
  }, [active, link]);

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-500">
            <Users className="h-5 w-5" /> Live collaboration
          </DialogTitle>
          <DialogDescription>
            {active
              ? "Share this link or QR code. Anyone who opens it can draw with you in real time."
              : "Invite people to collaborate on your drawing in real time."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Your name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
          />
        </div>

        {active ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Link</label>
              <div className="flex gap-2">
                <Input readOnly value={link} className="text-xs" />
                <Button onClick={copy} className="shrink-0">
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>

            {qr && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qr}
                  alt="Room QR code"
                  className="rounded-lg border bg-white p-2"
                  width={220}
                  height={220}
                />
              </div>
            )}

            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Anyone with this link can join and edit. Stopping the session
              disconnects you but keeps the drawing on your screen.
            </p>

            <Button variant="destructive" className="w-full" onClick={onStop}>
              <LogOut className="h-4 w-4" /> Stop session
            </Button>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => onStart?.(name.trim() || "Guest")}
          >
            <Play className="h-4 w-4" /> Start session
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
