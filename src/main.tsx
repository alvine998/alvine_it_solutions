import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import InvoiceGenerator from './pages/InvoiceGenerator.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/generate/invoice" element={<InvoiceGenerator />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
