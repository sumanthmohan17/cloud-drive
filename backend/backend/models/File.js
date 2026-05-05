import mongoose from "mongoose";

const FileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  path: { type: String, required: true },
  url:  { type: String, required: true },
  size: { type: Number, default: 0 },
  type: { type: String, default: "" },
  views: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("File", FileSchema);