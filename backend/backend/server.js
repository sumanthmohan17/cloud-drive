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
app.use(cors({ origin: "*", credentials: true }));
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

// ===================== TRANSFER CODE STORE =====================
// In-memory store: { code: { fileId, expiresAt } }
const transferCodes = new Map();

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ===================== ROOT =====================
app.get("/", (req, res) => res.send("🚀 Backend Running..."));

// ===================== UPLOAD =====================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const fileName = `${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) return res.status(500).json({ error: error.message });

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

// ===================== GET SINGLE FILE =====================
app.get("/file/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id).lean();
    if (!file) return res.status(404).json({ error: "Not found" });
    await File.updateOne({ _id: file._id }, { $inc: { views: 1 } });
    res.json({ ...file, views: (file.views || 0) + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    await supabase.storage.from(process.env.SUPABASE_BUCKET).remove([file.path]);
    await File.deleteOne({ _id: file._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== FILE TRANSFER - GENERATE CODE =====================
// Upload a file and get a 6-digit code (valid 24 hours)
app.post("/transfer/send", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const file = req.file;
    const fileName = `transfer/${Date.now()}-${file.originalname}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, { contentType: file.mimetype });

    if (error) return res.status(500).json({ error: error.message });

    const { data } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    // Generate unique 6-digit code
    let code;
    do { code = generateCode(); } while (transferCodes.has(code));

    const expiresAt = Date.now() + 15 * 60 * 1000; //15 mins

    transferCodes.set(code, {
      name: file.originalname,
      url: data.publicUrl,
      size: file.size,
      type: file.mimetype,
      path: fileName,
      expiresAt,
    });

    // Auto-cleanup after 24h
    setTimeout(() => {
      const entry = transferCodes.get(code);
      if (entry) {
        supabase.storage.from(process.env.SUPABASE_BUCKET).remove([entry.path]);
        transferCodes.delete(code);
      }
    }, 15 * 60 * 1000);

    res.json({ code, expiresAt, name: file.originalname, size: file.size });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== FILE TRANSFER - RECEIVE BY CODE =====================
app.get("/transfer/receive/:code", (req, res) => {
  const entry = transferCodes.get(req.params.code);

  if (!entry) return res.status(404).json({ error: "Code not found or expired" });
  if (Date.now() > entry.expiresAt) {
    transferCodes.delete(req.params.code);
    return res.status(410).json({ error: "Code has expired" });
  }

  const remaining = entry.expiresAt - Date.now();
  const hours = Math.floor(remaining / 3600000);
  const mins = Math.floor((remaining % 3600000) / 60000);

  res.json({
    name: entry.name,
    url: entry.url,
    size: entry.size,
    type: entry.type,
    expiresAt: entry.expiresAt,
  });
});

// ===================== START =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));