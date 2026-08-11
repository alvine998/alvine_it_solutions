import mongoose, { Schema, Document } from "mongoose";

export interface ITimeline extends Document {
  customerId: mongoose.Types.ObjectId;
  type: "note" | "call" | "email" | "meeting" | "task" | "status_change";
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TimelineSchema = new Schema<ITimeline>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["note", "call", "email", "meeting", "task", "status_change"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: String },
    endDate: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model<ITimeline>("Timeline", TimelineSchema);
