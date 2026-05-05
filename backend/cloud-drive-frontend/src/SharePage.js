import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = process.env.REACT_APP_API_URL;

function getFileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "ogg", "aac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  return "other";
}

function SharePage() {
  const { id } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/file/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("File not found");
        return res.json();
      })
      .then((data) => {
        setFile(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Something went wrong");
        setLoading(false);
      });
  }, [id]);

  const fileType = file ? getFileType(file.name) : null;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <a href="/" style={styles.backLink}>← Cloud Drive</a>
      </div>

      <div style={styles.container}>
        {loading && <p style={styles.status}>Loading...</p>}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorTitle}>❌ {error}</p>
            <p style={styles.errorSub}>This file may have been deleted or the link is invalid.</p>
          </div>
        )}

        {file && (
          <>
            <h2 style={styles.filename}>{file.name}</h2>

            <div style={styles.preview}>
              {fileType === "image" && (
                <img
                  src={file.url}
                  alt={file.name}
                  style={styles.image}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              )}

              {fileType === "video" && (
                <video controls style={styles.video}>
                  <source src={file.url} />
                  Your browser does not support video playback.
                </video>
              )}

              {fileType === "audio" && (
                <audio controls style={styles.audio}>
                  <source src={file.url} />
                  Your browser does not support audio playback.
                </audio>
              )}

              {fileType === "pdf" && (
                <iframe
                  src={file.url}
                  title={file.name}
                  style={styles.pdf}
                />
              )}

              {fileType === "other" && (
                <div style={styles.otherFile}>
                  <span style={styles.fileIcon}>📄</span>
                  <p style={styles.otherName}>{file.name}</p>
                </div>
              )}
            </div>

            <button
              style={styles.downloadBtn}
              onClick={async () => {
                try {
                  const res = await fetch(file.url);
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = file.name;
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  alert('Download failed. Try again.');
                }
              }}
            >
              ⬇️ Download File
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f1117",
    color: "#e2e8f0",
    fontFamily: "'Courier New', monospace",
  },
  header: {
    padding: "20px 40px",
    borderBottom: "1px solid #1e2535",
  },
  backLink: {
    color: "#93c5fd",
    textDecoration: "none",
    fontSize: "14px",
  },
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "40px 24px",
    textAlign: "center",
  },
  status: {
    color: "#94a3b8",
    fontSize: "16px",
  },
  errorBox: {
    backgroundColor: "#1c1218",
    border: "1px solid #7f1d1d",
    borderRadius: "12px",
    padding: "32px",
  },
  errorTitle: {
    color: "#f87171",
    fontSize: "18px",
    margin: "0 0 8px 0",
  },
  errorSub: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: 0,
  },
  filename: {
    color: "#ffffff",
    fontSize: "20px",
    marginBottom: "24px",
    wordBreak: "break-all",
  },
  preview: {
    backgroundColor: "#161b27",
    border: "1px solid #2d3748",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "200px",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "500px",
    borderRadius: "8px",
  },
  video: {
    maxWidth: "100%",
    borderRadius: "8px",
  },
  audio: {
    width: "100%",
  },
  pdf: {
    width: "100%",
    height: "600px",
    border: "none",
    borderRadius: "8px",
  },
  otherFile: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
  },
  fileIcon: { fontSize: "64px" },
  otherName: {
    color: "#94a3b8",
    fontSize: "14px",
    margin: 0,
  },
  downloadBtn: {
    display: "inline-block",
    backgroundColor: "#1e2535",
    color: "#e2e8f0",
    border: "1px solid #3b82f6",
    borderRadius: "8px",
    padding: "12px 28px",
    fontSize: "15px",
    fontWeight: "bold",
    textDecoration: "none",
    letterSpacing: "1px",
  },
};

export default SharePage;