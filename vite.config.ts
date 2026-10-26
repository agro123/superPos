import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'SuperPOS',
        short_name: 'SuperPOS',
        description: 'Punto de venta offline-first para pequeños negocios',
        lang: 'es-CO',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f8fafc',
        theme_color: '#4338ca',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Solo se precachean los subconjuntos latinos de Inter; el resto se cachea bajo demanda.
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2'],
        navigateFallback: '/index.html',
        // Rutas reservadas por Firebase Hosting/Auth: nunca deben resolverse con el app shell.
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname === 'firebasestorage.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'catalog-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20 } },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2023',
    sourcemap: true,
    // El SDK de Firebase (Auth + Firestore persistente + Storage + App Check) ronda 680 kB (≈200 kB gzip).
    // Va en su propio chunk precacheado; ver docs/architecture/platform-desktop.md.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Vendors estables en chunks propios: mejor caché del Service Worker entre versiones.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 20 },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
              priority: 10,
            },
            { name: 'vendor', test: /node_modules[\\/]/, priority: 0 },
          ],
        },
      },
    },
  },
});
