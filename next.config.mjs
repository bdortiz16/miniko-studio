/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Permite servir los placeholders SVG locales con next/image.
    // Las imágenes son propias y de confianza.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Cachea las imágenes optimizadas al menos 7 días (cargan más rápido y
    // aguantan más tráfico sin re-optimizar a cada visita).
    minimumCacheTTL: 60 * 60 * 24 * 7,
    // Fotos subidas por el cliente a Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Cabeceras de seguridad para todo el sitio.
  async headers() {
    const security = [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
    ];
    return [
      // El panel no debe indexarse ni cachearse.
      {
        source: "/panel-mk9z3/:path*",
        headers: [
          ...security,
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
      { source: "/:path*", headers: security },
    ];
  },
};

export default nextConfig;
