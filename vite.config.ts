import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    preview: {
      host: '0.0.0.0',  // ✅ required for Render
      port: process.env.PORT || 4173,  // ✅ use Render’s dynamic port
      allowedHosts: ['optivlive.onrender.com']  // ✅ whitelist your Render domain
    }
  };
});
