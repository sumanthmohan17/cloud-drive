import { useEffect, useState, useCallback, useRef } from "react";

const BACKEND = process.env.REACT_APP_API_URL || "http://localhost:5000";

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + " KB";
  return (kb / 1024).toFixed(2) + " MB";
}

function getFileType(name = "") {
  const ext = name.split(".").pop().toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (["mp3", "wav", "aac", "ogg"].includes(ext)) return "audio";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  return "other";
}

function getFileIcon(name = "") {
  const t = getFileType(name);
  if (t === "image") return "🖼️";
  if (t === "video") return "🎬";
  if (t === "audio") return "🎵";
  if (t === "pdf") return "📄";
  if (t === "doc") return "📝";
  return "📁";
}

function getBadge(name = "") {
  const t = getFileType(name);
  if (t === "image") return { label: "IMG", color: "#60a5fa", bg: "rgba(59,130,246,0.13)" };
  if (t === "video") return { label: "VID", color: "#a78bfa", bg: "rgba(139,92,246,0.13)" };
  if (t === "audio") return { label: "AUD", color: "#fbbf24", bg: "rgba(245,158,11,0.13)" };
  if (t === "pdf")   return { label: "PDF", color: "#f87171", bg: "rgba(239,68,68,0.13)" };
  if (t === "doc")   return { label: "DOC", color: "#34d399", bg: "rgba(16,185,129,0.13)" };
  return { label: "FILE", color: "#94a3b8", bg: "rgba(148,163,184,0.13)" };
}

/* ─── Preview Modal ─── */
function PreviewModal({ file, onClose }) {
  if (!file) return null;
  const t = getFileType(file.name);

  const download = async () => {
    try {
      const res = await fetch(file.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = file.name; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Download failed."); }
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",backdropFilter:"blur(14px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,width:"100%",maxWidth:820,maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 0 80px rgba(0,0,0,0.9)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
            <span style={{fontSize:22}}>{getFileIcon(file.name)}</span>
            <span style={{fontSize:14,fontWeight:600,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</span>
          </div>
          <button onClick={onClose} style={{background:"none",border:"none",color:"rgba(255,255,255,0.4)",fontSize:22,cursor:"pointer",padding:4,lineHeight:1,flexShrink:0}}>✕</button>
        </div>
        <div style={{flex:1,overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",padding:24,background:"#0a0a0a",minHeight:280}}>
          {t==="image" && <img src={file.url} alt={file.name} style={{maxWidth:"100%",maxHeight:500,borderRadius:12,objectFit:"contain"}}/>}
          {t==="video" && <video controls style={{maxWidth:"100%",maxHeight:500,borderRadius:12,width:"100%"}}><source src={file.url}/></video>}
          {t==="audio" && <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}><span style={{fontSize:64}}>🎵</span><audio controls style={{width:"100%",minWidth:300}}><source src={file.url}/></audio></div>}
          {t==="pdf" && <iframe src={file.url} title={file.name} style={{width:"100%",height:520,borderRadius:12,border:"none"}}/>}
          {(t==="other"||t==="doc") && <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,textAlign:"center"}}><span style={{fontSize:64}}>{getFileIcon(file.name)}</span><p style={{color:"rgba(255,255,255,0.35)",fontSize:13}}>No preview available — download to open</p></div>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 22px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
          <span style={{fontSize:12,color:"rgba(255,255,255,0.3)"}}>{formatBytes(file.size)} · 👁 {file.views||0} views</span>
          <div style={{display:"flex",gap:8}}>
            <a href={`/share/${file._id}`} target="_blank" rel="noreferrer" style={{padding:"8px 16px",fontSize:13,borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",color:"rgba(255,255,255,0.55)",textDecoration:"none",background:"rgba(255,255,255,0.04)"}}>🔗 Share Page</a>
            <button onClick={download} style={{padding:"8px 16px",fontSize:13,borderRadius:10,border:"none",background:"#fff",color:"#111",fontWeight:700,cursor:"pointer"}}>⬇️ Download</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── File Card ─── */
function FileCard({ f, onPreview, onShare, onDelete, delay }) {
  const [imgErr, setImgErr] = useState(false);
  const badge = getBadge(f.name);
  const type = getFileType(f.name);

  return (
    <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:16,display:"flex",flexDirection:"column",transition:"all 0.2s",animation:`staggerIn 0.4s cubic-bezier(0.16,1,0.3,1) ${delay}s both`}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.16)";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 32px rgba(0,0,0,0.4)";}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.08)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}
    >
      <div onClick={()=>onPreview(f)} style={{width:"100%",height:120,borderRadius:10,overflow:"hidden",background:"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,cursor:"pointer",flexShrink:0}}>
        {type==="image"&&f.url&&!imgErr ? <img src={f.url} alt={f.name} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setImgErr(true)}/> : <span style={{fontSize:36}}>{getFileIcon(f.name)}</span>}
      </div>
      <div onClick={()=>onPreview(f)} style={{display:"flex",alignItems:"flex-start",gap:10,marginBottom:12,cursor:"pointer"}}>
        <span style={{fontSize:20,flexShrink:0}}>{getFileIcon(f.name)}</span>
        <div style={{minWidth:0}}>
          <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.85)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:2,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            {formatBytes(f.size)} · 👁 {f.views||0} views
            <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:99,color:badge.color,background:badge.bg}}>{badge.label}</span>
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:6,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        {[{label:"👁 Preview",c:"",fn:()=>onPreview(f)},{label:"🔗 Share",c:"share",fn:()=>onShare(f._id)},{label:"🗑 Delete",c:"delete",fn:()=>onDelete(f._id)}].map((btn,i)=>(
          <button key={i} onClick={btn.fn} style={{flex:1,padding:"7px 4px",fontSize:11,fontWeight:600,borderRadius:8,border:`1px solid ${btn.c==="share"?"rgba(96,165,250,0.2)":btn.c==="delete"?"rgba(248,113,113,0.2)":"rgba(255,255,255,0.08)"}`,background:btn.c==="share"?"rgba(96,165,250,0.05)":btn.c==="delete"?"rgba(248,113,113,0.05)":"rgba(255,255,255,0.04)",color:btn.c==="share"?"#60a5fa":btn.c==="delete"?"#f87171":"rgba(255,255,255,0.5)",cursor:"pointer",fontFamily:"inherit",transition:"all 0.18s"}}>{btn.label}</button>
        ))}
      </div>
    </div>
  );
}

/* ─── File Transfer Tab ─── */
function FileTransfer() {
  // SEND
  const [sendFile, setSendFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null); // { code, expiresIn, name, size }
  const [sendError, setSendError] = useState("");
  const sendInputRef = useRef();

  // RECEIVE
  const [code, setCode] = useState("");
  const [receiving, setReceiving] = useState(false);
  const [receiveResult, setReceiveResult] = useState(null);
  const [receiveError, setReceiveError] = useState("");

  const doSend = async () => {
    if (!sendFile) return;
    setSending(true); setSendError(""); setSendResult(null);
    try {
      const fd = new FormData(); fd.append("file", sendFile);
      const res = await fetch(`${BACKEND}/transfer/send`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setSendResult(data);
    } catch (e) { setSendError(e.message); }
    finally { setSending(false); }
  };

  const doReceive = async () => {
    if (code.length !== 6) return;
    setReceiving(true); setReceiveError(""); setReceiveResult(null);
    try {
      const res = await fetch(`${BACKEND}/transfer/receive/${code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Code not found");
      setReceiveResult(data);
    } catch (e) { setReceiveError(e.message); }
    finally { setReceiving(false); }
  };

  const downloadFile = async (url, name) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = name; a.click();
    } catch { alert("Download failed."); }
  };

  const card = {background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:28,flex:1};

  return (
    <div style={{animation:"fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)"}}>
      <h2 style={{fontSize:18,fontWeight:700,color:"#fff",marginBottom:6}}>📤 File Transfer</h2>
      <p style={{fontSize:13,color:"rgba(255,255,255,0.4)",marginBottom:28}}>Share any file instantly using a 6-digit code — no account needed on the receiving end</p>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:20,marginBottom:28}}>

        {/* SEND */}
        <div style={card}>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>📤 Send a File</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Upload a file and get a 6-digit code to share</div>

          {!sendResult ? (
            <>
              <div onClick={()=>sendInputRef.current?.click()} style={{border:"1.5px dashed rgba(255,255,255,0.12)",borderRadius:14,padding:"24px 16px",textAlign:"center",cursor:"pointer",marginBottom:14,transition:"border-color 0.2s"}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.28)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"}
              >
                <div style={{fontSize:32,marginBottom:8}}>📂</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.5)"}}>
                  {sendFile ? <><span style={{color:"#fff",fontWeight:600}}>{sendFile.name}</span><br/><span style={{fontSize:11,color:"rgba(255,255,255,0.3)"}}>{formatBytes(sendFile.size)}</span></> : <><span style={{color:"rgba(255,255,255,0.7)"}}>Click to choose</span> a file</>}
                </div>
                <input ref={sendInputRef} type="file" style={{display:"none"}} onChange={e=>{setSendFile(e.target.files[0]);setSendResult(null);}} onClick={e=>e.stopPropagation()}/>
              </div>
              {sendError && <div style={{fontSize:12,color:"#f87171",marginBottom:10}}>{sendError}</div>}
              <button onClick={doSend} disabled={!sendFile||sending} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:!sendFile||sending?"rgba(255,255,255,0.08)":"#fff",color:!sendFile||sending?"rgba(255,255,255,0.25)":"#111",fontSize:13,fontWeight:700,cursor:!sendFile||sending?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                {sending ? "Generating Code..." : "⚡ Generate Code"}
              </button>
            </>
          ) : (
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:12}}>Your Share Code</div>
              <div style={{fontSize:48,fontWeight:700,letterSpacing:12,color:"#fff",fontFamily:"monospace",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:14,padding:"18px 24px",marginBottom:12}}>{sendResult.code}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.35)",marginBottom:20}}>Expires in 24 hours · {sendResult.name}</div>
              <button onClick={()=>{navigator.clipboard.writeText(sendResult.code);alert(`Code ${sendResult.code} copied!`);}} style={{width:"100%",padding:"10px",borderRadius:10,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.06)",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit",marginBottom:10}}>📋 Copy Code</button>
              <button onClick={()=>{setSendResult(null);setSendFile(null);}} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"transparent",color:"rgba(255,255,255,0.35)",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Send another file</button>
            </div>
          )}
        </div>

        {/* RECEIVE */}
        <div style={card}>
          <div style={{fontSize:15,fontWeight:700,color:"#fff",marginBottom:6}}>📥 Receive a File</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginBottom:20}}>Enter the 6-digit code to download the file</div>

          <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",marginBottom:8,fontWeight:500}}>Enter Code</div>
          <input
            value={code}
            onChange={e=>{ setCode(e.target.value.replace(/\D/g,"").slice(0,6)); setReceiveResult(null); setReceiveError(""); }}
            placeholder="000000"
            maxLength={6}
            style={{width:"100%",padding:"14px 16px",borderRadius:12,border:"1px solid rgba(255,255,255,0.12)",background:"rgba(255,255,255,0.05)",color:"#fff",fontSize:24,fontWeight:700,textAlign:"center",letterSpacing:8,fontFamily:"monospace",marginBottom:14,outline:"none"}}
          />
          {receiveError && <div style={{fontSize:12,color:"#f87171",marginBottom:10}}>{receiveError}</div>}
          <button onClick={doReceive} disabled={code.length!==6||receiving} style={{width:"100%",padding:"12px",borderRadius:12,border:"none",background:code.length!==6||receiving?"rgba(255,255,255,0.08)":"#fff",color:code.length!==6||receiving?"rgba(255,255,255,0.25)":"#111",fontSize:13,fontWeight:700,cursor:code.length!==6||receiving?"not-allowed":"pointer",fontFamily:"inherit",transition:"all 0.2s",marginBottom:14}}>
            {receiving ? "Searching..." : "🔍 Find File"}
          </button>

          {receiveResult && (
            <div style={{background:"rgba(74,222,128,0.06)",border:"1px solid rgba(74,222,128,0.2)",borderRadius:14,padding:16}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <span style={{fontSize:28}}>{getFileIcon(receiveResult.name)}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#fff"}}>{receiveResult.name}</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.35)"}}>{formatBytes(receiveResult.size)} · Expires in {receiveResult.expiresIn}</div>
                </div>
              </div>
              <button onClick={()=>downloadFile(receiveResult.url, receiveResult.name)} style={{width:"100%",padding:"10px",borderRadius:10,border:"none",background:"#4ade80",color:"#111",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>⬇️ Download File</button>
            </div>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:18,padding:24}}>
        <div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.6)",marginBottom:20}}>⚙️ How File Transfer Works</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16}}>
          {[
            {num:"1",icon:"📤",title:"Upload File",desc:"Select or drag a file. It gets uploaded to secure cloud storage instantly."},
            {num:"2",icon:"🔢",title:"Get a Code",desc:"A unique 6-digit code is generated and linked to your file. Valid for 24 hours."},
            {num:"3",icon:"📥",title:"Receiver Downloads",desc:"Recipient enters the code on any device and downloads the file instantly."},
          ].map((s,i)=>(
            <div key={i} style={{textAlign:"center",padding:16}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.5)",margin:"0 auto 10px"}}>{s.num}</div>
              <div style={{fontSize:24,marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:"#fff",marginBottom:6}}>{s.title}</div>
              <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function Home() {
  const [files, setFiles] = useState([]);
  const [usage, setUsage] = useState({ used: 0, percent: 0, limit: 1024*1024*1024 });
  const [tab, setTab] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef();

  const fetchFiles = useCallback(async () => {
    try { const res = await fetch(`${BACKEND}/files`); setFiles(await res.json()); }
    catch { setError("Could not load files."); }
  }, []);

  const fetchUsage = useCallback(async () => {
    try { const res = await fetch(`${BACKEND}/usage`); setUsage(await res.json()); }
    catch {}
  }, []);

  useEffect(() => { fetchFiles(); fetchUsage(); }, [fetchFiles, fetchUsage]);
  useEffect(() => {
    const fn = e => { if (e.key === "Escape") setPreviewFile(null); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  const doUpload = async (file) => {
    if (!file) return;
    setUploading(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch(`${BACKEND}/upload`, { method:"POST", body:fd });
      if (!res.ok) throw new Error();
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchFiles(); await fetchUsage();
    } catch { setError("Upload failed. Please try again."); }
    finally { setUploading(false); }
  };

  const deleteFile = async (id) => {
    try {
      await fetch(`${BACKEND}/files/${id}`, { method:"DELETE" });
      if (previewFile?._id === id) setPreviewFile(null);
      await fetchFiles(); await fetchUsage();
    } catch { setError("Could not delete file."); }
  };

  const copyShare = async (id) => {
    const link = `${window.location.origin}/share/${id}`;
    try { await navigator.clipboard.writeText(link); alert("Link copied! 🔗\n\n" + link); }
    catch { prompt("Copy this link:", link); }
  };

  const usedMB = (usage.used / 1024 / 1024).toFixed(2);
  const limitMB = ((usage.limit||1024*1024*1024) / 1024 / 1024).toFixed(0);
  const percent = Math.min(usage.percent||0, 100);

  const tabs = ["🏠 Home", "📁 My Files", "📤 File Transfer", "ℹ️ About"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif !important; background: #0a0a0a !important; color: #fafaf9 !important; }
        @keyframes fadeSlideDown { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes staggerIn { from{opacity:0;transform:translateY(14px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 10px 1px rgba(74,222,128,0.15)} 50%{box-shadow:0 0 20px 4px rgba(74,222,128,0.3)} }
        @keyframes borderPulse { 0%,100%{border-color:rgba(255,255,255,0.09)} 50%{border-color:rgba(255,255,255,0.22)} }
        @keyframes tabPop { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <PreviewModal file={previewFile} onClose={()=>setPreviewFile(null)}/>

      <div style={{fontFamily:"'DM Sans',sans-serif",background:"#0a0a0a",color:"#fafaf9",minHeight:"100vh"}}>

        {/* HEADER */}
        <header style={{background:"rgba(10,10,10,0.92)",backdropFilter:"blur(24px)",borderBottom:"1px solid rgba(255,255,255,0.07)",position:"sticky",top:0,zIndex:100,animation:"fadeSlideDown 0.5s cubic-bezier(0.16,1,0.3,1)"}}>
          <div style={{width:"100%",padding:"0 28px",height:62,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,background:"#fff",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 0 1px rgba(255,255,255,0.1),0 0 20px 4px rgba(255,255,255,0.18)"}}>
                <svg viewBox="0 0 24 24" style={{width:17,height:17,stroke:"#111",fill:"none",strokeWidth:2.2,strokeLinecap:"round",strokeLinejoin:"round"}}>
                  <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
                </svg>
              </div>
              <span style={{fontSize:17,fontWeight:700,letterSpacing:"-0.4px",background:"linear-gradient(100deg,#fff 0%,#888 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Cloud Drive</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:600,letterSpacing:"0.6px",textTransform:"uppercase",color:"#4ade80",background:"rgba(74,222,128,0.07)",border:"1px solid rgba(74,222,128,0.18)",padding:"5px 12px",borderRadius:99,animation:"pulseGlow 3s ease-in-out infinite"}}>
              <div style={{width:6,height:6,background:"#4ade80",borderRadius:"50%",boxShadow:"0 0 6px 2px rgba(74,222,128,0.6)"}}/>
              Secure
            </div>
          </div>
        </header>

        {/* NAVBAR */}
        <nav style={{width:"100%",background:"rgba(8,8,8,0.9)",backdropFilter:"blur(20px)",borderBottom:"1px solid rgba(255,255,255,0.06)",overflow:"hidden"}}>
          <div style={{width:"100%",padding:"0 20px",display:"flex",alignItems:"center",gap:2,height:50,overflowX:"auto"}}>
            {tabs.map((t,i)=>(
              <button key={i} onClick={()=>setTab(i)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 15px",fontSize:13,fontWeight:tab===i?600:500,color:tab===i?"#fff":"rgba(255,255,255,0.4)",border:`1px solid ${tab===i?"rgba(255,255,255,0.14)":"transparent"}`,background:tab===i?"rgba(255,255,255,0.09)":"none",cursor:"pointer",borderRadius:8,fontFamily:"inherit",boxShadow:tab===i?"0 0 18px 2px rgba(255,255,255,0.1)":"none",transition:"color 0.2s,background 0.2s",whiteSpace:"nowrap",flexShrink:0}}>{t}</button>
            ))}
            <div style={{width:1,height:20,background:"rgba(255,255,255,0.08)",margin:"0 8px",flexShrink:0}}/>
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8,padding:"5px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:99,fontSize:12,color:"rgba(255,255,255,0.4)",fontWeight:500,flexShrink:0,animation:"borderPulse 4s ease-in-out infinite"}}>
              <div style={{width:60,height:4,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${percent}%`,background:"linear-gradient(90deg,#4ade80,#22d3ee)",borderRadius:99,transition:"width 1s ease"}}/>
              </div>
              {usedMB} MB / {limitMB} MB
            </div>
          </div>
        </nav>

        {/* MAIN */}
        <main style={{maxWidth:920,margin:"0 auto",padding:"32px 24px"}}>

          {/* HOME TAB */}
          {tab===0 && (
            <div style={{animation:"fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)"}}>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:"18px 20px",marginBottom:24,display:"flex",alignItems:"center",gap:16}}>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.4)",fontWeight:500,whiteSpace:"nowrap"}}>Storage Used</span>
                <div style={{flex:1,height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${percent}%`,background:"linear-gradient(90deg,#4ade80,#22d3ee)",borderRadius:99,transition:"width 1s ease"}}/>
                </div>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap"}}>{usedMB} MB / {limitMB} MB</span>
              </div>

              <div onClick={()=>fileInputRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);const f=e.dataTransfer.files[0];if(f)setSelectedFile(f);}}
                style={{border:`1.5px dashed ${dragging?"rgba(255,255,255,0.35)":"rgba(255,255,255,0.12)"}`,borderRadius:18,background:dragging?"rgba(255,255,255,0.05)":"rgba(255,255,255,0.02)",padding:"36px 24px",textAlign:"center",cursor:"pointer",transition:"border-color 0.2s,background 0.2s",marginBottom:16}}
              >
                <div style={{fontSize:40,marginBottom:10}}>{dragging?"📂":"☁️"}</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.5)",marginBottom:4}}>{dragging?"Drop to upload!":"Drag & drop a file here"}</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.25)"}}>or click to choose a file</div>
                <input ref={fileInputRef} type="file" style={{display:"none"}} onChange={e=>{if(e.target.files[0])setSelectedFile(e.target.files[0]);}} onClick={e=>e.stopPropagation()}/>
              </div>

              {selectedFile && <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textAlign:"center",marginBottom:10}}>📎 {selectedFile.name} · {formatBytes(selectedFile.size)}</div>}
              {error && <div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:"#f87171",fontSize:13,borderRadius:10,padding:"10px 14px",marginBottom:14}}>{error}</div>}

              <button onClick={()=>doUpload(selectedFile)} disabled={uploading||!selectedFile}
                style={{width:"100%",padding:14,borderRadius:12,border:"none",background:uploading||!selectedFile?"rgba(255,255,255,0.08)":"#fff",color:uploading||!selectedFile?"rgba(255,255,255,0.25)":"#111",fontSize:14,fontWeight:700,cursor:uploading||!selectedFile?"not-allowed":"pointer",fontFamily:"inherit",marginBottom:32,boxShadow:uploading||!selectedFile?"none":"0 0 24px 4px rgba(255,255,255,0.12)",transition:"all 0.2s"}}>
                {uploading?"Uploading...":"⚡ Upload File"}
              </button>

              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <span style={{fontSize:18}}>🕐</span>
                <span style={{fontSize:16,fontWeight:700,color:"#fff"}}>Recent Files</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.06)",padding:"3px 10px",borderRadius:99,marginLeft:"auto"}}>{files.length} file{files.length!==1?"s":""}</span>
              </div>
              {files.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 20px",color:"rgba(255,255,255,0.2)"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🗂️</div>
                  <div style={{fontSize:14}}>No files uploaded yet</div>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
                  {files.slice(0,6).map((f,i)=><FileCard key={f._id} f={f} onPreview={setPreviewFile} onShare={copyShare} onDelete={deleteFile} delay={i*0.05}/>)}
                </div>
              )}
            </div>
          )}

          {/* MY FILES TAB */}
          {tab===1 && (
            <div style={{animation:"fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                <span style={{fontSize:18}}>📁</span>
                <span style={{fontSize:16,fontWeight:700,color:"#fff"}}>My Files</span>
                <span style={{fontSize:12,color:"rgba(255,255,255,0.3)",background:"rgba(255,255,255,0.06)",padding:"3px 10px",borderRadius:99,marginLeft:"auto"}}>{files.length} file{files.length!==1?"s":""}</span>
              </div>
              {files.length===0 ? (
                <div style={{textAlign:"center",padding:"80px 20px",color:"rgba(255,255,255,0.2)"}}>
                  <div style={{fontSize:48,marginBottom:12}}>🗂️</div>
                  <div style={{fontSize:14}}>No files uploaded yet</div>
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:14}}>
                  {files.map((f,i)=><FileCard key={f._id} f={f} onPreview={setPreviewFile} onShare={copyShare} onDelete={deleteFile} delay={i*0.04}/>)}
                </div>
              )}
            </div>
          )}

          {/* FILE TRANSFER TAB */}
          {tab===2 && <FileTransfer/>}

          {/* ABOUT TAB */}
          {tab===3 && (
            <div style={{animation:"fadeIn 0.35s cubic-bezier(0.16,1,0.3,1)"}}>
              <div style={{textAlign:"center",padding:"48px 20px 36px"}}>
                <span style={{fontSize:56,display:"block",marginBottom:14}}>☁️</span>
                <div style={{fontSize:28,fontWeight:700,background:"linear-gradient(100deg,#fff 0%,#888 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",marginBottom:10}}>Cloud Drive</div>
                <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",maxWidth:500,margin:"0 auto",lineHeight:1.7}}>A full-stack cloud file storage and sharing application. Upload, organize, preview, and share files — all from one place.</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14,marginBottom:24}}>
                {[
                  {icon:"🔗",title:"Instant Share Links",desc:"Every file gets a unique public link. No account needed for the recipient."},
                  {icon:"🔒",title:"Secure Storage",desc:"Files are stored securely on Supabase with metadata tracked in MongoDB."},
                  {icon:"👁️",title:"View Count Tracking",desc:"Know exactly how many times your shared file has been opened."},
                  {icon:"📁",title:"Auto Organization",desc:"Files are automatically sorted by type — images, videos, PDFs, audio."},
                  {icon:"🎬",title:"Media Previews",desc:"Preview images, videos, audio, and PDFs directly in the browser."},
                  {icon:"📤",title:"File Transfer",desc:"Share files instantly with a 6-digit code. No account needed to receive."},
                ].map((c,i)=>(
                  <div key={i} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:20}}>
                    <div style={{fontSize:24,marginBottom:10}}>{c.icon}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#fff",marginBottom:6}}>{c.title}</div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",lineHeight:1.6}}>{c.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:20}}>
                <div style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.5)",marginBottom:14}}>🛠️ Tech Stack</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {[{l:"React",t:"frontend"},{l:"React Router",t:"frontend"},{l:"Tailwind CSS",t:"frontend"},{l:"Node.js",t:"backend"},{l:"Express.js",t:"backend"},{l:"Multer",t:"backend"},{l:"MongoDB Atlas",t:"db"},{l:"Mongoose",t:"db"},{l:"Supabase",t:"db"},{l:"Vercel",t:"deploy"},{l:"Render",t:"deploy"}].map((c,i)=>(
                    <span key={i} style={{fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:99,color:c.t==="frontend"?"#60a5fa":c.t==="backend"?"#a78bfa":c.t==="db"?"#34d399":"#fbbf24",background:c.t==="frontend"?"rgba(59,130,246,0.12)":c.t==="backend"?"rgba(139,92,246,0.12)":c.t==="db"?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)",border:`1px solid ${c.t==="frontend"?"rgba(59,130,246,0.2)":c.t==="backend"?"rgba(139,92,246,0.2)":c.t==="db"?"rgba(16,185,129,0.2)":"rgba(245,158,11,0.2)"}`}}>{c.l}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}