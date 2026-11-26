import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const rawSiteUrl =
      env.VITE_PUBLIC_URL ||
      env.SITE_URL ||
      env.URL ||
      (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
      (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : '');
    const normalizedBase = rawSiteUrl ? rawSiteUrl.replace(/\/+$/, '') : '';
    const ogImageUrl = normalizedBase
      ? `${normalizedBase}/og-black-friday-mdf.jpg?v=2`
      : '/og-black-friday-mdf.jpg?v=2';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        {
          name: 'inject-og-image-url',
          transformIndexHtml(html) {
            return html.replace(/%OG_IMAGE_URL%/g, ogImageUrl);
          },
        },
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
