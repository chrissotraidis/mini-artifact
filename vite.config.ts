import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        proxy: {
            // Proxy Anthropic API calls to bypass CORS in local dev
            '/api/anthropic': {
                target: 'https://api.anthropic.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
                headers: {
                    'anthropic-dangerous-direct-browser-access': 'true',
                },
            },
            // Proxy OpenAI API calls to bypass CORS in local dev
            '/api/openai': {
                target: 'https://api.openai.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/openai/, ''),
            },
        },
    },
});
