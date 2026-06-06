import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "mr + mrs m mundial",
    short_name: "mundial",
    description: "Private football prediction pools for friends, families, and teams.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#002FA7",
    icons: [
      {
        src: "/icons/mmm-favicon.png?v=3",
        sizes: "450x450",
        type: "image/png",
        purpose: "any"
      }
    ]
  };
}
