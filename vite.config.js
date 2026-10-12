import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icoon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Operatie Mysterieweekend',
        short_name: 'Operatie',
        description: 'Een geheim weekend',
        lang: 'nl',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0710',
        theme_color: '#1a0f2b',
        icons: [
          { src: 'icoon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icoon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icoon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // De API mag nooit uit de cache komen: geheime data alleen live van de server.
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:8787' },
  },
})
