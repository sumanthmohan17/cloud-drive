import { useEffect, useState, useCallback, useRef } from "react";

export default function Home() {
  const BACKEND = process.env.REACT_APP_API_URL;

  const [files, setFiles] = useState([]);
  const [usage, setUsage] = useState({ used: 0, percent: 0 });
  const [tab, setTab] = useState(0);

  const fileInputRef = useRef();

  const fetchFiles = useCallback(async () => {
    const res = await fetch(`${BACKEND}/files`);
    const data = await res.json();
    setFiles(data);
  }, [BACKEND]);

  const fetchUsage = useCallback(async () => {
    const res = await fetch(`${BACKEND}/usage`);
    const data = await res.json();
    setUsage(data);
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

    await fetch(`${BACKEND}/upload`, {
      method: "POST",
      body: formData,
    });

    fetchFiles();
    fetchUsage();
  };

  const deleteFile = async (id) => {
    await fetch(`${BACKEND}/files/${id}`, { method: "DELETE" });
    fetchFiles();
    fetchUsage();
  };

  const usedMB = (usage.used / 1024 / 1024).toFixed(2);

  return (
    <div>

      {/* HEADER */}
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <div className="logo-icon">☁️</div>
            <span className="logo-text">Cloud Drive</span>
          </div>
        </div>
      </header>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-inner">
          {["Home", "My Files", "File Transfer", "About"].map((t, i) => (
            <button
              key={i}
              className={`nav-tab ${tab === i ? "active" : ""}`}
              onClick={() => setTab(i)}
            >
              {t}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN */}
      <main className="main">

        {/* HOME */}
        <div className={`section ${tab === 0 ? "active" : ""}`}>

          <div className="storage-card">
            <div className="storage-top">
              <span className="storage-label">Storage Used</span>
              <span className="storage-val">{usedMB} MB</span>
            </div>
            <div className="bar-bg">
              <div
                className="bar-fill"
                style={{ width: `${usage.percent}%` }}
              />
            </div>
          </div>

          <div className="upload-card" onClick={() => fileInputRef.current.click()}>
            <p className="upload-hint">
              <span>Drag & drop</span> or click
            </p>
            <button className="upload-btn">Upload</button>

            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleUpload}
            />
          </div>

          <div className="files-grid">
            {files.map((f) => (
              <div key={f._id} className="file-card">
                <div className="file-name">{f.name}</div>

                <div className="file-actions">
                  <a href={f.url} target="_blank" rel="noreferrer" className="action-btn">
                    Preview
                  </a>

                  <button
                    className="action-btn btn-delete"
                    onClick={() => deleteFile(f._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  );
}