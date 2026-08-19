import mongoose, { Schema, Document } from "mongoose";

export interface IPlan extends Document {
  name: string;
  price: number;
  credits: number;
  duration_days: number;
  cost_per_credit: number;
  features: string[];
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    price: { type: Number, required: true, min: 0 },
    credits: { type: Number, required: true, min: 0 },
    duration_days: { type: Number, required: true, default: 30, min: 1 },
    cost_per_credit: { type: Number, default: 0, min: 0 },
    features: { type: [String], default: [] },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "plans" }
);

export default mongoose.model<IPlan>("Plan", PlanSchema);
