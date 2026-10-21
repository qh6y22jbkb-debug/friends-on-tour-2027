import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages zet de app onder /<reponaam>/.
const BASIS = '/friends-on-tour-2027/'

export default defineConfig({
  base: BASIS,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icoon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Friends on Tour 2027',
        short_name: 'Friends on Tour',
        description: "Een weekend weg met z'n vijven.",
        lang: 'nl',
        start_url: BASIS,
        scope: BASIS,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f0eeea',
        theme_color: '#f0eeea',
        icons: [
          { src: 'icoon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icoon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icoon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
