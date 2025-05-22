import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/turnos2-app/', // Asegurarnos de que coincida con el nombre del repositorio
})