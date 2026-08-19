import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICustomerPlan extends Document {
  customer_id: Types.ObjectId;
  plan_id: Types.ObjectId;
  start_date: Date;
  due_date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerPlanSchema = new Schema<ICustomerPlan>(
  {
    customer_id: { type: Schema.Types.ObjectId, ref: "RouterCustomer", required: true },
    plan_id: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    start_date: { type: Date, required: true },
    due_date: { type: Date, required: true },
  },
  { timestamps: true, collection: "customer_plans" }
);

CustomerPlanSchema.index({ customer_id: 1, plan_id: 1 });
CustomerPlanSchema.index({ due_date: 1 });

export default mongoose.model<ICustomerPlan>("CustomerPlan", CustomerPlanSchema);
