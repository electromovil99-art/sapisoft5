import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Settings, PlusCircle, ArrowLeft, Trash2, Edit2, Save, Filter, Briefcase, Image as ImageIcon, Search, X, Video, File, Forward, Tag, FileSpreadsheet } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

export default function WhatsAppModule({ clients = [] }: { clients: any[] }) {
  // --- ESTADOS DE SISTEMA ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // --- ESTADOS DE DATOS ---
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const [fullCrmDb, setFullCrmDb] = useState<any>({ clients: {}, stages: [], labels: [] });
  const [crmClient, setCrmClient] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  
  // --- ESTADOS DE EDICIÓN ---
  const [newNote, setNewNote] = useState("");
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newLabelName, setNewLabelName] = useState("");
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [tempStageName, setTempStageName] = useState("");

  // --- ESTADOS DE DIFUSIÓN (BULK) ---
  const [bulkFilterStage, setBulkFilterStage] = useState("Todas");
  const [bulkFilterLabel, setBulkFilterLabel] = useState("Todas");
  const [selectedBulkClients, setSelectedBulkClients] = useState<string[]>([]);
  const [manualNumbers, setManualNumbers] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkFile, setBulkFile] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
  const [sendTogether, setSendTogether] = useState(true);
  const [minDelay, setMinDelay] = useState(4);
  const [maxDelay, setMaxDelay] = useState(8);

  // --- ESTADOS DE REENVÍO ---
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [msgToForward, setMsgToForward] = useState<any>(null);
  const [forwardSearch, setForwardSearch] = useState("");

  const msgsEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- EFECTOS ---
  useEffect(() => {
    if (typeof window !== 'undefined') audioRef.current = new Audio(NOTIFICATION_SOUND);
  }, []);

  useEffect(() => {
    const skt = io(BACKEND_URL, { 
      transports: ['websocket', 'polling'], 
      extraHeaders: { "ngrok-skip-browser-warning": "true" } 
    });
    setSocket(skt);

    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { setStatus('READY'); refreshData(); });
    skt.on('message', (msg) => { 
        handleIncomingMessage(msg);
        audioRef.current?.play().catch(() => {});
    });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleIncomingMessage(msg); });
    skt.on('bulk_progress', setBulkProgress);
    skt.on('bulk_complete', (res) => { 
        setBulkProgress(null); 
        alert(`Difusión Finalizada con éxito.`); 
    });

    return () => { skt.disconnect(); };
  }, []);

  // --- LÓGICA DE API ---
  const apiCall = async (path: string, method = 'GET', body?: any) => {
    try {
      const options: any = {
        method,
        headers: { "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' }
      };
      if (body) options.body = JSON.stringify(body);
      const res = await fetch(`${BACKEND_URL}${path}`, options);
      return await res.json();
    } catch (e) {
      console.error("API Error:", e);
      return null;
    }
  };

  const refreshData = async () => {
    const [chatsData, dbData] = await Promise.all([ apiCall('/chats'), apiCall('/crm/all') ]);
    if (Array.isArray(chatsData)) setChats(chatsData);
    if (dbData) {
      setFullCrmDb(dbData);
      setStages(dbData.stages || []);
      setLabels(dbData.labels || []);
    }
  };

  const loadChat = async (id: string) => {
    setSelectedChatId(id);
    setShowMobileChat(true);
    const msgs = await apiCall(`/chats/${id}/messages`);
    if (msgs) setMessages(msgs);
    const phone = id.replace(/\D/g, '');
    const client = await apiCall(`/crm/client/${phone}`);
    if (client) setCrmClient(client);
    setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  const handleIncomingMessage = (msg: any) => {
    const currentChat = msg.fromMe ? msg.to : msg.from;
    if (selectedChatId === currentChat) {
      if (msg.hasMedia) setTimeout(() => loadChat(selectedChatId), 1500);
      else setMessages(prev => [...prev, msg]);
      setTimeout(() => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    refreshData();
  };

  // --- LÓGICA DE NEGOCIO ---
  const handleExcelImport = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt: any) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const found = data.map(r => r[0]).filter(n => n && n.toString().length > 7);
      setManualNumbers(prev => (prev ? prev + ", " : "") + found.join(", "));
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e: any) => {
    const file = e.target.files?.[0];
    if(file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => setBulkFile({ data: (reader.result as string).split(',')[1], mimetype: file.type, filename: file.name });
    }
  };

  const updateCrm = async (field: string, value: any) => {
    if(!selectedChatId) return;
    const phone = selectedChatId.replace(/\D/g, '');
    const res = await apiCall('/crm/client', 'POST', { phone, [field]: value });
    if (res?.data) {
      setCrmClient(res.data);
      setFullCrmDb((prev:any) => ({ ...prev, clients: { ...prev.clients, [phone]: res.data } }));
    }
    if(field === 'agent') setIsEditingAgent(false);
  };

  const handleRenameStage = async (oldName: string) => {
    if(!tempStageName || tempStageName === oldName) { setEditingStageIndex(null); return; }
    await apiCall('/crm/stage/rename', 'POST', { oldName, newName: tempStageName });
    setEditingStageIndex(null);
    refreshData();
  };

  // --- FILTROS ---
  const chatListFiltered = useMemo(() => {
    return (chats || []).filter(c => {
      const phone = c.id?.user || "";
      const info = fullCrmDb.clients?.[phone] || {};
      const st = info.stage || stages[0] || "Nuevo";
      return (chatFilterStage === "Todos" || st === chatFilterStage) && 
             (c.name || phone).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [chats, chatFilterStage, fullCrmDb, searchTerm, stages]);

  const bulkListFiltered = useMemo(() => {
    const phones = new Set([...chats.map(c => c.id?.user), ...(clients || []).map(c => c.phone)].filter(Boolean));
    return Array.from(phones).map(p => {
      const info = fullCrmDb.clients?.[p] || {};
      const n = clients.find(cl => cl.phone === p)?.name || chats.find(ch => ch.id?.user === p)?.name || p;
      return { phone: p, name: n, stage: info.stage || stages[0] || "Nuevo", labels: info.labels || [] };
    }).filter(item => {
      const matchSt = bulkFilterStage === "Todas" || item.stage === bulkFilterStage;
      const matchLb = bulkFilterLabel === "Todas" || item.labels.includes(bulkFilterLabel);
      return matchSt && matchLb && (item.name + item.phone).toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [chats, clients, fullCrmDb, bulkFilterStage, bulkFilterLabel, searchTerm, stages]);

  // --- COMPONENTES DE RENDERIZADO ---
  const MessageBubble = ({ m }: { m: any }) => {
    const isMedia = m.hasMedia || m.mediaData;
    const src = m.mediaData ? `data:${m.mimetype};base64,${m.mediaData}` : null;
    return (
      <div className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'} mb-2`}>
        <div className={`max-w-[80%] p-2 rounded-xl shadow-sm relative group ${m.fromMe ? 'bg-emerald-100 rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow rounded-full p-1 cursor-pointer z-10" onClick={() => { setMsgToForward(m); setForwardModalOpen(true); }}>
            <Forward size={14} className="text-blue-600" />
          </div>
          {isMedia && (
            <div className="mb-1 rounded overflow-hidden max-w-xs">
              {src ? (
                m.type === 'video' ? <video src={src} controls className="w-full h-auto" /> : 
                <img src={src} className="w-full h-auto cursor-pointer" onClick={() => window.open().document.write(`<img src="${src}" style="width:100%"/>`)} />
              ) : <div className="p-4 bg-slate-100 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>}
            </div>
          )}
          {m.body && <div className="text-sm whitespace-pre-wrap">{m.body}</div>}
          <div className="text-[10px] text-slate-400 text-right mt-1">{new Date(m.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    );
  };

  if (status !== 'READY' && status !== 'DISCONNECTED') {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        {qrCode ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl text-center">
            <h2 className="text-xl font-bold mb-4">Vincular SapiSoft</h2>
            <QRCodeSVG value={qrCode} size={250} />
            <p className="mt-4 text-slate-500 text-sm">Escanea con tu WhatsApp</p>
          </div>
        ) : <Loader2 className="animate-spin text-emerald-600" size={48} />}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <div className={`flex flex-col bg-white border-r w-full md:w-80 shrink-0 ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shadow-md shrink-0">
          <h1 className="font-bold flex items-center gap-2"><MessageCircle /> SapiSoft Pro</h1>
          <button onClick={refreshData}><Settings size={18} /></button>
        </div>
        
        <div className="flex border-b text-[11px] font-bold uppercase shrink-0">
          {['CHAT', 'BULK', 'CONFIG'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 p-3 transition-colors ${activeTab === tab ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/30' : 'text-slate-400'}`}>{tab}</button>
          ))}
        </div>

        <div className="p-2 border-b bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 focus-within:ring-2 ring-emerald-100 transition-all">
            <Search size={14} className="text-slate-400" />
            <input className="bg-transparent outline-none text-xs w-full" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'CHAT' && (
            <>
              <div className="p-2 bg-white border-b sticky top-0 z-10">
                <select className="w-full text-xs border rounded p-1.5 outline-none bg-slate-50" value={chatFilterStage} onChange={e => setChatFilterStage(e.target.value)}>
                  <option value="Todos">Todas las Etapas</option>
                  {stages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {chatListFiltered.map(c => (
                <div key={c.id?._serialized} onClick={() => loadChat(c.id?._serialized)} className={`p-3 border-b cursor-pointer transition-colors hover:bg-slate-50 ${selectedChatId === c.id?._serialized ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''}`}>
                  <div className="flex justify-between items-center mb-1 font-bold text-sm truncate">{c.name || c.id?.user} {fullCrmDb.clients?.[c.id?.user]?.stage && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full">{fullCrmDb.clients[c.id.user].stage}</span>}</div>
                  <div className="text-xs text-slate-400 truncate">{c.lastMessage?.body || 'Multimedia'}</div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'BULK' && (
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Filtros de Base</label>
                <select className="w-full text-xs border rounded p-2" value={bulkFilterStage} onChange={e => setBulkFilterStage(e.target.value)}><option value="Todas">Etapa: Todas</option>{stages.map(s => <option key={s} value={s}>{s}</option>)}</select>
                <select className="w-full text-xs border rounded p-2" value={bulkFilterLabel} onChange={e => setBulkFilterLabel(e.target.value)}><option value="Todas">Etiqueta: Todas</option>{labels.map(l => <option key={l} value={l}>{l}</option>)}</select>
              </div>
              <div className="border rounded-lg bg-white overflow-hidden">
                <div className="p-2 bg-slate-50 border-b flex justify-between items-center text-[10px] font-bold">CONTACTOS ({bulkListFiltered.length}) <button onClick={() => setSelectedBulkClients(bulkListFiltered.map(l => l.phone))} className="text-emerald-600">TODOS</button></div>
                <div className="max-h-48 overflow-y-auto">
                  {bulkListFiltered.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 border-b text-xs hover:bg-slate-50">
                      <input type="checkbox" checked={selectedBulkClients.includes(u.phone)} onChange={() => setSelectedBulkClients(prev => prev.includes(u.phone) ? prev.filter(p => p !== u.phone) : [...prev, u.phone])} />
                      <span className="truncate flex-1">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <textarea className="w-full border rounded p-2 text-xs h-16" placeholder="Números manuales (519...)" value={manualNumbers} onChange={e => setManualNumbers(e.target.value)} />
                <label className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg cursor-pointer hover:bg-emerald-100 transition-colors font-bold text-xs"><FileSpreadsheet size={16} />Cargar Excel<input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} /></label>
              </div>
            </div>
          )}

          {activeTab === 'CONFIG' && (
            <div className="p-4 space-y-6">
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Settings size={14}/> Editor de Etapas</h3>
                <div className="flex gap-2 mb-3">
                  <input className="flex-1 border rounded-lg p-2 text-xs" placeholder="Nueva etapa..." value={newStageName} onChange={e => setNewStageName(e.target.value)} />
                  <button onClick={() => { if(newStageName) { saveStages([...stages, newStageName]); setNewStageName(""); }}} className="bg-emerald-600 text-white p-2 rounded-lg"><PlusCircle size={18} /></button>
                </div>
                <div className="space-y-1">
                  {stages.map((s, i) => (
                    <div key={i} className="bg-slate-50 p-2 rounded-lg text-xs border flex justify-between items-center group">
                      {editingStageIndex === i ? (
                        <div className="flex gap-1 w-full"><input className="flex-1 border p-1 text-[10px] rounded" autoFocus value={tempStageName} onChange={e=>setTempStageName(e.target.value)} /><button onClick={()=>handleRenameStage(s)} className="text-green-600"><Save size={14}/></button></div>
                      ) : (
                        <>{s} <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={()=>{setEditingStageIndex(i); setTempStageName(s);}} className="text-blue-500"><Edit2 size={12}/></button><button onClick={()=>{if(confirm('¿Eliminar?')) saveStages(stages.filter((_, idx)=>idx!==i))}} className="text-red-400"><Trash2 size={12}/></button></div></>
                      )}
                    </div>
                  ))}
                </div>
              </section>
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Tag size={14}/> Etiquetas Globales</h3>
                <div className="flex gap-2 mb-3">
                  <input className="flex-1 border rounded-lg p-2 text-xs" placeholder="Nueva etiqueta..." value={newLabelName} onChange={e => setNewLabelName(e.target.value)} />
                  <button onClick={() => { if(newLabelName){ const u = [...labels, newLabelName]; setLabels(u); apiCall('/crm/labels/update', 'POST', { labels: u }); setNewLabelName(""); }}} className="bg-blue-600 text-white p-2 rounded-lg"><PlusCircle size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">{labels.map((l, i) => <span key={i} className="bg-blue-50 text-blue-600 px-2 py-1 rounded-md text-[10px] border border-blue-100 font-bold">{l}</span>)}</div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* ÁREA CENTRAL */}
      <div className={`flex-1 flex flex-col bg-[#efeae2] h-full ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
        {activeTab === 'BULK' ? (
          <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
            <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-lg mt-6">
              <h2 className="text-xl font-bold mb-6 flex gap-2"><Users className="text-blue-600"/> Campaña Masiva</h2>
              {bulkProgress ? (<div className="py-20 text-center"><Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={48} /><p className="font-bold text-lg">{bulkProgress.current} / {bulkProgress.total}</p><p className="text-xs text-slate-400">Enviando mensajes...</p></div>) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border">
                    <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Retraso Mínimo</label><input type="number" className="w-full border rounded p-2 text-sm" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} /></div>
                    <div><label className="text-[10px] font-bold text-slate-400 mb-1 block uppercase">Retraso Máximo</label><input type="number" className="w-full border rounded p-2 text-sm" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} /></div>
                  </div>
                  <textarea className="w-full border rounded-xl p-4 text-sm focus:ring-2 ring-blue-100 outline-none" rows={6} placeholder="Escribe tu mensaje..." value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} />
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-300 transition-colors text-slate-500">
                      <Paperclip size={18}/><span className="text-sm flex-1">{bulkFile ? bulkFile.filename : 'Subir Imagen o Video'}</span><input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                    </label>
                    {bulkFile && (
                      <label className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={sendTogether} onChange={() => setSendTogether(!sendTogether)} /><span className="text-xs font-bold text-blue-700">Enviar texto como leyenda (Caption)</span>
                      </label>
                    )}
                  </div>
                  <button onClick={() => apiCall('/bulk/send', 'POST', { numbers: Array.from(new Set([...selectedBulkClients, ...manualNumbers.split(',').map(n => n.trim())])).filter(n => n.length > 7), message: bulkMessage, media: bulkFile, minDelay, maxDelay, sendTogether })} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">INICIAR ENVÍO MASIVO</button>
                </div>
              )}
            </div>
          </div>
        ) : selectedChatId ? (
          <div className="flex flex-col h-full">
             <div className="p-3 bg-white border-b flex justify-between items-center shadow-sm shrink-0">
               <div className="flex items-center gap-3">
                 <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20} /></button>
                 <div className="font-bold text-slate-700">{chats.find(c => c.id?._serialized === selectedChatId)?.name || 'Chat'}</div>
               </div>
               {crmClient && (<select className="text-xs border rounded-full px-3 py-1 bg-emerald-50 text-emerald-700 font-bold border-emerald-200 outline-none" value={crmClient.stage} onChange={(e) => updateCrm('stage', e.target.value)}>{stages.map(s => <option key={s} value={s}>{s}</option>)}</select>)}
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0 bg-[#efeae2]">{messages.map((m, i) => <MessageBubble key={i} m={m} />)}<div ref={msgsEndRef} /></div>
             <div className="p-3 bg-white border-t flex gap-2 shrink-0">
               <input className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:ring-2 ring-emerald-100 outline-none" value={msgInput} onChange={e => setMsgInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendText()} placeholder="Escribe un mensaje..." />
               <button onClick={() => { if(msgInput) { apiCall('/messages', 'POST', { chatId: selectedChatId, content: msgInput }); setMsgInput(""); }}} className="bg-emerald-600 text-white p-3 rounded-full shadow-md"><Send size={20} /></button>
             </div>
          </div>
        ) : <div className="flex-1 flex flex-col items-center justify-center text-slate-300"><MessageCircle size={80} className="mb-4 opacity-10" /><p className="font-medium text-lg">SapiSoft Pro CRM</p></div>}
      </div>

      {/* CRM PANEL (DERECHA) */}
      {selectedChatId && crmClient && activeTab === 'CHAT' && (
        <div className="hidden lg:flex w-72 bg-white border-l flex-col h-full shadow-2xl">
          <div className="p-4 border-b bg-slate-50 font-bold flex items-center gap-2 shrink-0"><User size={18} className="text-emerald-600" /> Perfil</div>
          <div className="p-4 flex-1 overflow-y-auto space-y-6">
             <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Agente</label><div className="text-sm font-bold text-blue-700 flex gap-2 bg-blue-50 p-3 rounded-xl"><Briefcase size={16}/> {crmClient.agent || "Sistema"}</div></div>
             <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Etiquetas</label>
               <div className="flex flex-wrap gap-1.5">
                 {labels.map(l => (<button key={l} onClick={() => { const c = crmClient.labels || []; const n = c.includes(l) ? c.filter((i:any)=>i!==l) : [...c, l]; updateCrm('labels', n); }} className={`text-[10px] px-3 py-1.5 rounded-lg border font-bold transition-all ${crmClient.labels?.includes(l) ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 hover:border-emerald-300'}`}>{l}</button>))}
               </div>
             </div>
             <div><label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Historial</label>
               <div className="space-y-2">
                 {crmClient.notes?.map((n:any) => (<div key={n.id} className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-xs text-slate-600 leading-relaxed">{n.text}<div className="text-[9px] text-amber-500 mt-2 font-bold">{new Date(n.date).toLocaleDateString()}</div></div>))}
               </div>
             </div>
          </div>
          <div className="p-4 border-t bg-slate-50 space-y-2 shrink-0"><textarea className="w-full border rounded-xl p-2 text-xs outline-none focus:ring-2 ring-emerald-100" rows={3} placeholder="Nueva nota..." value={newNote} onChange={e => setNewNote(e.target.value)} /><button onClick={() => { if(newNote) updateCrm('note', newNote).then(() => setNewNote("")); }} className="w-full bg-slate-800 text-white text-xs py-2.5 rounded-xl font-bold hover:bg-black">Guardar Nota</button></div>
        </div>
      )}
    </div>
  );
}