import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tippa",
    short_name: "Tippa",
    description: "A private family football tournament prediction game.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#101827",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
