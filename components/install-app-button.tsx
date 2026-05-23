"use client";

import { useEffect, useState } from "react";
import { Download, Share, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean(navigator.standalone))
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isAndroid() {
  return /android/i.test(navigator.userAgent);
}

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    if (isIos()) {
      setPlatform("ios");
      return;
    }

    if (!isAndroid()) return;
    setPlatform("android");

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!platform) return null;
  if (platform === "android" && !installPrompt) return null;

  async function installAndroidApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome !== "dismissed") setInstallPrompt(null);
  }

  if (platform === "ios") {
    return (
      <div className="space-y-2">
        <Button type="button" variant="outline" size="lg" onClick={() => setShowIosHelp((value) => !value)}>
          <Smartphone className="h-5 w-5" />
          Add to Home Screen
        </Button>
        {showIosHelp ? (
          <div className="max-w-sm rounded-2xl border bg-background p-3 text-sm font-semibold text-muted-foreground shadow-sm">
            <span className="inline-flex items-center gap-1 text-foreground">
              <Share className="h-4 w-4" />
              Share
            </span>{" "}
            then choose <span className="text-foreground">Add to Home Screen</span>.
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <Button type="button" variant="outline" size="lg" onClick={installAndroidApp}>
      <Download className="h-5 w-5" />
      Install app
    </Button>
  );
}
