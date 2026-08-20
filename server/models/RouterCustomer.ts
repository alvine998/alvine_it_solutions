import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IRouterCustomer extends Document {
  name: string;
  email: string;
  password: string;
  status: "active" | "inactive" | "blacklist";
  ref_code: string;
  referred_by: string;
  ref_used_by: number;
  ref_rewarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const RouterCustomerSchema = new Schema<IRouterCustomer>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    status: { type: String, enum: ["active", "inactive", "blacklist"], default: "active" },
    ref_code: { type: String, trim: true, uppercase: true, default: "" },
    referred_by: { type: String, trim: true, uppercase: true, default: "" },
    ref_used_by: { type: Number, default: 0, min: 0 },
    ref_rewarded: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "router_customers" }
);

RouterCustomerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (e: any) {
    next(e);
  }
});

RouterCustomerSchema.methods.comparePassword = function (c: string) {
  return bcrypt.compare(c, this.password);
};

// Unique only among non-empty codes — existing customers start with "" and
// get a code backfilled at server startup.
RouterCustomerSchema.index(
  { ref_code: 1 },
  { unique: true, partialFilterExpression: { ref_code: { $type: "string", $ne: "" } } }
);

// Backfill referral codes for customers that don't have one yet (legacy rows).
RouterCustomerSchema.statics.backfillRefCodes = async function (): Promise<void> {
  const Model = this as any;
  const missing = await Model.find({ $or: [{ ref_code: "" }, { ref_code: { $exists: false } }] }).select("_id name");
  for (const doc of missing) {
    const code = await Model.assignRefCode(doc);
    try {
      await Model.updateOne({ _id: doc._id }, { $set: { ref_code: code } });
    } catch (e: any) {
      if (e?.code !== 11000) console.error("backfill ref_code failed:", e?.message);
    }
  }
  if (missing.length > 0) console.log(`Backfilled ref_code for ${missing.length} customer(s)`);
};

// Generate a unique, human-friendly referral code (e.g. "ALVINE-X7K2Q")
// and assign it to the customer. Auto-retries on the rare unique collision.
RouterCustomerSchema.statics.assignRefCode = async function (doc: any): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const base = String(doc?.name || "CUSTOMER")
      .replace(/[^a-zA-Z0-9]/g, "")
      .slice(0, 6)
      .toUpperCase() || "CUSTOMER";
    const suffix = Array.from({ length: 5 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 32))
    ).join("");
    const code = `${base}-${suffix}`;
    const existing = await this.findOne({ ref_code: code }).select("_id").lean();
    if (!existing) return code;
  }
  return `REF-${Date.now().toString(36).toUpperCase()}`;
};

export default mongoose.model<IRouterCustomer>("RouterCustomer", RouterCustomerSchema);
