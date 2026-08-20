import mongoose, { Schema, Document } from "mongoose";

export type PaymentMethodType = "qris" | "bank" | "e-wallet";

export interface IPaymentMethod extends Document {
  name: string;
  type: PaymentMethodType;
  account_holder: string;
  account_number: string;
  image?: string; // QRIS image URL on Cloudflare R2 (public bucket / CDN)
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["qris", "bank", "e-wallet"], required: true },
    account_holder: { type: String, trim: true, default: "" },
    account_number: { type: String, trim: true, default: "" },
    image: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "payment_methods" }
);

export default mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);
