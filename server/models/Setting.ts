import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  telegram_username: string;
}

const SettingSchema = new Schema<ISetting>(
  {
    telegram_username: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "settings" }
);

export default mongoose.model<ISetting>("Setting", SettingSchema);
