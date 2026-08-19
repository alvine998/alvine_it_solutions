import mongoose, { Schema, Document, Types } from "mongoose";
import crypto from "crypto";

export interface ICustomerApiKey extends Document {
  customer_id: Types.ObjectId;
  name: string;
  key_hash: string;
  prefix: string;
  last4: string;
  status: "active" | "revoked";
  last_used_at?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerApiKeySchema = new Schema<ICustomerApiKey>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "RouterCustomer", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    key_hash: { type: String, required: true, select: false },
    prefix: { type: String, required: true, trim: true },
    last4: { type: String, required: true, trim: true },
    status: { type: String, enum: ["active", "revoked"], default: "active", index: true },
    last_used_at: { type: Date },
  },
  { timestamps: true, collection: "customer_api_keys" }
);

CustomerApiKeySchema.index({ customer_id: 1, createdAt: -1 });
CustomerApiKeySchema.index({ key_hash: 1 }, { unique: true, sparse: true });

export function hashApiKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): string {
  // sk-<32 hex> — 35 chars, copy-paste safe, distinguishable from JWT
  return `sk-${crypto.randomBytes(24).toString("hex")}`;
}

export default mongoose.model<ICustomerApiKey>("CustomerApiKey", CustomerApiKeySchema);
