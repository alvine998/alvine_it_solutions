import mongoose, { Schema, Document } from "mongoose";

export interface ISetting extends Document {
  telegram_username: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
}

const SettingSchema = new Schema<ISetting>(
  {
    telegram_username: { type: String, trim: true, default: "" },
    telegram_bot_token: { type: String, trim: true, default: "" },
    telegram_chat_id: { type: String, trim: true, default: "" },
  },
  { timestamps: true, collection: "settings" }
);

export default mongoose.model<ISetting>("Setting", SettingSchema);
