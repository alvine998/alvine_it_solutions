import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import InvoiceGenerator from './pages/InvoiceGenerator.tsx'
import AdminLogin from './pages/AdminLogin.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import AdminContacts from './pages/AdminContacts.tsx'
import AdminInvoices from './pages/AdminInvoices.tsx'
import AdminCustomers from './pages/AdminCustomers.tsx'
import AdminCustomerDetail from './pages/AdminCustomerDetail.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/generate/invoice" element={<InvoiceGenerator />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/contacts" element={<AdminContacts />} />
        <Route path="/admin/invoices" element={<AdminInvoices />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/customers/:id" element={<AdminCustomerDetail />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
