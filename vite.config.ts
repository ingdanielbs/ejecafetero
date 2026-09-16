import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    // WebXR en dispositivos remotos (Quest) requiere HTTPS o localhost.
    // Usa `npm run preview` detrás de un túnel HTTPS, o Vite con certificados locales.
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
