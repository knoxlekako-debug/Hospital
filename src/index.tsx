import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // Asegúrate de que App.tsx esté en src/
import './index.css'    // IMPORTANTE: Esto carga los estilos globales y Tailwind

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
