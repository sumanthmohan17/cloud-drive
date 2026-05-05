import { useEffect, useState, useCallback } from "react";

function getFileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "webm", "ogg", "mov"].includes(ext)) return "video";
  if (["mp3", "wav", "aac"].includes(ext)) return "audio";
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
  if (t === "pdf")   return { label: "PDF", cls: "pdfs" };
  return null;
}

function formatSize(bytes = 0) {
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(2) + " KB";
  return bytes + " B";
}

export default function Home() {
  const BACKEND = process.env.REACT_APP_API_URL;

  const [files, setFiles]   = useState([]);
  const [usage, setUsage]   = useState({ used: 0, percent: 0 });
  const [tab, setTab]       = useState(0);
  const [loading, setLoading] = useState(true);
  const fileInputRef        = useRef();

  const fetchFiles = useCallback(async () => {
  try {
    const res = await fetch(`${BACKEND}/files`);
    const data = await res.json();
    if (Array.isArray(data)) setFiles(data);
  } catch (err) {
    console.error(err);
  }
}, [BACKEND]);

const fetchUsage = useCallback(async () => {
  try {
    const res = await fetch(`${BACKEND}/usage`);
    const data = await res.json();
    setUsage(data);
  } catch (err) {
    console.error(err);
  }
}, [BACKEND]);

  const fetchUsage = async () => {
    try {
      const res  = await fetch(`${BACKEND}/usage`);
      const data = await res.json();
      setUsage(data);
    } catch (err) { console.error(err); }
  };

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
      await fetch(`${BACKEND}/upload`, { method: "POST", body: formData });
      fetchFiles();
      fetchUsage();
    } catch (err) { console.error(err); }
    // reset so same file can be re-selected
    e.target.value = "";
  };

  const deleteFile = async (id) => {
    try {
      await fetch(`${BACKEND}/files/${id}`, { method: "DELETE" });
      fetchFiles();
      fetchUsage();
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { label: "Home", icon: <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
    { label: "My Files", icon: <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
    { label: "File Transfer", icon: <svg viewBox="0 0 24 24"><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg> },
    { label: "About", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  ];

  const usedMB  = (usage.used / 1024 / 1024).toFixed(2);

  const FileGrid = ({ items }) => {
  if (!Array.isArray(items)) return null; // ✅ safety check

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
                  👁 {f.views ?? 0} view{(f.views ?? 0) !== 1 ? "s" : ""}
                  {badge && (
                    <span className={`badge ${badge.cls}`}>
                      {badge.label}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="file-actions">
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="action-btn">
                👁 Preview
              </a>
              <a href={`/share/${f._id}`} className="action-btn btn-share">
                🔗 Share
              </a>
              <button
                className="action-btn btn-delete"
                onClick={() => deleteFile(f._id)}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

  return (
    <div>

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="/">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>
            </div>
            <span className="logo-text">Cloud Drive</span>
          </a>
          <div className="header-right">
            <div className="secure-badge"><div className="secure-dot"></div>Secure</div>
            <div className="avatar">A</div>
          </div>
        </div>
      </header>

      {/* ── NAVBAR ── */}
      <nav className="navbar">
        <div className="navbar-inner">
          {tabs.map((t, i) => (
            <button
              key={i}
              className={`nav-tab${tab === i ? " active" : ""}`}
              onClick={() => setTab(i)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
          <div className="nav-divider" />
          <div className="nav-right">
            <div className="storage-pill">
              <div className="mini-bar"><div className="mini-bar-fill" style={{ width: `${usage.percent}%` }}></div></div>
              <span>{usedMB} MB / 1 GB</span>
            </div>
            <button className="upload-btn-nav" onClick={() => fileInputRef.current?.click()}>
              <svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
              Upload
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={handleUpload} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── MAIN ── */}
      <main className="main">

        {/* HOME TAB */}
        <div className={`section${tab === 0 ? " active" : ""}`}>

          {/* Storage */}
          <div className="storage-card">
            <div className="storage-top">
              <span className="storage-label">Storage Used</span>
              <span className="storage-val">{usedMB} MB / 1024 MB</span>
            </div>
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${usage.percent}%`, animation: "none" }}></div>
            </div>
          </div>

          {/* Upload */}
          <div className="upload-card" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon-wrap">
              <svg viewBox="0 0 24 24"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
            </div>
            <p className="upload-hint"><span>Drag &amp; drop</span> a file here, or choose below</p>
            <button className="upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>⚡ Upload File</button>
          </div>

          {/* Files */}
          <div className="files-header">
            <svg style={{width:18,height:18,stroke:"rgba(255,255,255,0.5)",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}} viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <h2 className="files-title">Stored Files</h2>
            <span className="files-count">{files.length} file{files.length !== 1 ? "s" : ""}</span>
          </div>

          {loading && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading…</p>}
          <FileGrid items={files} />
        </div>

        {/* MY FILES TAB */}
        <div className={`section${tab === 1 ? " active" : ""}`}>
          <div className="files-header">
            <svg style={{width:18,height:18,stroke:"rgba(255,255,255,0.5)",fill:"none",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"}} viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
            <h2 className="files-title">My Files</h2>
            <span className="files-count">{files.length} file{files.length !== 1 ? "s" : ""}</span>
          </div>
          {loading && <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Loading…</p>}
          <FileGrid items={files} />
        </div>

        {/* FILE TRANSFER TAB */}
        <div className={`section${tab === 2 ? " active" : ""}`}>
          <h2 className="section-heading">📤 File Transfer</h2>
          <p className="section-sub">Share any file instantly using a 6-digit code — no account needed on the receiving end</p>
          <div className="send-grid">
            <div className="send-card">
              <div className="send-card-title">📤 Send a File</div>
              <div className="send-card-sub">Upload a file and get a 6-digit code to share</div>
              <div className="send-drop">
                <div className="send-drop-icon">📂</div>
                <div className="send-drop-text"><span>Drag &amp; drop</span> or click to choose a file</div>
              </div>
              <button className="send-btn">⚡ Generate Code</button>
              <div className="code-box">
                <div className="code-label">Your Share Code</div>
                <div className="code-digits">——————</div>
                <div className="code-expiry">Upload a file to generate a code</div>
              </div>
              <button className="copy-btn">📋 Copy Code</button>
            </div>
            <div className="send-card">
              <div className="send-card-title">📥 Receive a File</div>
              <div className="send-card-sub">Enter the 6-digit code to download the file</div>
              <div className="receive-label">Enter Code</div>
              <input className="code-input" maxLength={6} placeholder="000000" />
              <button className="receive-btn">🔍 Find File</button>
            </div>
          </div>
          <div className="how-card">
            <div className="how-title">⚙️ How File Transfer Works</div>
            <div className="how-steps">
              {[
                { num: 1, icon: "📤", title: "Upload File",         desc: "Select or drag a file. It gets uploaded to secure cloud storage instantly." },
                { num: 2, icon: "🔢", title: "Get a Code",          desc: "A unique 6-digit code is generated and linked to your file. Valid for 24 hours." },
                { num: 3, icon: "📥", title: "Receiver Downloads",  desc: "Recipient enters the code on any device and downloads the file instantly." },
              ].map(s => (
                <div key={s.num} className="how-step">
                  <div className="how-step-num">{s.num}</div>
                  <div className="how-step-icon">{s.icon}</div>
                  <div className="how-step-title">{s.title}</div>
                  <div className="how-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ABOUT TAB */}
        <div className={`section${tab === 3 ? " active" : ""}`}>
          <div className="about-hero">
            <span className="about-hero-icon">☁️</span>
            <div className="about-hero-title">Cloud Drive</div>
            <div className="about-hero-sub">A full-stack cloud file storage and sharing application. Upload, organize, preview, and share files — all from one place.</div>
          </div>
          <div className="about-grid">
            {[
              { icon: "🔗", title: "Instant Share Links",    desc: "Every file gets a unique public link. No account needed for the recipient to view or download." },
              { icon: "🔒", title: "Password Protection",    desc: "Secure share links with a password so only intended recipients can access your files." },
              { icon: "⏱️", title: "Link Expiry",            desc: "Set an expiry time on share links. Files become inaccessible automatically after the set time." },
              { icon: "👁️", title: "View Count Tracking",   desc: "Know exactly how many times your shared file has been opened in real time." },
              { icon: "📁", title: "Auto Organization",      desc: "Files are automatically sorted into folders by type — images, videos, PDFs, audio and more." },
              { icon: "📤", title: "Send Anywhere",          desc: "Share files using a 6-digit code on any device without needing a link or account." },
            ].map((c, i) => (
              <div key={i} className="about-card">
                <div className="about-card-icon">{c.icon}</div>
                <div className="about-card-title">{c.title}</div>
                <div className="about-card-desc">{c.desc}</div>
              </div>
            ))}
          </div>
          <div className="tech-card">
            <div className="tech-title">🛠️ Tech Stack</div>
            <div className="tech-list">
              {[
                { label: "React",        cls: "frontend" },
                { label: "React Router", cls: "frontend" },
                { label: "Tailwind CSS", cls: "frontend" },
                { label: "Node.js",      cls: "backend" },
                { label: "Express.js",   cls: "backend" },
                { label: "Multer",       cls: "backend" },
                { label: "MongoDB Atlas",cls: "db" },
                { label: "Mongoose",     cls: "db" },
                { label: "Supabase",     cls: "db" },
                { label: "Vercel",       cls: "deploy" },
                { label: "Render",       cls: "deploy" },
                { label: "Resend",       cls: "deploy" },
              ].map((t, i) => (
                <span key={i} className={`tech-chip ${t.cls}`}>{t.label}</span>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}