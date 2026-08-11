import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  createdAt: string;
}

interface Invoice {
  _id: string;
  number: string;
  billTo: string;
  total: number;
  paymentStage: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      navigate("/admin/login");
      return;
    }

    fetchData(token);
  }, [navigate]);

  const fetchData = async (token: string) => {
    try {
      const [contactsRes, invoicesRes] = await Promise.all([
        fetch("/api/contact", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData);
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
            color: "rgba(255,255,255,0.6)",
          }}
        >
          Loading...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.05))",
            border: "1px solid rgba(99, 102, 241, 0.2)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Total Contacts</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#fff" }}>{contacts.length}</p>
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))",
            border: "1px solid rgba(16, 185, 129, 0.2)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Total Invoices</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#fff" }}>{invoices.length}</p>
        </div>

        <div
          style={{
            padding: 24,
            borderRadius: 16,
            background: "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))",
            border: "1px solid rgba(245, 158, 11, 0.2)",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>Revenue</p>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 700, color: "#fff" }}>
            {formatCurrency(invoices.reduce((sum, inv) => sum + inv.total, 0))}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: 24,
        }}
      >
        {/* Recent Contacts */}
        <div
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>Recent Contacts</h2>
            <button
              onClick={() => navigate("/admin/contacts")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                background: "rgba(99, 102, 241, 0.15)",
                color: "#818cf8",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              View All
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {contacts.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40, fontSize: 14 }}>
                No contacts yet
              </p>
            ) : (
              contacts.slice(0, 5).map((contact) => (
                <div
                  key={contact._id}
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{contact.name}</p>
                      <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{contact.email}</p>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{formatDate(contact.createdAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div
          style={{
            borderRadius: 16,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>Recent Invoices</h2>
            <button
              onClick={() => navigate("/admin/invoices")}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10b981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              View All
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {invoices.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", padding: 40, fontSize: 14 }}>
                No invoices yet
              </p>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <div
                  key={invoice._id}
                  style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{invoice.number}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{invoice.billTo}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>
                      {formatCurrency(invoice.total)}
                    </p>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: 12,
                        background:
                          invoice.paymentStage === "full" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: invoice.paymentStage === "full" ? "#10b981" : "#f59e0b",
                        fontSize: 11,
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      {invoice.paymentStage.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}