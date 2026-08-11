import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createInvoice, getInvoice, updateInvoice } from "../lib/api";
import "./InvoiceGenerator.css";

type LineItem = {
  id: number;
  description: string;
  qty: number;
  rate: number;
};

type PaymentStage = "full" | "dp" | "final";
type PaymentMethod = "bank" | "ewallet" | "cash" | "other";

type InvoiceMeta = {
  number: string;
  issuedOn: string;
  dueOn: string;
  from: string;
  fromDetail: string;
  billTo: string;
  billToDetail: string;
  notes: string;
  taxPercent: number;
  discount: number;
  paymentStage: PaymentStage;
  dpPercent: number;
  paymentMethod: PaymentMethod;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ewalletName: string;
  ewalletNumber: string;
  paymentInstructions: string;
};

let nextItemId = 3;

function today(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

const defaultMeta: InvoiceMeta = {
  number: `INV-${new Date().getFullYear()}-001`,
  issuedOn: today(),
  dueOn: today(14),
  from: "Alvine IT Solution",
  fromDetail: "alvinecom2018@gmail.com\nIndonesia",
  billTo: "Client name",
  billToDetail: "Company\nAddress line\nEmail",
  notes: "Payment within 14 days by bank transfer. Include the invoice number in the transfer reference.",
  taxPercent: 11,
  discount: 0,
  paymentStage: "full",
  dpPercent: 50,
  paymentMethod: "bank",
  bankName: "Bank Central Asia (BCA)",
  bankAccountName: "Alvine Yoga Pratama",
  bankAccountNumber: "1234567890",
  ewalletName: "",
  ewalletNumber: "",
  paymentInstructions: "",
};

const defaultItems: LineItem[] = [
  { id: 1, description: "Website design and build", qty: 1, rate: 15000000 },
  { id: 2, description: "Deployment and handoff", qty: 1, rate: 2500000 },
];

const formatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return formatter.format(Number.isFinite(value) ? value : 0);
}

function formatDate(value: string) {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function InvoiceGenerator() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);

  const [meta, setMeta] = useState<InvoiceMeta>(defaultMeta);
  const [items, setItems] = useState<LineItem[]>(defaultItems);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (!editId) return;
    setIsLoading(true);
    getInvoice(editId)
      .then((data: any) => {
        const { _id, __v, createdAt, updatedAt, items: serverItems, ...rest } = data;
        setMeta({ ...defaultMeta, ...rest });
        setItems(
          (serverItems || []).map((item: any, i: number) => ({
            id: i + 1,
            description: item.description || "",
            qty: item.qty || 0,
            rate: item.rate || 0,
          })),
        );
        nextItemId = (serverItems || []).length + 1;
      })
      .catch(() => {
        setSaveStatus("error");
      })
      .finally(() => setIsLoading(false));
  }, [editId]);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0),
    [items],
  );
  const taxAmount = subtotal * ((meta.taxPercent || 0) / 100);
  const total = Math.max(subtotal + taxAmount - (meta.discount || 0), 0);

  const dpPercent = Math.min(Math.max(meta.dpPercent || 0, 0), 100);
  const dpAmount = Math.round(total * (dpPercent / 100));
  const remainingAmount = total - dpAmount;
  const dueNow =
    meta.paymentStage === "dp" ? dpAmount : meta.paymentStage === "final" ? remainingAmount : total;

  const stageLabel =
    meta.paymentStage === "dp"
      ? `${t("invoice.downPayment")} (${dpPercent}%)`
      : meta.paymentStage === "final"
        ? `${t("invoice.finalPayment")} (${100 - dpPercent}%)`
        : null;

  const setField = <K extends keyof InvoiceMeta>(key: K, value: InvoiceMeta[K]) =>
    setMeta((current) => ({ ...current, [key]: value }));

  const setItemField = (id: number, patch: Partial<LineItem>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addItem = () =>
    setItems((current) => [...current, { id: nextItemId++, description: "", qty: 1, rate: 0 }]);

  const removeItem = (id: number) =>
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus("idle");

    try {
      const invoiceData = {
        ...meta,
        items: items.map(({ id, ...item }) => item),
      };
      if (isEditMode && editId) {
        await updateInvoice(editId, invoiceData);
      } else {
        await createInvoice(invoiceData);
      }
      setSaveStatus("success");
      if (isEditMode) {
        setTimeout(() => navigate("/admin/invoices"), 800);
      } else {
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="invoice-page">
      <header className="invoice-topbar">
        <Link className="invoice-back" to={isEditMode ? "/admin/invoices" : "/"}>
          <img className="invoice-logo" src="/images/logo.png" alt="" width={29} height={29} />
          {isEditMode ? t("invoice.backToInvoices") : "Alvine IT Solution"}
        </Link>
        <div className="invoice-topbar-actions">
          <span className="invoice-hint">{t("invoice.hint")}</span>
          {saveStatus === "success" && (
            <span style={{ color: "#10b981", fontSize: 14 }}>{t("invoice.saved")}</span>
          )}
          {saveStatus === "error" && (
            <span style={{ color: "#ef4444", fontSize: 14 }}>{t("invoice.saveError")}</span>
          )}
          <button
            type="button"
            className="invoice-save-button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "Inter, sans-serif",
              cursor: isSaving || isLoading ? "not-allowed" : "pointer",
              border: "none",
              opacity: isSaving || isLoading ? 0.7 : 1,
            }}
          >
            {isSaving ? t("invoice.saving") : isEditMode ? t("invoice.updateButton") : t("invoice.saveButton")}
          </button>
          <button type="button" className="invoice-print-button" onClick={() => window.print()}>
            {t("invoice.printButton")}
          </button>
        </div>
      </header>

      <div className="invoice-layout">
        <section className="invoice-form" aria-label="Invoice details form">
          <h1>{isEditMode ? t("invoice.editTitle") : t("invoice.title")}</h1>
          <p className="invoice-form-lead">
            {t("invoice.lead")}
          </p>

          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
              Loading invoice...
            </div>
          ) : (<>

          <fieldset>
            <legend>{t("invoice.document")}</legend>
            <div className="field-row">
              <label>
                {t("invoice.invoiceNumber")}
                <input
                  value={meta.number}
                  onChange={(event) => setField("number", event.target.value)}
                />
              </label>
              <label>
                {t("invoice.issuedOn")}
                <input
                  type="date"
                  value={meta.issuedOn}
                  onChange={(event) => setField("issuedOn", event.target.value)}
                />
              </label>
              <label>
                {t("invoice.dueOn")}
                <input
                  type="date"
                  value={meta.dueOn}
                  onChange={(event) => setField("dueOn", event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("invoice.parties")}</legend>
            <div className="field-row field-row-2">
              <label>
                {t("invoice.from")}
                <input value={meta.from} onChange={(event) => setField("from", event.target.value)} />
              </label>
              <label>
                {t("invoice.billTo")}
                <input value={meta.billTo} onChange={(event) => setField("billTo", event.target.value)} />
              </label>
              <label>
                {t("invoice.fromDetails")}
                <textarea
                  rows={3}
                  value={meta.fromDetail}
                  onChange={(event) => setField("fromDetail", event.target.value)}
                />
              </label>
              <label>
                {t("invoice.billToDetails")}
                <textarea
                  rows={3}
                  value={meta.billToDetail}
                  onChange={(event) => setField("billToDetail", event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>{t("invoice.lineItems")}</legend>
            <div className="item-rows">
              {items.map((item, index) => (
                <div className="item-row" key={item.id}>
                  <label>
                    <span className="visually-hidden">{t("invoice.itemDescription", { index: index + 1 })}</span>
                    <input
                      placeholder={t("invoice.description")}
                      value={item.description}
                      onChange={(event) => setItemField(item.id, { description: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="visually-hidden">{t("invoice.itemQuantity", { index: index + 1 })}</span>
                    <input
                      type="number"
                      min={0}
                      placeholder={t("invoice.qty")}
                      value={item.qty}
                      onChange={(event) => setItemField(item.id, { qty: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span className="visually-hidden">{t("invoice.itemRate", { index: index + 1 })}</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder={t("invoice.rate")}
                      value={item.rate}
                      onChange={(event) => setItemField(item.id, { rate: Number(event.target.value) })}
                    />
                  </label>
                  <button
                    type="button"
                    className="item-remove"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    aria-label={t("invoice.removeItem")}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="item-add" onClick={addItem}>
              {t("invoice.addLineItem")}
            </button>
          </fieldset>

          <fieldset>
            <legend>{t("invoice.paymentPlan")}</legend>
            <div className="stage-picker" role="radiogroup" aria-label={t("invoice.paymentPlan")}>
              {(
                [
                  { value: "full", label: t("invoice.fullAmount") },
                  { value: "dp", label: t("invoice.downPayment") },
                  { value: "final", label: t("invoice.finalPayment") },
                ] as const
              ).map((option) => (
                <label key={option.value} className="stage-option">
                  <input
                    type="radio"
                    name="payment-stage"
                    value={option.value}
                    checked={meta.paymentStage === option.value}
                    onChange={() => setField("paymentStage", option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {meta.paymentStage !== "full" ? (
              <div className="field-row dp-row">
                <label>
                  {t("invoice.dpPercentage")}
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={meta.dpPercent}
                    onChange={(event) => setField("dpPercent", Number(event.target.value))}
                  />
                </label>
                <div className="dp-summary">
                  <div>
                    <span>{t("invoice.dp")} ({dpPercent}%)</span>
                    <strong>{formatMoney(dpAmount)}</strong>
                  </div>
                  <div>
                    <span>{t("invoice.remaining")} ({100 - dpPercent}%)</span>
                    <strong>{formatMoney(remainingAmount)}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>{t("invoice.adjustmentsNotes")}</legend>
            <div className="field-row">
              <label>
                {t("invoice.tax")}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={meta.taxPercent}
                  onChange={(event) => setField("taxPercent", Number(event.target.value))}
                />
              </label>
              <label>
                {t("invoice.discount")}
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={meta.discount}
                  onChange={(event) => setField("discount", Number(event.target.value))}
                />
              </label>
            </div>
            <label>
              {t("invoice.notesTerms")}
              <textarea
                rows={3}
                value={meta.notes}
                onChange={(event) => setField("notes", event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>{t("invoice.paymentDetails")}</legend>
            <div className="payment-method-picker" role="radiogroup" aria-label={t("invoice.paymentMethod")}>
              {(
                [
                  { value: "bank", label: t("invoice.bankTransfer") },
                  { value: "ewallet", label: t("invoice.eWallet") },
                  { value: "cash", label: t("invoice.cash") },
                  { value: "other", label: t("invoice.other") },
                ] as const
              ).map((option) => (
                <label key={option.value} className="payment-method-option">
                  <input
                    type="radio"
                    name="payment-method"
                    value={option.value}
                    checked={meta.paymentMethod === option.value}
                    onChange={() => setField("paymentMethod", option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>

            {meta.paymentMethod === "bank" ? (
              <div className="payment-detail-fields">
                <label>
                  {t("invoice.bankName")}
                  <input
                    placeholder={t("invoice.bankNamePlaceholder")}
                    value={meta.bankName}
                    onChange={(event) => setField("bankName", event.target.value)}
                  />
                </label>
                <label>
                  {t("invoice.accountName")}
                  <input
                    placeholder={t("invoice.accountNamePlaceholder")}
                    value={meta.bankAccountName}
                    onChange={(event) => setField("bankAccountName", event.target.value)}
                  />
                </label>
                <label>
                  {t("invoice.accountNumber")}
                  <input
                    placeholder={t("invoice.accountNumberPlaceholder")}
                    value={meta.bankAccountNumber}
                    onChange={(event) => setField("bankAccountNumber", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            {meta.paymentMethod === "ewallet" ? (
              <div className="payment-detail-fields">
                <label>
                  {t("invoice.ewalletName")}
                  <input
                    placeholder={t("invoice.ewalletNamePlaceholder")}
                    value={meta.ewalletName}
                    onChange={(event) => setField("ewalletName", event.target.value)}
                  />
                </label>
                <label>
                  {t("invoice.ewalletNumber")}
                  <input
                    placeholder={t("invoice.ewalletNumberPlaceholder")}
                    value={meta.ewalletNumber}
                    onChange={(event) => setField("ewalletNumber", event.target.value)}
                  />
                </label>
              </div>
            ) : null}

            <label>
              {t("invoice.paymentInstructions")}
              <textarea
                rows={2}
                placeholder={t("invoice.paymentInstructionsPlaceholder")}
                value={meta.paymentInstructions}
                onChange={(event) => setField("paymentInstructions", event.target.value)}
              />
            </label>
          </fieldset>
          </>
          )}
        </section>

        <section className="invoice-preview-wrap" aria-label="Invoice preview">
          <article className="invoice-sheet" id="invoice-sheet">
            <header className="sheet-header">
              <div>
                <span className="sheet-kicker">{t("invoice.invoice")}</span>
                <h2>{meta.number || "INV-0000"}</h2>
                {stageLabel ? <span className="sheet-stage-badge">{stageLabel}</span> : null}
              </div>
              <div className="sheet-brand">
                <img className="invoice-logo sheet-logo" src="/images/logo.png" alt={`${meta.from || "Company"} logo`} />
                <div>
                  <strong>{meta.from || "Your studio"}</strong>
                  <p>{meta.fromDetail}</p>
                </div>
              </div>
            </header>

            <div className="sheet-meta">
              <div>
                <span>{t("invoice.billedTo")}</span>
                <strong>{meta.billTo || "—"}</strong>
                <p>{meta.billToDetail}</p>
              </div>
              <div>
                <span>{t("invoice.issued")}</span>
                <strong>{formatDate(meta.issuedOn)}</strong>
              </div>
              <div>
                <span>{t("invoice.due")}</span>
                <strong>{formatDate(meta.dueOn)}</strong>
              </div>
            </div>

            <table className="sheet-table">
              <thead>
                <tr>
                  <th>{t("invoice.description")}</th>
                  <th>{t("invoice.qty")}</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.description || "—"}</td>
                    <td>{item.qty || 0}</td>
                    <td>{formatMoney(item.rate)}</td>
                    <td>{formatMoney((item.qty || 0) * (item.rate || 0))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="sheet-totals">
              <div>
                <span>{t("invoice.subtotal")}</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div>
                <span>{t("invoice.tax").replace("(%)", "")} ({meta.taxPercent || 0}%)</span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
              {meta.discount > 0 ? (
                <div>
                  <span>{t("invoice.discount").replace(" (IDR)", "")}</span>
                  <span>−{formatMoney(meta.discount)}</span>
                </div>
              ) : null}
              <div>
                <span>{t("invoice.projectTotal")}</span>
                <span>{formatMoney(total)}</span>
              </div>
              {meta.paymentStage === "dp" ? (
                <div className="sheet-schedule-line">
                  <span>{t("invoice.remainingAfterDp")} ({100 - dpPercent}%)</span>
                  <span>{formatMoney(remainingAmount)}</span>
                </div>
              ) : null}
              {meta.paymentStage === "final" ? (
                <div className="sheet-schedule-line">
                  <span>{t("invoice.dpAlreadyPaid")} ({dpPercent}%)</span>
                  <span>−{formatMoney(dpAmount)}</span>
                </div>
              ) : null}
            </div>

            {meta.paymentStage !== "full" ? (
              <div className="sheet-schedule">
                <span>{t("invoice.paymentSchedule")}</span>
                <table>
                  <tbody>
                    <tr className={meta.paymentStage === "dp" ? "schedule-active" : ""}>
                      <td>1. {t("invoice.downPaymentSchedule")} ({dpPercent}%)</td>
                      <td>{meta.paymentStage === "dp" ? t("invoice.thisInvoice") : t("invoice.paid")}</td>
                      <td>{formatMoney(dpAmount)}</td>
                    </tr>
                    <tr className={meta.paymentStage === "final" ? "schedule-active" : ""}>
                      <td>2. {t("invoice.finalPaymentSchedule")} ({100 - dpPercent}%)</td>
                      <td>{meta.paymentStage === "final" ? t("invoice.thisInvoice") : t("invoice.onCompletion")}</td>
                      <td>{formatMoney(remainingAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="sheet-payment-info">
              <span>{t("invoice.paymentInformation")}</span>
              <div className="payment-method-label">
                <strong>{t("invoice.method")}:</strong>{" "}
                {meta.paymentMethod === "bank"
                  ? t("invoice.bankTransfer")
                  : meta.paymentMethod === "ewallet"
                    ? t("invoice.eWallet")
                    : meta.paymentMethod === "cash"
                      ? t("invoice.cash")
                      : t("invoice.other")}
              </div>

              {meta.paymentMethod === "bank" && meta.bankName ? (
                <div className="payment-account-details">
                  <div>
                    <span>{t("invoice.bank")}:</span>
                    <strong>{meta.bankName}</strong>
                  </div>
                  <div>
                    <span>{t("invoice.accountName")}:</span>
                    <strong>{meta.bankAccountName}</strong>
                  </div>
                  <div>
                    <span>{t("invoice.accountNo")}:</span>
                    <strong>{meta.bankAccountNumber}</strong>
                  </div>
                </div>
              ) : null}

              {meta.paymentMethod === "ewallet" && meta.ewalletName ? (
                <div className="payment-account-details">
                  <div>
                    <span>{t("invoice.ewallet")}:</span>
                    <strong>{meta.ewalletName}</strong>
                  </div>
                  <div>
                    <span>{t("invoice.ewalletId")}:</span>
                    <strong>{meta.ewalletNumber}</strong>
                  </div>
                </div>
              ) : null}

              {meta.paymentInstructions ? (
                <p className="payment-instructions">{meta.paymentInstructions}</p>
              ) : null}
            </div>

            {meta.notes ? (
              <footer className="sheet-notes">
                <span>{t("invoice.notes")}</span>
                <p>{meta.notes}</p>
              </footer>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  );
}
