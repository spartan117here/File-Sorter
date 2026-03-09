import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This line tells the app to use relative paths so the .exe can find the files
  base: './', 
})