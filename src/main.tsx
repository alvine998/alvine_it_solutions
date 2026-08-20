import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './i18n'
import './index.css'
import App from './App.tsx'
import InvoiceGenerator from './pages/InvoiceGenerator.tsx'
import Auth from './pages/Auth.tsx'
import CustomerLayout from './components/CustomerLayout.tsx'
import CustomerDashboardPage from './pages/customer/Dashboard.tsx'
import CustomerChat from './pages/customer/Chat.tsx'
import CustomerUsage from './pages/customer/Usage.tsx'
import CustomerOrders from './pages/customer/Orders.tsx'
import CustomerDocumentation from './pages/customer/Documentation.tsx'
import CustomerIntegration from './pages/customer/Integration.tsx'
import CustomerApiKeys from './pages/customer/ApiKeys.tsx'
import CustomerProfile from './pages/customer/Profile.tsx'
import AdminLogin from './pages/AdminLogin.tsx'
import AdminDashboard from './pages/AdminDashboard.tsx'
import AdminContacts from './pages/AdminContacts.tsx'
import AdminInvoices from './pages/AdminInvoices.tsx'
import AdminCustomers from './pages/AdminCustomers.tsx'
import AdminCustomerDetail from './pages/AdminCustomerDetail.tsx'
import AdminRouterCustomers from './pages/AdminRouterCustomers.tsx'
import AdminRouterModels from './pages/AdminRouterModels.tsx'
import AdminCustomerPlans from './pages/AdminCustomerPlans.tsx'
import AdminPlans from './pages/AdminPlans.tsx'
import AdminPaymentMethods from './pages/AdminPaymentMethods.tsx'
import AdminOrders from './pages/AdminOrders.tsx'
import AdminSettings from './pages/AdminSettings.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboardPage />} />
          <Route path="chat" element={<CustomerChat />} />
          <Route path="usage" element={<CustomerUsage />} />
          <Route path="orders" element={<CustomerOrders />} />
          <Route path="billing" element={<CustomerOrders />} />
          <Route path="documentation" element={<CustomerDocumentation />} />
          <Route path="integration" element={<CustomerIntegration />} />
          <Route path="api-keys" element={<CustomerApiKeys />} />
          <Route path="profile" element={<CustomerProfile />} />
        </Route>
        <Route path="/generate/invoice" element={<InvoiceGenerator />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/contacts" element={<AdminContacts />} />
        <Route path="/admin/invoices" element={<AdminInvoices />} />
        <Route path="/admin/customers" element={<AdminCustomers />} />
        <Route path="/admin/customers/:id" element={<AdminCustomerDetail />} />
        <Route path="/admin/router-customers" element={<AdminRouterCustomers />} />
        <Route path="/admin/router-models" element={<AdminRouterModels />} />
        <Route path="/admin/customer-plans" element={<AdminCustomerPlans />} />
        <Route path="/admin/plans" element={<AdminPlans />} />
        <Route path="/admin/payment-methods" element={<AdminPaymentMethods />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
