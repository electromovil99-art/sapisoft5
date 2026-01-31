import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Settings, PlusCircle, ArrowLeft, Trash2, Edit2, Save, Filter, Briefcase, Image as ImageIcon, Search } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// ⚠️ URL DE NGROK (¡Actualízala si cambió!)
const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

export default function WhatsAppModule({ clients }: { clients: any[] }) {
  // --- ESTADOS ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // BÚSQUEDA (NUEVO)
  const [searchTerm, setSearchTerm] = useState("");

  // CHAT
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);
  const [chatFilterStage, setChatFilterStage] = useState("Todos");

  // CRM
  const [fullCrmDb, setFullCrmDb] = useState<any>({ clients: {}, stages: [] });
  const [crmClient, setCrmClient] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [isEditingAgent, setIsEditingAgent] = useState(false);

  // CONFIG
  const [newStageName, setNewStageName] = useState("");
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);
  const [tempStageName, setTempStageName] = useState("");

  // DIFUSIÓN
  const [bulkFilterStage, setBulkFilterStage] = useState("Todas");
  const [selectedBulkClients, setSelectedBulkClients] = useState<string[]>([]);
  const [manualNumbers, setManualNumbers] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkFile, setBulkFile] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
  const [sendTogether, setSendTogether] = useState(true);
  const [minDelay, setMinDelay] = useState(4);
  const [maxDelay, setMaxDelay] = useState(8);

  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  // --- EFECTOS ---
  useEffect(() => {
    const skt = io(BACKEND_URL, { transports: ['websocket', 'polling'], extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(skt);
    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { setStatus('READY'); fetchChats(); fetchFullDb(); });
    skt.on('message', (msg) => { handleNewMsg(msg); audioRef.current.play().catch(()=>{}); });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleNewMsg(msg); });
    skt.on('bulk_progress', setBulkProgress); // Aún escuchamos socket para la barra de progreso
    skt.on('bulk_complete', (res) => { setBulkProgress(null); alert(`✅ FINALIZADO.\nEnviados: ${res?.sent}\nErrores: ${res?.errors}`); });
    return () => { skt.disconnect(); };
  }, []);

  // Limpiar búsqueda al cambiar pestaña
  useEffect(() => { setSearchTerm(""); }, [activeTab]);

  // --- API ---
  const api = async (path: string, opts?: any) => fetch(`${BACKEND_URL}${path}`, { ...opts, headers: { ...opts?.headers, "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' } }).then(r => r.json());

  const fetchChats = () => api('/chats').then(setChats);
  const fetchFullDb = async () => {
      const db = await api('/crm/all');
      setFullCrmDb(db);
      setStages(db.stages || []);
  };
  const loadChat = async (id: string) => {
      setSelectedChatId(id); setShowMobileChat(true);
      setMessages(await api(`/chats/${id}/messages`));
      setTimeout(()=>msgsEndRef.current?.scrollIntoView(), 100);
      const phone = id.replace(/\D/g, '');
      setCrmClient(await api(`/crm/client/${phone}`));
  };
  const handleNewMsg = (msg: any) => {
      setSelectedChatId(prev => {
          if(prev === (msg.fromMe ? msg.to : msg.from)) { setMessages(m => [...m, msg]); setTimeout(()=>msgsEndRef.current?.scrollIntoView(), 100); }
          return prev;
      });
      fetchChats();
  };
  const sendMessage = async () => {
      if(!msgInput.trim() || !selectedChatId) return;
      await api('/messages', { method:'POST', body: JSON.stringify({ chatId: selectedChatId, content: msgInput }) });
      setMsgInput("");
  };

  // --- LOGICA MASIVOS (HTTP) ---
  const sendBulk = async () => {
      setBulkProgress(null);
      const manualList = manualNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 7);
      const finalNumbers = [...new Set([...selectedBulkClients, ...manualList])];
      if(finalNumbers.length === 0) return alert("Selecciona destinatarios");

      if(confirm(`¿Enviar a ${finalNumbers.length} contactos?`)) {
          setBulkProgress({ current: 0, total: finalNumbers.length, lastPhone: 'Iniciando...' });
          try {
              await api('/bulk/send', { 
                  method: 'POST', 
                  body: JSON.stringify({ numbers: finalNumbers, message: bulkMessage, media: bulkFile, minDelay, maxDelay, sendTogether }) 
              });
          } catch (e) { alert("Error al conectar"); setBulkProgress(null); }
      }
  };

  const handleFileUpload = (e: any) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => setBulkFile({ data: (reader.result as string).split(',')[1], mimetype: file.type, filename: file.name });
      }
  };

  // --- FILTROS INTELIGENTES (CON BUSCADOR) ---
  const filteredChatList = useMemo(() => {
      let list = chats;
      // 1. Filtro por Etapa
      if(chatFilterStage !== "Todos") {
          list = list.filter(c => (fullCrmDb.clients[c.id.user]?.stage || stages[0]) === chatFilterStage);
      }
      // 2. Filtro por Buscador (Nombre o Teléfono)
      if(searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          list = list.filter(c => 
              (c.name && c.name.toLowerCase().includes(lowerSearch)) || 
              c.id.user.includes(lowerSearch)
          );
      }
      return list;
  }, [chats, chatFilterStage, fullCrmDb, stages, searchTerm]);

  const filteredBulkList = useMemo(() => {
      const allPhones = new Set([...chats.map(c => c.id.user), ...clients.map(c => c.phone)]);
      let list = Array.from(allPhones).map(phone => {
          const crmInfo = fullCrmDb.clients[phone] || {};
          const name = clients.find(c=>c.phone === phone)?.name || chats.find(c=>c.id.user === phone)?.name || phone;
          return { phone, name, stage: crmInfo.stage || stages[0] };
      });

      // 1. Filtro por Etapa
      if(bulkFilterStage !== "Todas") {
          list = list.filter(c => c.stage === bulkFilterStage);
      }
      // 2. Filtro por Buscador
      if(searchTerm) {
          const lowerSearch = searchTerm.toLowerCase();
          list = list.filter(c => 
              (c.name && c.name.toLowerCase().includes(lowerSearch)) || 
              c.phone.includes(lowerSearch)
          );
      }
      return list;
  }, [chats, clients, fullCrmDb, bulkFilterStage, stages, searchTerm]);

  const filteredStages = useMemo(() => {
      if(!searchTerm) return stages;
      return stages.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [stages, searchTerm]);

  // --- CRM UPDATES ---
  const updateCrm = async (field: string, value: string) => {
      if(!selectedChatId) return;
      const phone = selectedChatId.replace(/\D/g, '');
      const res = await api('/crm/client', { method:'POST', body: JSON.stringify({ phone, [field]: value }) });
      setCrmClient(res.data);
      if(field === 'agent') setIsEditingAgent(false);
      setFullCrmDb((prev:any) => ({ ...prev, clients: { ...prev.clients, [phone]: res.data } }));
  };
  const addStage = async () => {
      if(!newStageName) return;
      const updated = [...stages, newStageName];
      setStages(updated);
      await api('/crm/config', { method:'POST', body: JSON.stringify({ stages: updated }) });
      setNewStageName("");
  };
  const renameStage = async (oldName: string) => {
      if(!tempStageName || tempStageName === oldName) { setEditingStageIndex(null); return; }
      const res = await api('/crm/stage/rename', { method:'POST', body: JSON.stringify({ oldName, newName: tempStageName }) });
      setStages(res.stages);
      setFullCrmDb((prev:any) => {
          const newClients = {...prev.clients};
          Object.keys(newClients).forEach(k => { if(newClients[k].stage === oldName) newClients[k].stage = tempStageName; });
          return { ...prev, clients: newClients };
      });
      setEditingStageIndex(null);
  };

  // --- RENDER ---
  if(status !== 'READY') return <div className="flex flex-col items-center justify-center h-screen bg-slate-100 font-bold text-slate-500"><Loader2 className="animate-spin mb-4" size={48}/>Conectando...</div>;

  return (
    <div className="flex h-screen bg-white overflow-hidden text-slate-800 font-sans">
      {/* SIDEBAR */}
      <div className={`flex flex-col bg-slate-50 border-r ${showMobileChat ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>
          {/* HEADER */}
          <div className="p-3 bg-emerald-600 text-white flex justify-between items-center shadow">
              <span className="font-bold flex gap-2"><MessageCircle/> SapiSoft</span>
          </div>
          
          {/* TABS */}
          <div className="flex text-[10px] font-bold border-b bg-white">
              {['CHAT','BULK','CONFIG'].map(t => (
                  <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 p-3 ${activeTab===t?'text-emerald-600 border-b-2 border-emerald-600':''}`}>{t}</button>
              ))}
          </div>

          {/* BUSCADOR UNIVERSAL (NUEVO) */}
          <div className="p-2 bg-white border-b">
              <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-2 py-1.5 border focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
                  <Search size={14} className="text-slate-400"/>
                  <input 
                    className="bg-transparent outline-none text-xs w-full placeholder:text-slate-400"
                    placeholder={activeTab === 'CHAT' ? "Buscar chat o número..." : activeTab === 'BULK' ? "Buscar cliente..." : "Buscar etapa..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && <button onClick={()=>setSearchTerm("")} className="text-[10px] text-slate-400 bg-slate-200 rounded-full px-1">✕</button>}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto">
              {/* === TAB CHAT === */}
              {activeTab === 'CHAT' && (
                  <>
                    <div className="p-2 bg-slate-50 border-b">
                        <div className="flex items-center gap-2 rounded border p-1 bg-white">
                            <Filter size={14} className="text-slate-400"/>
                            <select className="w-full text-xs outline-none bg-transparent" value={chatFilterStage} onChange={e=>setChatFilterStage(e.target.value)}>
                                <option value="Todos">Todas las Etapas</option>
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    {filteredChatList.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No hay resultados</div>}
                    {filteredChatList.map(c => (
                        <div key={c.id._serialized} onClick={() => loadChat(c.id._serialized)} className={`p-3 border-b cursor-pointer hover:bg-slate-100 ${selectedChatId===c.id._serialized?'bg-emerald-50':''}`}>
                            <div className="flex justify-between"><span className="font-bold text-sm truncate w-32">{c.name || c.id.user}</span><span className="text-[10px] text-slate-400">{new Date(c.timestamp*1000).toLocaleDateString()}</span></div>
                            <div className="flex justify-between items-center mt-1"><span className="text-xs text-slate-500 truncate w-32">{c.lastMessage?.body || '📎 Adjunto'}</span>
                                {fullCrmDb.clients[c.id.user]?.stage && <span className="text-[9px] px-1 bg-blue-100 text-blue-700 rounded border border-blue-200">{fullCrmDb.clients[c.id.user].stage}</span>}
                            </div>
                        </div>
                    ))}
                  </>
              )}

              {/* === TAB BULK (DIFUSIÓN) === */}
              {activeTab === 'BULK' && (
                  <div className="p-2 space-y-3">
                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block mb-1">Filtrar por Etapa</label>
                          <select className="w-full border text-xs p-1 rounded" value={bulkFilterStage} onChange={e=>setBulkFilterStage(e.target.value)}>
                              <option value="Todas">Todas</option>
                              {stages.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="text-[10px] mt-1 text-blue-600 font-bold">
                              Resultados: {filteredBulkList.length} 
                              {searchTerm && <span className="text-slate-400 font-normal ml-1">(Filtrado por texto)</span>}
                          </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto border rounded bg-white">
                          <div className="p-1 bg-slate-50 border-b flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">LISTA DE CLIENTES</span>
                              <button onClick={()=>setSelectedBulkClients(filteredBulkList.map(c=>c.phone))} className="text-[9px] text-blue-600 hover:underline">Seleccionar Todos</button>
                          </div>
                          {filteredBulkList.map((c:any, i:number) => (
                              <div key={i} className="flex gap-2 items-center p-2 border-b hover:bg-slate-50">
                                  <input type="checkbox" checked={selectedBulkClients.includes(c.phone)} onChange={()=>{setSelectedBulkClients(prev=>prev.includes(c.phone)?prev.filter(p=>p!==c.phone):[...prev, c.phone])}}/>
                                  <div className="text-xs"><div className="font-bold">{c.name}</div><span className="bg-slate-100 px-1 rounded text-[9px]">{c.stage}</span></div>
                              </div>
                          ))}
                      </div>
                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block mb-1">Números Manuales</label>
                          <textarea className="w-full border text-xs p-1 rounded font-mono" rows={3} placeholder="999888777..." value={manualNumbers} onChange={e=>setManualNumbers(e.target.value)}/>
                      </div>
                  </div>
              )}

              {/* === TAB CONFIG === */}
              {activeTab === 'CONFIG' && (
                  <div className="p-4 space-y-4">
                      <div>
                          <h3 className="font-bold text-sm text-slate-700 mb-2">Editor de Etapas</h3>
                          <div className="flex gap-2 mb-2">
                              <input className="flex-1 border p-1 text-sm rounded" placeholder="Nueva etapa..." value={newStageName} onChange={e=>setNewStageName(e.target.value)}/>
                              <button onClick={addStage} className="bg-emerald-600 text-white p-1 rounded"><PlusCircle size={18}/></button>
                          </div>
                          <div className="space-y-1">
                              {filteredStages.map((s, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                      {editingStageIndex === i ? (
                                          <div className="flex gap-1 w-full">
                                              <input className="flex-1 border p-1 text-xs" autoFocus defaultValue={s} onChange={(e)=>setTempStageName(e.target.value)}/>
                                              <button onClick={()=>renameStage(s)} className="text-green-600"><Save size={14}/></button>
                                          </div>
                                      ) : (
                                          <>
                                            <span>{s}</span>
                                            <div className="flex gap-2"><button onClick={()=>{setEditingStageIndex(i); setTempStageName(s);}} className="text-blue-500"><Edit2 size={14}/></button></div>
                                          </>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* CHAT AREA (CENTRAL) */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {activeTab === 'BULK' ? (
              <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                  <div className="bg-white w-full max-w-lg p-6 rounded shadow h-fit">
                      <h2 className="text-lg font-bold text-blue-600 flex gap-2 mb-4"><Users/> Difusión Masiva (API)</h2>
                      {bulkProgress ? (
                           <div className="text-center py-10">
                               <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={40}/>
                               <div className="text-3xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div>
                               <p className="text-slate-500 text-sm">Enviando a: {bulkProgress.lastPhone}</p>
                           </div>
                      ) : (
                          <>
                            <div className="flex gap-4 mb-4 bg-slate-50 p-2 rounded border">
                                <div className="flex-1"><label className="text-[10px] font-bold">Min Delay</label><input type="number" className="w-full border rounded" value={minDelay} onChange={e=>setMinDelay(Number(e.target.value))}/></div>
                                <div className="flex-1"><label className="text-[10px] font-bold">Max Delay</label><input type="number" className="w-full border rounded" value={maxDelay} onChange={e=>setMaxDelay(Number(e.target.value))}/></div>
                            </div>
                            <textarea className="w-full border p-3 rounded mb-3" rows={4} placeholder="Mensaje..." value={bulkMessage} onChange={e=>setBulkMessage(e.target.value)}/>
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 p-2 rounded border"><Paperclip size={16}/> <span className="text-sm font-bold">{bulkFile ? bulkFile.filename : 'Subir Imagen'}</span><input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*"/>{bulkFile && <button onClick={(e)=>{e.preventDefault(); setBulkFile(null);}} className="ml-auto text-red-500">X</button>}</label>
                                {bulkFile && (<label className="flex items-center gap-2 p-2 border rounded bg-blue-50 cursor-pointer"><input type="checkbox" checked={sendTogether} onChange={()=>setSendTogether(!sendTogether)}/><span className="text-xs font-bold text-blue-800">Enviar junto (Caption)</span></label>)}
                            </div>
                            <button onClick={sendBulk} className="w-full bg-blue-600 text-white py-3 rounded font-bold shadow hover:bg-blue-700">ENVIAR AHORA</button>
                          </>
                      )}
                  </div>
              </div>
          ) : selectedChatId ? (
             <div className="flex-1 flex flex-col">
                <div className="p-2 bg-slate-100 border-b flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={()=>setShowMobileChat(false)} className="md:hidden p-1 bg-white rounded-full"><ArrowLeft size={16}/></button>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{chats.find(c=>c.id._serialized===selectedChatId)?.name}</span>
                    </div>
                    {crmClient && (
                        <select className="text-xs border rounded p-1 bg-white text-emerald-700 font-bold outline-none" value={crmClient.stage} onChange={(e) => updateCrm('stage', e.target.value)}>{stages.map(s => <option key={s} value={s}>{s}</option>)}</select>
                    )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {messages.map((m, i) => {
                        if(!m.body && !m.type.includes('image')) return null;
                        return (<div key={i} className={`flex ${m.fromMe?'justify-end':'justify-start'}`}><div className={`max-w-[70%] p-2 rounded-lg text-sm shadow relative ${m.fromMe?'bg-[#d9fdd3] rounded-tr-none':'bg-white rounded-tl-none'}`}>{m.body}<span className="text-[9px] text-slate-400 block text-right mt-1">{new Date(m.timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div></div>)
                    })}
                    <div ref={msgsEndRef}/>
                </div>
                <div className="p-2 bg-slate-100 flex gap-2"><input className="flex-1 border p-2 rounded-full" value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} placeholder="Escribe..."/><button onClick={sendMessage} className="bg-emerald-600 text-white p-2 rounded-full"><Send size={18}/></button></div>
             </div>
          ) : <div className="flex items-center justify-center h-full text-slate-400">Selecciona un chat</div>}
      </div>

      {/* CRM PANEL (DERECHA) */}
      {selectedChatId && crmClient && activeTab === 'CHAT' && (
          <div className="hidden md:flex w-72 bg-white border-l flex-col shadow-xl z-20">
              <div className="p-4 bg-slate-50 border-b"><h3 className="font-bold text-slate-700 flex gap-2 items-center"><User size={16}/> Cliente</h3></div>
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">Atendido por:<button onClick={()=>setIsEditingAgent(!isEditingAgent)} className="text-blue-600"><Edit2 size={12}/></button></label>
                      {isEditingAgent ? <input className="w-full text-xs border p-1 rounded mt-1" defaultValue={crmClient.agent} onBlur={(e)=>updateCrm('agent', e.target.value)} autoFocus/> : <div className="font-bold text-blue-800 text-sm flex gap-2 items-center mt-1"><Briefcase size={12}/> {crmClient.agent}</div>}
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Historial</label>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                          {crmClient.notes.map((n:any) => (
                              <div key={n.id} className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs">
                                  <p>{n.text}</p>
                                  <span className="text-[9px] text-slate-400 mt-1 block">{new Date(n.date).toLocaleDateString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
              <div className="p-3 border-t bg-slate-50">
                  <textarea className="w-full border text-xs p-2 rounded mb-2" rows={2} placeholder="Nueva nota..." value={newNote} onChange={e=>setNewNote(e.target.value)}/>
                  <button onClick={()=>updateCrm('note', newNote).then(()=>setNewNote(""))} className="w-full bg-slate-800 text-white text-xs py-2 rounded">Guardar Nota</button>
              </div>
          </div>
      )}
    </div>
  );
}