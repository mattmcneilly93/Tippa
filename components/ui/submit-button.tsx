"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = ButtonProps & {
  idleText: string;
  pendingText?: string;
  successText?: string;
};

export function SubmitButton({
  idleText,
  pendingText = "Saving...",
  successText = "Saved",
  className,
  children,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const [saved, setSaved] = useState(false);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setSaved(true);
      const timeout = window.setTimeout(() => setSaved(false), 1500);
      return () => window.clearTimeout(timeout);
    }
    wasPending.current = pending;
  }, [pending]);

  const variant = saved ? "success" : props.variant;

  return (
    <Button type="submit" className={className} disabled={pending || props.disabled} {...props} variant={variant}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
      {pending ? pendingText : saved ? successText : children ?? idleText}
    </Button>
  );
}
