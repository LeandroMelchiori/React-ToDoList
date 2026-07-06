import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/React-ToDoList/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost:3000/React-ToDoList/',
      },
    },
    globals: true,
    setupFiles: './src/setupTests.js',
  },
});
