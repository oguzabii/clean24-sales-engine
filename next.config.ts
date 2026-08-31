import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep nodemailer (a Node-only package) out of the bundler so it loads
  // natively in the Node.js runtime used by the email API routes.
  serverExternalPackages: ["nodemailer"],

  /**
   * Temporary 307 redirects for the older local SEO routes.
   * These pages still use the legacy visual style; while we align them with
   * the new premium design, they should redirect to the main page so users
   * always land on the new experience.
   *
   * `permanent: false` → HTTP 307 (temporary). Easy to revert by removing
   * these entries; SEO impact is reversible.
   */
  async redirects() {
    return [
      { source: "/umzugsreinigung-zuerich", destination: "/", permanent: false },
      { source: "/umzugsreinigung-limmattal", destination: "/", permanent: false },
      { source: "/umzugsreinigung-dietikon", destination: "/", permanent: false },
      { source: "/umzugsreinigung-schlieren", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
