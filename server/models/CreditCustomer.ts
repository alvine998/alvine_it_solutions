import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICreditCustomer extends Document {
  customer_id: Types.ObjectId;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreditCustomerSchema = new Schema<ICreditCustomer>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "RouterCustomer", required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true, collection: "credit_customers" }
);

CreditCustomerSchema.index({ customer_id: 1 }, { unique: true });

export default mongoose.model<ICreditCustomer>("CreditCustomer", CreditCustomerSchema);
