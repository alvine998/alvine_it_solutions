import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICreditLog extends Document {
  credit_customer_id: Types.ObjectId;
  credit_out: number;
  input_token: number;
  cached_token: number;
  output_token: number;
  createdAt: Date;
  updatedAt: Date;
}

const CreditLogSchema = new Schema<ICreditLog>(
  {
    credit_customer_id: { type: Schema.Types.ObjectId, ref: "CreditCustomer", required: true, index: true },
    credit_out: { type: Number, required: true, min: 0 },
    input_token: { type: Number, required: true, min: 0, default: 0 },
    cached_token: { type: Number, required: true, min: 0, default: 0 },
    output_token: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true, collection: "credit_logs" }
);

CreditLogSchema.index({ credit_customer_id: 1, createdAt: -1 });

export default mongoose.model<ICreditLog>("CreditLog", CreditLogSchema);
