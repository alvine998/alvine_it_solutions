const API_BASE_URL = "/api";

export async function submitContact(data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  budget?: string;
  message: string;
}) {
  const response = await fetch(`${API_BASE_URL}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to submit contact");
  }

  return response.json();
}

export async function createInvoice(data: any) {
  const response = await fetch(`${API_BASE_URL}/invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create invoice");
  }

  return response.json();
}

export async function getInvoices() {
  const response = await fetch(`${API_BASE_URL}/invoices`);

  if (!response.ok) {
    throw new Error("Failed to fetch invoices");
  }

  return response.json();
}

export async function getInvoice(id: string) {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch invoice");
  }

  return response.json();
}

export async function updateInvoice(id: string, data: any) {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update invoice");
  }

  return response.json();
}

export async function deleteInvoice(id: string) {
  const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete invoice");
  }

  return response.json();
}

export async function getMarketplaceItems(params?: { status?: string; category?: string; search?: string; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.category) qs.set("category", params.category);
  if (params?.search) qs.set("search", params.search);
  if (params?.limit) qs.set("limit", String(params.limit));
  const response = await fetch(`${API_BASE_URL}/marketplace?${qs.toString()}`);
  if (!response.ok) throw new Error("Failed to fetch marketplace items");
  return response.json();
}

export async function getMarketplaceItem(id: string) {
  const response = await fetch(`${API_BASE_URL}/marketplace/${id}`);
  if (!response.ok) throw new Error("Failed to fetch marketplace item");
  return response.json();
}