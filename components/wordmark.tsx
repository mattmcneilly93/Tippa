import { cn } from "@/lib/utils";

/**
 * Brand wordmark — a two-line lockup echoing the mmmagasin logo:
 *   mr + mrs m
 *     mundial
 * Rendered as gradient (Klein Blue -> light blue) clipped text. Scales with the
 * parent font-size via em units, so it works in both the header and the hero.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      aria-label="mr + mrs m mundial"
      className={cn(
        "inline-flex select-none flex-col items-center leading-[0.95]",
        "bg-gradient-to-r from-[#002fa7] via-[#2f6bff] to-[#7db4ff] bg-clip-text text-transparent",
        className
      )}
    >
      <span className="pl-[0.3em] text-[0.62em] font-semibold tracking-[0.3em]">
        mr + mrs m
      </span>
      <span className="pl-[0.12em] text-[1.5em] font-black tracking-[0.12em]">
        mundial
      </span>
    </span>
  );
}
