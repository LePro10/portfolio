import type { NextConfig } from "next";

// Rein statischer Export: Caddy liefert out/ aus, im Betrieb läuft kein Node.
// Weiterleitungen alter Adressen stehen deshalb in deploy/Caddyfile.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  poweredByHeader: false,
};

export default nextConfig;
