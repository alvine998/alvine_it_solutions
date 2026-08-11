import mongoose, { Schema, Document } from "mongoose";

export interface ILineItem {
  description: string;
  qty: number;
  rate: number;
}

export interface IInvoice extends Document {
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
  paymentStage: "full" | "dp" | "final";
  dpPercent: number;
  paymentMethod: "bank" | "ewallet" | "cash" | "other";
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ewalletName: string;
  ewalletNumber: string;
  paymentInstructions: string;
  items: ILineItem[];
  createdAt: Date;
  updatedAt: Date;
}

const LineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true },
    qty: { type: Number, required: true, min: 0 },
    rate: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    number: { type: String, required: true, unique: true, trim: true },
    issuedOn: { type: String, required: true },
    dueOn: { type: String, required: true },
    from: { type: String, required: true, trim: true },
    fromDetail: { type: String, trim: true },
    billTo: { type: String, required: true, trim: true },
    billToDetail: { type: String, trim: true },
    notes: { type: String, trim: true },
    taxPercent: { type: Number, default: 0, min: 0, max: 100 },
    discount: { type: Number, default: 0, min: 0 },
    paymentStage: {
      type: String,
      enum: ["full", "dp", "final"],
      default: "full",
    },
    dpPercent: { type: Number, default: 50, min: 1, max: 99 },
    paymentMethod: {
      type: String,
      enum: ["bank", "ewallet", "cash", "other"],
      default: "bank",
    },
    bankName: { type: String, trim: true, default: "" },
    bankAccountName: { type: String, trim: true, default: "" },
    bankAccountNumber: { type: String, trim: true, default: "" },
    ewalletName: { type: String, trim: true, default: "" },
    ewalletNumber: { type: String, trim: true, default: "" },
    paymentInstructions: { type: String, trim: true, default: "" },
    items: [LineItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>("Invoice", InvoiceSchema);