import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  modules: [
    "@nuxt/icon",
    "@nuxt/image",
    "@nuxt/scripts",
    "@nuxthub/core",
    "@nuxtjs/device",
    "@nuxtjs/fontaine",
    "@nuxtjs/google-fonts",
    "@nuxtjs/color-mode",
    "@nuxtjs/seo"
  ],

  devtools: { enabled: true },
  ssr: true,

  runtimeConfig: {
    public: {
      baseUrl: process.env.VITE_BASE_URL || "https://markdownforagents.com",
      apiBase: process.env.VITE_API_BASE || "http://localhost:8787"
    }
  },

  nitro: {
    preset: "cloudflare-pages",
    compressPublicAssets: true
  },

  css: ["./app/assets/css/main.css"],

  vite: {
    plugins: [tailwindcss()]
  },

  app: {
    head: {
      charset: "utf-8",
      viewport: "width=device-width, initial-scale=1",
      title: "Markdown for Agents",
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        { rel: "icon", type: "image/png", href: "/favicon.png" }
      ],
      meta: [
        { property: "og:image", content: "https://markdownforagents.com/og.png" },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: "https://markdownforagents.com/og.png" }
      ]
    }
  },

  googleFonts: {
    families: {
      "Inter": [400, 500, 600, 700, 800, 900],
      "JetBrains Mono": [400, 500, 700]
    },
    display: "swap",
    preload: true,
    preconnect: true,
    download: true,
    inject: true
  },

  colorMode: {
    preference: "dark",
    fallback: "dark",
    classSuffix: ""
  },

  site: {
    url: process.env.VITE_BASE_URL || "https://markdownforagents.com",
    name: "Markdown for Agents",
    description: "Convert any URL into clean, structured markdown — optimized for AI agents.",
    trailingSlash: false
  },

  robots: { allow: "/" },

  compatibilityDate: "2024-07-15"
});
