import { useEffect, useState, useCallback, useRef } from "react";

function getFileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["png","jpg","jpeg","gif","webp","svg"].includes(ext)) return "image";
  if (["mp4","webm","ogg","mov"].includes(ext)) return "video";
  if (["mp3","wav","aac"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  return "other";
}

function getFileIcon(name = "") {
  const t = getFileType(name);
  if (t === "image") return "🖼️";
  if (t === "video") return "🎬";
  if (t === "audio") return "🎵";
  if (t === "pdf") return "📄";
  return "📁";
}

function getBadge(name = "") {
  const t = getFileType(name);
  if (t === "image") return { label: "IMG", cls: "images" };
  if (t === "video") return { label: "VID", cls: "videos" };
  if (t === "audio") return { label: "AUD", cls: "audio" };
  if (t === "pdf") return { label: "PDF", cls: "pdfs" };
  return null;
}

function formatSize(bytes = 0) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

export default function Home() {
  const BACKEND = process.env.REACT_APP_API_URL;

  const [files, setFiles] = useState([]);
  const [usage, setUsage] = useState({ used: 0, percent: 0 });
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  const fileInputRef = useRef();

  // ✅ FIXED
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/files`);
      const data = await res.json();
      if (Array.isArray(data)) setFiles(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }, [BACKEND]);

  // ✅ FIXED
  const fetchUsage = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/usage`);
      const data = await res.json();
      setUsage(data);
    } catch (err) {
      console.error(err);
    }
  }, [BACKEND]);

  useEffect(() => {
    fetchFiles();
    fetchUsage();
  }, [fetchFiles, fetchUsage]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await fetch(`${BACKEND}/upload`, {
        method: "POST",
        body: formData,
      });
      fetchFiles();
      fetchUsage();
    } catch (err) {
      console.error(err);
    }

    e.target.value = "";
  };

  const deleteFile = async (id) => {
    try {
      await fetch(`${BACKEND}/files/${id}`, { method: "DELETE" });
      fetchFiles();
      fetchUsage();
    } catch (err) {
      console.error(err);
    }
  };

  const usedMB = (usage.used / 1024 / 1024).toFixed(2);

  const tabs = [
    { label: "Home" },
    { label: "My Files" },
    { label: "Transfer" },
    { label: "About" },
  ];

  const FileGrid = ({ items }) => {
    if (!Array.isArray(items)) return null;

    return (
      <div className="files-grid">
        {items.map((f) => {
          const badge = getBadge(f.name);
          return (
            <div key={f._id} className="file-card">
              <div className="file-info">
                <div className="file-icon-box">{getFileIcon(f.name)}</div>
                <div>
                  <div className="file-name">{f.name}</div>
                  <div className="file-meta">
                    {f.size ? formatSize(f.size) + " · " : ""}
                    👁 {f.views ?? 0}
                    {badge && <span className={`badge ${badge.cls}`}>{badge.label}</span>}
                  </div>
                </div>
              </div>

              <div className="file-actions">
                <a href={f.url} target="_blank" rel="noreferrer">Preview</a>
                <a href={`/share/${f._id}`}>Share</a>
                <button onClick={() => deleteFile(f._id)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>

      {/* HEADER */}
      <header className="header">
        <h2>☁️ Cloud Drive</h2>
      </header>

      {/* NAVBAR */}
      <nav className="navbar">
        {tabs.map((t, i) => (
          <button
            key={i}
            className={tab === i ? "active" : ""}
            onClick={() => setTab(i)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* MAIN */}
      <main>

        {tab === 0 && (
          <>
            <p>{usedMB} MB used</p>

            <button onClick={() => fileInputRef.current?.click()}>
              Upload File
            </button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleUpload}
            />

            {loading ? <p>Loading...</p> : <FileGrid items={files} />}
          </>
        )}

        {tab === 1 && <FileGrid items={files} />}

        {tab === 2 && <p>File transfer coming soon...</p>}

        {tab === 3 && <p>About section</p>}

      </main>
    </div>
  );
}