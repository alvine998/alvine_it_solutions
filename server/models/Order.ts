import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrder extends Document {
  customer_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  amount: number;
  credits: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  payment_method?: string;
  payment_ref?: string;
  start_date?: Date;
  due_date?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "RouterCustomer", required: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    amount: { type: Number, required: true, min: 0 },
    credits: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid", "cancelled", "expired"], default: "pending" },
    payment_method: { type: String, trim: true },
    payment_ref: { type: String, trim: true },
    start_date: { type: Date },
    due_date: { type: Date },
  },
  { timestamps: true, collection: "orders" }
);

OrderSchema.index({ customer_id: 1, createdAt: -1 });
OrderSchema.index({ plan_id: 1 });

export default mongoose.model<IOrder>("Order", OrderSchema);
