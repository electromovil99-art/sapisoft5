import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Settings, PlusCircle, ArrowLeft, Trash2, Edit2, Save, Filter, Briefcase, Image as ImageIcon, Search, X, Video, File, Forward, Tag, FileSpreadsheet } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import * as XLSX from 'xlsx';

const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

export default function WhatsAppModule({ clients = [] }: { clients: any[] }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const [chatFilterStage, setChatFilterStage] = useState("Todos");
  
  // ESTRUCTURA PROTEGIDA PARA EVITAR PANTALLA BLANCA
  const [fullCrmDb, setFullCrmDb] = useState<any>({ clients: {}, stages: [], labels: [] });
  const [crmClient, setCrmClient] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);
  
  const [newNote, setNewNote] = useState("");
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [newStageName, setNewStageName] = useState("");
  const [newLabelName, setNewLabelName] = useState(""); 
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [tempStageName, setTempStageName] = useState("");
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
  const [forwardModalOpen, setForwardModalOpen] = useState(false);
  const [msgToForward, setMsgToForward] = useState<any>(null);
  const [forwardSearch, setForwardSearch] = useState("");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => { if (typeof window !== 'undefined') { audioRef.current = new Audio(NOTIFICATION_SOUND); } }, []);

  useEffect(() => {
    const skt = io(BACKEND_URL, { transports: ['websocket', 'polling'], extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(skt);
    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { setStatus('READY'); fetchChats(); fetchFullDb(); });
    skt.on('message', (msg) => { handleNewMsg(msg); audioRef.current?.play().catch(() => {}); });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleNewMsg(msg); });
    skt.on('bulk_progress', setBulkProgress);
    skt.on('bulk_complete', (res) => { setBulkProgress(null); alert(`✅ FINALIZADO.\nEnviados: ${res?.sent}\nErrores: ${res?.errors}`); });
    return () => { skt.disconnect(); };
  }, []);

  const api = async (path: string, opts?: any) => {
    try {
      const response = await fetch(`${BACKEND_URL}${path}`, { ...opts, headers: { ...opts?.headers, "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' } });
      return response.json();
    } catch (e) { return null; }
  };

  const fetchChats = () => api('/chats').then(data => setChats(Array.isArray(data) ? data : []));
  const fetchFullDb = async () => { 
      const db = await api('/crm/all'); 
      if(db) {
          setFullCrmDb(db); 
          setStages(db.stages || []); 
          setLabels(db.labels || []); 
      }
  };

  const loadChat = async (id: string) => {
      setSelectedChatId(id); setShowMobileChat(true);
      const data = await api(`/chats/${id}/messages`);
      if(data) setMessages(data);
      setTimeout(()=>msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
      const phone = id.replace(/\D/g, '');
      const clientRes = await api(`/crm/client/${phone}`);
      if(clientRes) setCrmClient(clientRes);
  };

  const handleNewMsg = (msg: any) => {
      setSelectedChatId(prev => {
          if(prev === (msg.fromMe ? msg.to : msg.from)) { 
              if(msg.hasMedia) setTimeout(() => loadChat(prev), 1500); 
              else { setMessages(m => [...m, msg]); setTimeout(()=>msgsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
          }
          return prev;
      });
      fetchChats();
  };

  const sendMessage = async (chatId = selectedChatId, content = msgInput) => {
      if(!content.trim() || !chatId) return;
      await api('/messages', { method:'POST', body: JSON.stringify({ chatId, content }) });
      if(chatId === selectedChatId) setMsgInput("");
  };

  const handleExcelUpload = (e: any) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (evt: any) => {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
          const numbers = data.map((row) => row[0]).filter((n) => n && n.toString().length > 6);
          setManualNumbers(prev => (prev ? prev + ", " : "") + numbers.join(", "));
          alert(`✅ Importados ${numbers.length} números`);
      };
      reader.readAsBinaryString(file);
  };

  // FILTROS BLINDADOS CONTRA PANTALLA BLANCA
  const filteredChatList = useMemo(() => {
      if (!Array.isArray(chats)) return [];
      return chats.filter(c => {
          const phone = c.id?.user || "";
          const stage = fullCrmDb.clients?.[phone]?.stage || stages[0] || "Nuevo";
          const matchesStage = chatFilterStage === "Todos" || stage === chatFilterStage;
          const matchesSearch = String(c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
          return matchesStage && matchesSearch;
      });
  }, [chats, chatFilterStage, fullCrmDb, stages, searchTerm]);

  const filteredBulkList = useMemo(() => {
      const allPhones = new Set([...chats.map(c => c.id?.user), ...(clients || []).map(c => c.phone)].filter(Boolean));
      let list = Array.from(allPhones).map(phone => {
          const crmInfo = fullCrmDb.clients?.[phone] || {};
          const name = clients?.find(c=>c.phone === phone)?.name || chats.find(c=>c.id?.user === phone)?.name || phone;
          return { phone, name, stage: crmInfo.stage || stages[0] || "Nuevo", labels: crmInfo.labels || [] };
      });
      if(bulkFilterStage !== "Todas") list = list.filter(c => c.stage === bulkFilterStage);
      if(bulkFilterLabel !== "Todas") list = list.filter(c => Array.isArray(c.labels) && c.labels.includes(bulkFilterLabel));
      if(searchTerm) {
          list = list.filter(c => String(c.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || String(c.phone || "").includes(searchTerm));
      }
      return list;
  }, [chats, clients, fullCrmDb, bulkFilterStage, bulkFilterLabel, stages, searchTerm]);

  const updateCrm = async (field: string, value: any) => {
      if(!selectedChatId) return;
      const phone = selectedChatId.replace(/\D/g, '');
      const res = await api('/crm/client', { method:'POST', body: JSON.stringify({ phone, [field]: value }) });
      if(res && res.data) {
          setCrmClient(res.data);
          setFullCrmDb((prev:any) => ({ ...prev, clients: { ...prev.clients, [phone]: res.data } }));
      }
      if(field === 'agent') setIsEditingAgent(false);
  };

  const renderMessageContent = (m: any) => {
      const isMedia = m.hasMedia || m.type === 'image' || m.type === 'video';
      const mediaSrc = m.mediaData ? `data:${m.mimetype};base64,${m.mediaData}` : null;
      return (
          <div className={`max-w-[85%] md:max-w-[60%] p-2 rounded-lg text-sm shadow relative break-words flex flex-col gap-1 group ${m.fromMe?'bg-[#d9fdd3] rounded-tr-none':'bg-white rounded-tl-none'}`}>
              <div className="flex absolute -top-2 -right-2 bg-white rounded-full shadow p-1 cursor-pointer z-10" onClick={()=>{setMsgToForward(m); setForwardModalOpen(true);}}>
                  <Forward size={14} className="text-blue-500"/>
              </div>
              {isMedia && (
                  <div className="rounded overflow-hidden mb-1">
                      {mediaSrc ? (
                          m.type === 'video' ? <video src={mediaSrc} controls className="w-full max-h-64 object-contain rounded"/> : 
                          <img src={mediaSrc} alt="Media" className="w-full max-h-64 object-cover rounded cursor-pointer" onClick={() => { const w = window.open(""); w?.document.write(`<img src="${mediaSrc}" style="width:100%"/>`); }}/>
                      ) : ( <div className="bg-slate-100 p-4 flex items-center justify-center border rounded"><Loader2 className="animate-spin text-slate-400" size={20}/></div> )}
                  </div>
              )}
              {m.body && <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>}
              <span className="text-[9px] text-slate-400 block text-right mt-1">{new Date(m.timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
          </div>
      );
  };

  if(status !== 'READY') return <div className="flex flex-col items-center justify-center h-full bg-slate-100 font-bold text-slate-500 min-h-[500px]"><Loader2 className="animate-spin mb-4" size={48}/>Conectando...</div>;

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-slate-800 font-sans relative">
      {/* SIDEBAR */}
      <div className={`flex flex-col bg-slate-50 border-r h-full ${showMobileChat ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>
          <div className="p-3 bg-emerald-600 text-white flex justify-between items-center shadow shrink-0"><span className="font-bold flex gap-2"><MessageCircle/> SapiSoft</span></div>
          <div className="flex text-[10px] font-bold border-b bg-white shrink-0">{['CHAT','BULK','CONFIG'].map(t => (<button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 p-3 ${activeTab===t?'text-emerald-600 border-b-2 border-emerald-600':''}`}>{t}</button>))}</div>
          <div className="p-2 bg-white border-b shrink-0"><div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1.5 border"><Search size={14} className="text-slate-400"/><input className="bg-transparent outline-none text-xs w-full" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></div>
          
          <div className="flex-1 overflow-y-auto min-h-0">
              {activeTab === 'CHAT' && (
                  <>
                    <div className="p-2 bg-slate-50 border-b sticky top-0 z-10"><div className="flex items-center gap-2 bg-white rounded border p-1"><Filter size={14} className="text-slate-400"/><select className="w-full text-xs outline-none bg-transparent" value={chatFilterStage} onChange={e=>setChatFilterStage(e.target.value)}><option value="Todos">Todas las Etapas</option>{stages.map(s => <option key={s} value={s}>{s}</option>)}</select></div></div>
                    {filteredChatList.map(c => (
                        <div key={c.id?._serialized} onClick={() => loadChat(c.id?._serialized)} className={`p-3 border-b cursor-pointer hover:bg-slate-100 ${selectedChatId===c.id?._serialized?'bg-emerald-50':''}`}>
                            <div className="flex justify-between font-bold text-sm truncate">{c.name || c.id?.user}</div>
                            <div className="flex justify-between items-center text-xs text-slate-500 truncate">{c.lastMessage?.body || '...'}</div>
                        </div>
                    ))}
                  </>
              )}
              {activeTab === 'BULK' && (
                  <div className="p-2 space-y-3">
                      <div className="bg-white p-2 rounded border space-y-2">
                          <div><label className="text-xs font-bold block mb-1">Filtrar Etapa</label><select className="w-full border text-xs p-1 rounded" value={bulkFilterStage} onChange={e=>setBulkFilterStage(e.target.value)}><option value="Todas">Todas</option>{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                          <div><label className="text-xs font-bold block mb-1">Filtrar Etiqueta</label><select className="w-full border text-xs p-1 rounded" value={bulkFilterLabel} onChange={e=>setBulkFilterLabel(e.target.value)}><option value="Todas">Todas</option>{labels.map(l=><option key={l} value={l}>{l}</option>)}</select></div>
                          <div className="text-[10px] mt-1 text-blue-600 font-bold">Resultados: {filteredBulkList.length}</div>
                      </div>
                      <div className="max-h-60 overflow-y-auto border rounded bg-white">
                          {filteredBulkList.map((c:any, i:number) => (
                              <div key={i} className="flex gap-2 items-center p-2 border-b">
                                  <input type="checkbox" checked={selectedBulkClients.includes(c.phone)} onChange={()=>{setSelectedBulkClients(prev=>prev.includes(c.phone)?prev.filter(p=>p!==c.phone):[...prev, c.phone])}}/>
                                  <div className="text-xs">
                                      <div className="font-bold">{c.name}</div>
                                      <div className="flex gap-1">{c.labels?.map((l:string)=><span key={l} className="bg-blue-100 text-blue-700 px-1 rounded text-[8px]">{l}</span>)}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="bg-white p-2 rounded border">
                          <textarea className="w-full border text-xs p-1 rounded font-mono mb-2" rows={2} placeholder="Números manuales..." value={manualNumbers} onChange={e=>setManualNumbers(e.target.value)}/>
                          <label className="flex items-center gap-2 cursor-pointer bg-emerald-50 p-2 rounded border justify-center"><FileSpreadsheet size={16}/><span className="text-xs font-bold">Importar Excel</span><input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleExcelUpload}/></label>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative h-full min-h-0 ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {activeTab === 'BULK' ? (
              <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                  <div className="bg-white w-full max-w-lg p-6 rounded shadow h-fit">
                      <h2 className="text-lg font-bold text-blue-600 mb-4 flex gap-2"><Users/> Difusión Masiva</h2>
                      {bulkProgress ? (<div className="text-center py-10"><Loader2 className="animate-spin mx-auto mb-2"/><div className="text-3xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div></div>) : (
                          <>
                            <textarea className="w-full border p-3 rounded mb-3" rows={4} placeholder="Mensaje..." value={bulkMessage} onChange={e=>setBulkMessage(e.target.value)}/>
                            <button onClick={() => socket?.emit('bulk_send', { numbers: selectedBulkClients.concat(manualNumbers.split(',').map(n => n.trim())).filter(Boolean), message: bulkMessage, media: bulkFile, minDelay, maxDelay, sendTogether })} className="w-full bg-blue-600 text-white py-3 rounded font-bold">ENVIAR AHORA</button>
                          </>
                      )}
                  </div>
              </div>
          ) : (
             <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="p-2 bg-slate-100 border-b flex justify-between items-center shadow-sm">
                    <span className="font-bold truncate">{chats.find(c=>c.id?._serialized===selectedChatId)?.name || 'Chat'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">{messages.map((m, i) => (<div key={i} className={`flex ${m.fromMe?'justify-end':'justify-start'}`}>{renderMessageContent(m)}</div>))}<div ref={msgsEndRef}/></div>
                <div className="p-2 bg-slate-100 flex gap-2"><input className="flex-1 border p-2 rounded-full" value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} placeholder="Escribe..."/><button onClick={()=>sendMessage()} className="bg-emerald-600 text-white p-2 rounded-full"><Send size={18}/></button></div>
             </div>
          )}
      </div>

      {/* CRM PANEL */}
      {selectedChatId && crmClient && activeTab === 'CHAT' && (
          <div className="hidden md:flex w-72 bg-white border-l flex-col h-full">
              <div className="p-4 border-b font-bold flex gap-2"><User size={16}/> Cliente</div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Atendido por:</label>
                    <div className="font-bold text-blue-800 text-sm flex gap-2 items-center mt-1"><Briefcase size={12}/> {crmClient.agent}</div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Etiquetas</label>
                    <div className="flex flex-wrap gap-1">
                      {labels.map(l => (
                        <button key={l} onClick={() => {
                          const currentLabels = crmClient.labels || [];
                          const newLabels = currentLabels.includes(l) ? currentLabels.filter((i:any)=>i!==l) : [...currentLabels, l];
                          updateCrm('labels', newLabels);
                        }} className={`text-[10px] px-2 py-1 rounded border ${crmClient.labels?.includes(l) ? 'bg-green-500 text-white' : 'bg-white'}`}>{l}</button>
                      ))}
                    </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}