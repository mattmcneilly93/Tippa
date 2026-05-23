import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tippa",
    short_name: "Tippa",
    description: "Private football prediction pools for friends, families, and teams.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#101827",
    icons: [
      {
        src: "/icons/logo_192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/logo_512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
