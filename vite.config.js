import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command }) => ({
  //base: command === 'serve' ? '/' : '/',
  base: '/',
  // config options
  plugins: [
    tailwindcss(),
    VitePWA({
      includeAssets: ['logo.svg', 'vite.svg'],
      manifest: {
        name: 'ServControl',
        short_name: 'ServControl',
        description: 'ServControl Application',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'logo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      }
    })
  ],
}))