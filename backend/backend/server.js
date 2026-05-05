import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import multer from "multer";

import File from "./models/File.js";
import { supabase } from "./supabase.js";

dotenv.config();

const app = express();

// ===================== MIDDLEWARE =====================
app.use(cors({
  origin: "*",
  credentials: true,
}));

app.use(express.json());

// ===================== MULTER =====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ===================== MONGODB =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🌟 MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ===================== ROOT =====================
app.get("/", (req, res) => {
  res.send("🚀 Backend Running...");
});

// ===================== UPLOAD =====================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;

    const fileName = `${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return res.status(500).json({ error: error.message });
    }

    const { data } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const saved = await File.create({
      name: file.originalname,
      path: fileName,
      url: data.publicUrl,
      size: file.size,
      type: file.mimetype,
    });

    res.json(saved);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ===================== GET FILES =====================
app.get("/files", async (req, res) => {
  try {
    const files = await File.find().lean();
    res.json(files);
  } catch {
    res.json([]);
  }
});

// ===================== USAGE =====================
app.get("/usage", async (req, res) => {
  const files = await File.find();
  const used = files.reduce((a, f) => a + (f.size || 0), 0);

  res.json({
    used,
    limit: 1024 * 1024 * 1024,
    percent: ((used / (1024 * 1024 * 1024)) * 100).toFixed(2),
  });
});

// ===================== DELETE =====================
app.delete("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "Not found" });

    await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.path]);

    await File.deleteOne({ _id: file._id });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== START =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on ${PORT}`));