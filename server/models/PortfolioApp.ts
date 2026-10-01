import mongoose, { Schema, Document } from "mongoose";

export type PortfolioLocale = "en" | "id" | "zh";

export interface ILocalizedPortfolioText {
  en: string;
  id: string;
  zh: string;
}

export interface IPortfolioApp extends Document {
  slug: string;
  title: ILocalizedPortfolioText;
  category: ILocalizedPortfolioText;
  description: ILocalizedPortfolioText;
  problem: ILocalizedPortfolioText;
  solution: ILocalizedPortfolioText;
  timeline: ILocalizedPortfolioText;
  results: Record<PortfolioLocale, string[]>;
  tech: string[];
  image: string;
  liveUrl: string;
  status: "active" | "inactive";
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const LocalizedTextSchema = new Schema<ILocalizedPortfolioText>(
  {
    en: { type: String, default: "", trim: true },
    id: { type: String, default: "", trim: true },
    zh: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const PortfolioAppSchema = new Schema<IPortfolioApp>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    title: { type: LocalizedTextSchema, required: true },
    category: { type: LocalizedTextSchema, default: () => ({}) },
    description: { type: LocalizedTextSchema, default: () => ({}) },
    problem: { type: LocalizedTextSchema, default: () => ({}) },
    solution: { type: LocalizedTextSchema, default: () => ({}) },
    timeline: { type: LocalizedTextSchema, default: () => ({}) },
    results: {
      type: new Schema(
        {
          en: { type: [String], default: [] },
          id: { type: [String], default: [] },
          zh: { type: [String], default: [] },
        },
        { _id: false }
      ),
      default: () => ({}),
    },
    tech: { type: [String], default: [] },
    image: { type: String, default: "", trim: true },
    liveUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "portfolio_apps" }
);

export default mongoose.model<IPortfolioApp>("PortfolioApp", PortfolioAppSchema);
