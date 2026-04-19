import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },

  async redirects() {
    return [
      {
        source: "/",
        destination: "/ask",
        permanent: true,
      },
    ];
  },

  serverExternalPackages: ["@coral-xyz/anchor"],

  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({
      "@coral-xyz/anchor": "commonjs @coral-xyz/anchor",
    });

    config.module.rules.push({
      test: /node_modules[\\/]@nosana[\\/]sdk[\\/]/,
      resolve: { fullySpecified: false },
    });

    return config;
  },

  turbopack: {
    resolveAlias: {
      "@nosana/sdk": { browser: "@nosana/sdk" },
    },
  },
};

export default nextConfig;
