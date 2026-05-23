import type { TournamentTheme } from "@/lib/tournaments/types";

export function TournamentThemeProvider({
  theme,
  children
}: {
  theme: TournamentTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      style={
        {
          "--tippa-primary": theme.primary,
          "--tippa-secondary": theme.secondary,
          "--tippa-accent": theme.accent,
          "--tippa-background": theme.background,
          "--tippa-surface": theme.surface,
          "--tippa-text": theme.text
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
