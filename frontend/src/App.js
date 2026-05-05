import { useState, useEffect } from "react";

function App() {
  const [file, setFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [usage, setUsage] = useState({ used: 0, limit: 1, percent: 0 });


  const neonColors = {
    glow: "shadow-[0_0_15px_#0ff,0_0_30px_#f0f,0_0_45px_#0ff]",
    card: "bg-black/40 backdrop-blur-lg border border-[#0ff]/20 shadow-[0_0_10px_#0ff]",
  };

  // 📌 Fetch storage usage
  const fetchUsage = async () => {
  const res = await fetch("http://localhost:5000/usage");
  const data = await res.json();
  setUsage({
    used: data.used,
    limit: data.limit,
    percent: data.percent,
  });
};

  // 📌 Upload File
  const uploadFile = async () => {
    if (!file) return alert("Select a file!");

    const formData = new FormData();
    formData.append("file", file);

    await fetch("http://localhost:5000/upload", {
      method: "POST",
      body: formData,
    });

    fetchFiles();
    fetchUsage();
    setFile(null);
    alert("⚡ Upload Complete!");
  };

  // 📌 Fetch Files
  const fetchFiles = async () => {
    const res = await fetch("http://localhost:5000/files");
    const data = await res.json();
    setFiles(data);
  };

  // 📌 Delete File
  const deleteFile = async (id) => {
    await fetch(`http://localhost:5000/files/${id}`, { method: "DELETE" });
    fetchFiles();
    fetchUsage();
    alert("🗑 Deleted!");
  };
  
  useEffect(() => {
  fetchFiles();
  fetchUsage();  // 👈 ADD THIS
}, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white p-10 font-poppins">

      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-[#00e5ff] drop-shadow-[0_0_10px_#00e5ff]">
          ☁ Cloud Drive
        </h1>
        <div className="text-gray-400 font-semibold">Secure File Storage 🔐</div>
      </div>

      {/* 📊 Storage Progress Bar */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex justify-between text-cyan-300 text-sm mb-1">
          <span>Storage Used</span>
          <span>{((usage.used / (1024 * 1024)).toFixed(2))} MB / {(usage.limit / (1024 * 1024)).toFixed(0)} MB</span>
        </div>

        <div className="w-full bg-black/40 border border-[#0ff]/30 rounded-xl overflow-hidden shadow-[0_0_15px_#00e5ff80]">
          <div
            className="h-3 bg-gradient-to-r from-[#00e5ff] to-[#f0f] shadow-[0_0_15px_#00e5ff,inset_0_0_10px_#f0f] transition-all duration-700"
            style={{ width: `${usage.percent}%` }}
          ></div>
        </div>
      </div>

      {/* Upload Box */}
      <div className={`max-w-2xl mx-auto p-6 rounded-2xl ${neonColors.card}`}>
        <input
          type="file"
          className="w-full p-2 bg-black/40 border border-[#0ff]/40 text-cyan-300 rounded-xl hover:border-[#f0f] transition duration-300 cursor-pointer"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={uploadFile}
          className="px-6 py-3 mt-4 w-full text-[#0ff] font-semibold rounded-xl
          bg-[#00141a]/60 border border-[#0ff] 
          shadow-[0_0_10px_#0ff,0_0_20px_#0ff]
          hover:text-pink-400
          hover:shadow-[0_0_20px_#00e5ff,inset_0_0_10px_#003b44]
          active:scale-95 transition duration-300"
        >
          ⚡ Upload File
        </button>
      </div>
     

      {/* File List Title */}
      <h2 className="text-3xl mt-12 text-center font-bold text-[#0ff] tracking-wider drop-shadow-[0_0_10px_#0ff]">
        📁 Stored Files
      </h2>

      {/* File List */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 place-items-center">
        {files.map((f) => (
          <div
            key={f._id}
            className="bg-gray-900 bg-opacity-60 backdrop-blur-md p-5 rounded-xl border border-[#00e5ff50] shadow-lg shadow-[#00e5ff20] hover:shadow-[#00e5ff60] hover:scale-105 transition duration-300"
          >
            <div>
              <a
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="text-[#0ff] font-medium hover:text-[#f0f] underline underline-offset-2"
              >
                🔗 {f.name}
              </a>
              <p className="text-gray-400 text-sm">{(f.size / 1024).toFixed(2)} KB</p>
            </div>

            <button
              onClick={() => deleteFile(f._id)}
              className="text-[#ff1744] hover:text-[#ff616f] font-bold text-xl ml-4 drop-shadow-[0_0_6px_#ff1744]"
            >
              ✖
            </button>
          </div>
        ))}
      </div>

      {files.length === 0 && (
        <p className="text-gray-500 text-center mt-16 tracking-wide">
          🕶 No files uploaded yet
        </p>
      )}
    </div>
  );
}

export default App;





