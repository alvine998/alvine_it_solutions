import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./InvoiceGenerator.css";

type LineItem = {
  id: number;
  description: string;
  qty: number;
  rate: number;
};

type PaymentStage = "full" | "dp" | "final";

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
  const [meta, setMeta] = useState<InvoiceMeta>(defaultMeta);
  const [items, setItems] = useState<LineItem[]>(defaultItems);

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
      ? `Down payment (${dpPercent}%)`
      : meta.paymentStage === "final"
        ? `Final payment (${100 - dpPercent}%)`
        : null;

  const setField = <K extends keyof InvoiceMeta>(key: K, value: InvoiceMeta[K]) =>
    setMeta((current) => ({ ...current, [key]: value }));

  const setItemField = (id: number, patch: Partial<LineItem>) =>
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  const addItem = () =>
    setItems((current) => [...current, { id: nextItemId++, description: "", qty: 1, rate: 0 }]);

  const removeItem = (id: number) =>
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));

  return (
    <div className="invoice-page">
      <header className="invoice-topbar">
        <Link className="invoice-back" to="/">
          <img className="invoice-logo" src="/images/logo.png" alt="" width={29} height={29} />
          Alvine IT Solution
        </Link>
        <div className="invoice-topbar-actions">
          <span className="invoice-hint">Fill the form, then print or save as PDF.</span>
          <button type="button" className="invoice-print-button" onClick={() => window.print()}>
            Print / save PDF
          </button>
        </div>
      </header>

      <div className="invoice-layout">
        <section className="invoice-form" aria-label="Invoice details form">
          <h1>Invoice generator</h1>
          <p className="invoice-form-lead">
            Everything you type updates the document on the right. Nothing is uploaded — the invoice lives only in this tab.
          </p>

          <fieldset>
            <legend>Document</legend>
            <div className="field-row">
              <label>
                Invoice number
                <input
                  value={meta.number}
                  onChange={(event) => setField("number", event.target.value)}
                />
              </label>
              <label>
                Issued on
                <input
                  type="date"
                  value={meta.issuedOn}
                  onChange={(event) => setField("issuedOn", event.target.value)}
                />
              </label>
              <label>
                Due on
                <input
                  type="date"
                  value={meta.dueOn}
                  onChange={(event) => setField("dueOn", event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Parties</legend>
            <div className="field-row field-row-2">
              <label>
                From
                <input value={meta.from} onChange={(event) => setField("from", event.target.value)} />
              </label>
              <label>
                Bill to
                <input value={meta.billTo} onChange={(event) => setField("billTo", event.target.value)} />
              </label>
              <label>
                From details
                <textarea
                  rows={3}
                  value={meta.fromDetail}
                  onChange={(event) => setField("fromDetail", event.target.value)}
                />
              </label>
              <label>
                Bill-to details
                <textarea
                  rows={3}
                  value={meta.billToDetail}
                  onChange={(event) => setField("billToDetail", event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend>Line items</legend>
            <div className="item-rows">
              {items.map((item, index) => (
                <div className="item-row" key={item.id}>
                  <label>
                    <span className="visually-hidden">Item {index + 1} description</span>
                    <input
                      placeholder="Description"
                      value={item.description}
                      onChange={(event) => setItemField(item.id, { description: event.target.value })}
                    />
                  </label>
                  <label>
                    <span className="visually-hidden">Item {index + 1} quantity</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="Qty"
                      value={item.qty}
                      onChange={(event) => setItemField(item.id, { qty: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    <span className="visually-hidden">Item {index + 1} rate</span>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Rate (IDR)"
                      value={item.rate}
                      onChange={(event) => setItemField(item.id, { rate: Number(event.target.value) })}
                    />
                  </label>
                  <button
                    type="button"
                    className="item-remove"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    aria-label={`Remove item ${index + 1}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="item-add" onClick={addItem}>
              + Add line item
            </button>
          </fieldset>

          <fieldset>
            <legend>Payment plan</legend>
            <div className="stage-picker" role="radiogroup" aria-label="Payment stage">
              {(
                [
                  { value: "full", label: "Full amount" },
                  { value: "dp", label: "Down payment" },
                  { value: "final", label: "Final payment" },
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
                  DP percentage (%)
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
                    <span>DP ({dpPercent}%)</span>
                    <strong>{formatMoney(dpAmount)}</strong>
                  </div>
                  <div>
                    <span>Remaining ({100 - dpPercent}%)</span>
                    <strong>{formatMoney(remainingAmount)}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </fieldset>

          <fieldset>
            <legend>Adjustments & notes</legend>
            <div className="field-row">
              <label>
                Tax (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={meta.taxPercent}
                  onChange={(event) => setField("taxPercent", Number(event.target.value))}
                />
              </label>
              <label>
                Discount (IDR)
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
              Notes / payment terms
              <textarea
                rows={3}
                value={meta.notes}
                onChange={(event) => setField("notes", event.target.value)}
              />
            </label>
          </fieldset>
        </section>

        <section className="invoice-preview-wrap" aria-label="Invoice preview">
          <article className="invoice-sheet" id="invoice-sheet">
            <header className="sheet-header">
              <div>
                <span className="sheet-kicker">Invoice</span>
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
                <span>Billed to</span>
                <strong>{meta.billTo || "—"}</strong>
                <p>{meta.billToDetail}</p>
              </div>
              <div>
                <span>Issued</span>
                <strong>{formatDate(meta.issuedOn)}</strong>
              </div>
              <div>
                <span>Due</span>
                <strong>{formatDate(meta.dueOn)}</strong>
              </div>
            </div>

            <table className="sheet-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Qty</th>
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
                <span>Subtotal</span>
                <span>{formatMoney(subtotal)}</span>
              </div>
              <div>
                <span>Tax ({meta.taxPercent || 0}%)</span>
                <span>{formatMoney(taxAmount)}</span>
              </div>
              {meta.discount > 0 ? (
                <div>
                  <span>Discount</span>
                  <span>−{formatMoney(meta.discount)}</span>
                </div>
              ) : null}
              <div>
                <span>Project total</span>
                <span>{formatMoney(total)}</span>
              </div>
              {meta.paymentStage === "dp" ? (
                <div className="sheet-schedule-line">
                  <span>Remaining after DP ({100 - dpPercent}%)</span>
                  <span>{formatMoney(remainingAmount)}</span>
                </div>
              ) : null}
              {meta.paymentStage === "final" ? (
                <div className="sheet-schedule-line">
                  <span>DP already paid ({dpPercent}%)</span>
                  <span>−{formatMoney(dpAmount)}</span>
                </div>
              ) : null}
              <div className="sheet-total-due">
                <span>{stageLabel ? `Due now — ${stageLabel}` : "Total due"}</span>
                <span>{formatMoney(dueNow)}</span>
              </div>
            </div>

            {meta.paymentStage !== "full" ? (
              <div className="sheet-schedule">
                <span>Payment schedule</span>
                <table>
                  <tbody>
                    <tr className={meta.paymentStage === "dp" ? "schedule-active" : ""}>
                      <td>1. Down payment ({dpPercent}%)</td>
                      <td>{meta.paymentStage === "dp" ? "This invoice" : "Paid"}</td>
                      <td>{formatMoney(dpAmount)}</td>
                    </tr>
                    <tr className={meta.paymentStage === "final" ? "schedule-active" : ""}>
                      <td>2. Final payment ({100 - dpPercent}%)</td>
                      <td>{meta.paymentStage === "final" ? "This invoice" : "On completion"}</td>
                      <td>{formatMoney(remainingAmount)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : null}

            {meta.notes ? (
              <footer className="sheet-notes">
                <span>Notes</span>
                <p>{meta.notes}</p>
              </footer>
            ) : null}
          </article>
        </section>
      </div>
    </div>
  );
}
