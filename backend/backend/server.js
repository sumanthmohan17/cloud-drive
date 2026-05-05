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
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (
      origin.includes("localhost") ||
      origin.includes("vercel.app") ||
      origin === process.env.CLIENT_URL
    ) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());

// Multer — 50MB size limit to prevent abuse
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ===================== MONGODB =====================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🌟 MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err));

// ===================== DEFAULT =====================
app.get("/", (req, res) => {
  res.send("🚀 Backend Running...");
});


// =======================================================
// 🚀 UPLOAD FILE
// =======================================================
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const file = req.file;
    // Determine subfolder based on MIME type
    const mime = file.mimetype;
    let folder = "others";
    if (mime.startsWith("image/"))       folder = "images";
    else if (mime.startsWith("video/"))  folder = "videos";
    else if (mime.startsWith("audio/"))  folder = "audio";
    else if (mime === "application/pdf") folder = "pdfs";
    else if (mime.includes("word") || mime.includes("document")) folder = "docs";
    else if (mime.includes("spreadsheet") || mime.includes("excel")) folder = "spreadsheets";
    else if (mime.includes("zip") || mime.includes("compressed")) folder = "archives";

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    console.log("📂 Uploading:", fileName);
    console.log("📦 Size:", file.size);
    console.log("🧪 Bucket:", process.env.SUPABASE_BUCKET);

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
      });

    console.log("📡 Supabase response:", data, error);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    const savedFile = await File.create({
      name: file.originalname,
      path: fileName,
      url: urlData.publicUrl,
      size: file.size,
      type: file.mimetype,
    });

    res.json({ success: true, file: savedFile });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================================================
// 📌 GET ALL FILES
// =======================================================
app.get("/files", async (req, res) => {
  try {
    const files = await File.find().lean();

    // List all subfolders and collect all file paths
    const FOLDERS = ["images", "videos", "audio", "pdfs", "docs", "spreadsheets", "archives", "others"];
    const allStorageFiles = new Set();

    for (const folder of FOLDERS) {
      const { data: folderFiles } = await supabase.storage
        .from(process.env.SUPABASE_BUCKET)
        .list(folder);
      if (folderFiles) {
        folderFiles.forEach(f => allStorageFiles.add(`${folder}/${f.name}`));
      }
    }

    // Also list root for any old files uploaded before folder logic
    const { data: rootFiles, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .list("");
    if (error) return res.status(500).json({ error: error.message });
    rootFiles.forEach(f => { if (f.id) allStorageFiles.add(f.name); });

    const storageNames = allStorageFiles;

    const validFiles = [];

    for (let f of files) {
      if (storageNames.has(f.path)) {
        validFiles.push(f);
      } else {
        // File missing from Supabase — remove ghost from MongoDB
        console.log("🧹 Removing ghost file:", f.name);
        await File.deleteOne({ _id: f._id });
      }
    }

    res.json(validFiles);

  } catch (err) {
    console.error("Get files error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================================================
// 📌 GET FILE BY ID (FOR SHARE LINK)
// =======================================================
app.get("/file/:id", async (req, res) => {
  try {
    // Increment view count atomically
    const file = await File.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Verify file still exists in Supabase storage
    // file.path is like "images/123-photo.png" so split into folder + filename
    const pathParts = file.path.includes("/") ? file.path.split("/") : [null, file.path];
    const folderToCheck = pathParts.length > 1 ? pathParts[0] : "";
    const fileNameToCheck = pathParts[pathParts.length - 1];

    const { data: storageFiles, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .list(folderToCheck);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const exists = storageFiles.some(f => f.name === fileNameToCheck);

    if (!exists) {
      // Clean up ghost record
      await File.deleteOne({ _id: file._id });
      return res.status(404).json({ error: "File no longer exists in storage" });
    }

    res.json(file);

  } catch (err) {
    console.error("Get file error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================================================
// 📌 DELETE FILE
// =======================================================
app.delete("/files/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from Supabase first
    const { error: storageError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([file.path]);

    if (storageError) {
      console.error("Supabase delete error:", storageError.message);
      return res.status(500).json({ error: "Failed to delete from storage: " + storageError.message });
    }

    // Only delete from MongoDB after Supabase succeeds
    await File.deleteOne({ _id: req.params.id });

    res.json({ message: "Deleted successfully" });

  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================================================
// 📊 STORAGE USAGE
// =======================================================
app.get("/usage", async (req, res) => {
  try {
    const files = await File.find().lean();
    const used = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const LIMIT = 1024 * 1024 * 1024; // 1GB

    res.json({
      used,
      limit: LIMIT,
      percent: ((used / LIMIT) * 100).toFixed(2),
    });

  } catch (err) {
    console.error("Usage error:", err);
    res.status(500).json({ error: err.message });
  }
});


// =======================================================
// 🔥 START SERVER — always at the bottom
// =======================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🔥 Server running on http://localhost:${PORT}`)
);
