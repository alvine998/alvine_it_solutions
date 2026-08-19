import mongoose, { Schema, Document } from "mongoose";

export interface IRouterModel extends Document {
  name: string;
  provider: string;
  model_id: string;
  base_url: string;
  api_key: string;
  context_window: number;
  credits_per_1k: number;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const RouterModelSchema = new Schema<IRouterModel>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    provider: { type: String, required: true, trim: true },
    model_id: { type: String, required: true, trim: true },
    base_url: { type: String, trim: true, default: "" },
    api_key: { type: String, trim: true, default: "", select: false },
    context_window: { type: Number, default: 0, min: 0 },
    credits_per_1k: { type: Number, default: 1, min: 0 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true, collection: "router_models" }
);

export default mongoose.model<IRouterModel>("RouterModel", RouterModelSchema);
