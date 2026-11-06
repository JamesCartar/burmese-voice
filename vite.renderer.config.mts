import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const nonce = randomBytes(16).toString('base64');

export default defineConfig({
  html: { cspNonce: nonce },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'content-security-policy-nonce',
      transformIndexHtml: {
        order: 'post',
        handler: (html) => html.replaceAll('__VOICE_NONCE__', nonce),
      },
    },
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
