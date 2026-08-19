import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IRouterCustomer extends Document {
  name: string;
  email: string;
  password: string;
  status: "active" | "inactive" | "blacklist";
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

export default mongoose.model<IRouterCustomer>("RouterCustomer", RouterCustomerSchema);
