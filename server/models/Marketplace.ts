import mongoose, { Schema, Document } from "mongoose";

export interface IMarketplace extends Document {
  name: string;
  description: string;
  price: number;
  tech: string[];
  category: "web" | "mobile" | "desktop" | "api" | "template" | "other";
  images: string[];
  /** @deprecated — kept for backward compat, mirrors images[0] */
  image: string;
  demoUrl: string;
  downloadUrl: string;
  featured: boolean;
  status: "active" | "inactive";
  sales: number;
  createdAt: Date;
  updatedAt: Date;
}

const MarketplaceSchema = new Schema<IMarketplace>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    tech: { type: [String], default: [] },
    category: {
      type: String,
      enum: ["web", "mobile", "desktop", "api", "template", "other"],
      default: "web",
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "Maximum 10 images allowed",
      },
    },
    // legacy single image — auto-synced to images[0] on read/write
    image: { type: String, default: "" },
    demoUrl: { type: String, default: "" },
    downloadUrl: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sales: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, collection: "marketplace" }
);

// Always return { image, images } consistently: image = images[0] || legacy image
MarketplaceSchema.set("toJSON", {
  virtuals: true,
  transform(_doc: any, ret: any) {
    // normalize: prefer images array, fallback to legacy image
    if (!ret.images || ret.images.length === 0) {
      if (ret.image) ret.images = [ret.image];
      else ret.images = [];
    }
    // keep image in sync for old clients
    if (!ret.image && ret.images.length > 0) ret.image = ret.images[0];
    return ret;
  },
});
MarketplaceSchema.set("toObject", {
  virtuals: true,
  transform(_doc: any, ret: any) {
    if (!ret.images || ret.images.length === 0) {
      if (ret.image) ret.images = [ret.image];
      else ret.images = [];
    }
    if (!ret.image && ret.images.length > 0) ret.image = ret.images[0];
    return ret;
  },
});

export default mongoose.model<IMarketplace>("Marketplace", MarketplaceSchema);
