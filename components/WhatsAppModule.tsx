import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Calendar, Settings, PlusCircle, Clock, ArrowLeft, Trash2, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// URL DE NGROK
const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

export default function WhatsAppModule({ clients }: { clients: any[] }) {
  // ESTADOS PRINCIPALES
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  
  // NAVEGACIÓN
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  const [showMobileChat, setShowMobileChat] = useState(false); // Para celular
  
  // CHAT
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);

  // CRM & CONFIG
  const [crmData, setCrmData] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newStageName, setNewStageName] = useState("");

  // DIFUSIÓN
  const [bulkFilterCat, setBulkFilterCat] = useState("Todas");
  const [bulkFilterStage, setBulkFilterStage] = useState("Todas"); // NUEVO: Filtro por Etapa
  const [selectedBulkClients, setSelectedBulkClients] = useState<string[]>([]);
  const [manualNumbers, setManualNumbers] = useState(""); // NUEVO: Números manuales
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkFile, setBulkFile] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
  const [sendTogether, setSendTogether] = useState(false); // NUEVO: Caption
  const [minDelay, setMinDelay] = useState(3);
  const [maxDelay, setMaxDelay] = useState(7);

  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  // --- CONEXIÓN ---
  useEffect(() => {
    const skt = io(BACKEND_URL, { transports: ['websocket', 'polling'], extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(skt);
    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { setStatus('READY'); fetchChats(); fetchConfig(); });
    skt.on('message', (msg) => { handleNewMsg(msg); audioRef.current.play().catch(()=>{}); });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleNewMsg(msg); });
    skt.on('bulk_progress', setBulkProgress);
    skt.on('bulk_complete', (res) => { setBulkProgress(null); alert(`✅ Fin Difusión: ${res?.sent} enviados.`); });
    return () => { skt.disconnect(); };
  }, []);

  // --- API ---
  const api = async (path: string, opts?: any) => fetch(`${BACKEND_URL}${path}`, { ...opts, headers: { ...opts?.headers, "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' } }).then(r => r.json());

  const fetchChats = () => api('/chats').then(setChats);
  const fetchConfig = () => api('/crm/config').then(d => { setStages(d.stages); setCategories(d.categories); });

  const loadChat = async (id: string) => {
      setSelectedChatId(id);
      setShowMobileChat(true); // Mostrar chat en móvil
      setMessages(await api(`/chats/${id}/messages`));
      setTimeout(()=>msgsEndRef.current?.scrollIntoView(), 100);
      const phone = id.replace(/\D/g, '');
      const crm = await api(`/crm/client/${phone}`);
      setCrmData(crm);
  };

  const handleNewMsg = (msg: any) => {
      setSelectedChatId(prev => {
          const id = msg.fromMe ? msg.to : msg.from;
          if(prev === id) { setMessages(m => [...m, msg]); setTimeout(()=>msgsEndRef.current?.scrollIntoView(), 100); }
          return prev;
      });
      fetchChats();
  };

  const sendMessage = async () => {
      if(!msgInput.trim() || !selectedChatId) return;
      await api('/messages', { method:'POST', body: JSON.stringify({ chatId: selectedChatId, content: msgInput }) });
      setMsgInput("");
  };

  // --- CONFIG ---
  const addStage = async () => {
      if(!newStageName.trim()) return;
      const updated = [...stages, newStageName];
      setStages(updated);
      setNewStageName("");
      await api('/crm/config', { method:'POST', body: JSON.stringify({ stages: updated }) });
  };
  const removeStage = async (idx: number) => {
      const updated = stages.filter((_, i) => i !== idx);
      setStages(updated);
      await api('/crm/config', { method:'POST', body: JSON.stringify({ stages: updated }) });
  };

  // --- DIFUSIÓN LOGIC ---
  const handleFileUpload = (e: any) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => setBulkFile({ data: (reader.result as string).split(',')[1], mimetype: file.type, filename: file.name });
      }
  };

  const sendBulk = () => {
      // Unir clientes seleccionados + números manuales
      const manualList = manualNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 9);
      const finalNumbers = [...new Set([...selectedBulkClients, ...manualList])]; // Eliminar duplicados

      if(finalNumbers.length === 0) return alert("¡No hay destinatarios!");
      if(!bulkMessage && !bulkFile) return alert("Falta mensaje o archivo");

      if(confirm(`Enviar a ${finalNumbers.length} contactos?\nModo: ${sendTogether ? 'Junto (Caption)' : 'Separado'}`)) {
          socket?.emit('bulk_send', { 
              numbers: finalNumbers, 
              message: bulkMessage, 
              media: bulkFile,
              minDelay, maxDelay,
              sendTogether // NUEVO
          });
      }
  };

  // FILTRO INTELIGENTE
  const filteredClients = useMemo(() => {
      return clients.filter(c => {
          const matchCat = bulkFilterCat === "Todas" || c.category === bulkFilterCat;
          // Aquí simulamos que 'clients' tiene la etapa. En realidad deberíamos cruzar con 'crmData' global,
          // pero para simplificar asumimos que el cliente ya tiene esa data o filtramos por lo que hay.
          // *Mejora:* Si quieres filtrar por etapa real del CRM, necesitaríamos cargar todo el CRM al inicio.
          // Por ahora filtraremos por categoría que viene de SapiSoft.
          return matchCat; 
      });
  }, [clients, bulkFilterCat]);

  // RENDER
  if(status !== 'READY') return <div className="flex flex-col items-center justify-center h-screen bg-slate-100 font-bold text-slate-500"><Loader2 className="animate-spin mb-4" size={48}/>Conectando...</div>;

  return (
    <div className="flex h-screen bg-white relative overflow-hidden">
      
      {/* --- COLUMNA 1: LISTA / SIDEBAR (Oculto en móvil si hay chat abierto) --- */}
      <div className={`flex flex-col bg-slate-50 border-r ${showMobileChat ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>
          <div className="p-3 bg-emerald-600 text-white flex justify-between shadow items-center">
              <span className="font-bold flex gap-2"><MessageCircle/> SapiSoft</span>
              <span className="text-[10px] bg-emerald-700 px-2 py-1 rounded">V5.0</span>
          </div>
          
          <div className="flex text-[10px] font-bold border-b bg-white">
              <button onClick={()=>setActiveTab('CHAT')} className={`flex-1 p-3 ${activeTab==='CHAT'?'text-emerald-600 border-b-2 border-emerald-600':''}`}>CHATS</button>
              <button onClick={()=>setActiveTab('BULK')} className={`flex-1 p-3 ${activeTab==='BULK'?'text-blue-600 border-b-2 border-blue-600':''}`}>DIFUSIÓN</button>
              <button onClick={()=>setActiveTab('CONFIG')} className={`flex-1 p-3 ${activeTab==='CONFIG'?'text-slate-600 border-b-2 border-slate-600':''}`}>CONFIG</button>
          </div>

          <div className="flex-1 overflow-y-auto">
              {activeTab === 'CHAT' && chats.map(c => (
                  <div key={c.id._serialized} onClick={() => loadChat(c.id._serialized)} className={`p-3 border-b cursor-pointer hover:bg-slate-100 ${selectedChatId===c.id._serialized?'bg-emerald-50':''}`}>
                      <div className="flex justify-between">
                          <span className="font-bold text-slate-800 text-sm truncate w-32">{c.name || c.id.user}</span>
                          <span className="text-[10px] text-slate-400">{new Date(c.timestamp*1000).toLocaleDateString()}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate h-4">{c.lastMessage?.body || 'Multimedia'}</div>
                  </div>
              ))}

              {activeTab === 'BULK' && (
                  <div className="p-2 space-y-2">
                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block">1. Filtrar Clientes</label>
                          <select className="w-full border text-xs p-1 rounded mt-1" value={bulkFilterCat} onChange={e=>setBulkFilterCat(e.target.value)}>
                              <option value="Todas">Todas las Categorías</option>
                              {categories.map(c=><option key={c} value={c}>{c}</option>)}
                          </select>
                          <div className="text-[10px] mt-1 text-slate-400">Seleccionados: {selectedBulkClients.length}</div>
                      </div>

                      <div className="max-h-60 overflow-y-auto border rounded bg-white">
                          {filteredClients.map((c:any, i:number) => (
                              <div key={i} className="flex gap-2 items-center p-2 border-b hover:bg-slate-50">
                                  <input type="checkbox" checked={selectedBulkClients.includes(c.phone)} onChange={()=>{
                                      setSelectedBulkClients(prev=>prev.includes(c.phone)?prev.filter(p=>p!==c.phone):[...prev, c.phone])
                                  }}/>
                                  <div className="text-xs">
                                      <div className="font-bold">{c.name}</div>
                                      <div className="text-slate-400">{c.phone}</div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block mb-1">2. Números Manuales (Pegar lista)</label>
                          <textarea className="w-full border text-xs p-1 rounded" rows={3} placeholder="999888777, 999111222..." value={manualNumbers} onChange={e=>setManualNumbers(e.target.value)}/>
                          <p className="text-[9px] text-slate-400">Separa por comas o saltos de línea.</p>
                      </div>
                  </div>
              )}

              {activeTab === 'CONFIG' && (
                  <div className="p-4 space-y-4">
                      <div>
                          <h3 className="font-bold text-sm text-slate-700 mb-2">Etapas de Venta</h3>
                          <div className="flex gap-2 mb-2">
                              <input className="flex-1 border p-1 text-sm rounded" placeholder="Nueva etapa..." value={newStageName} onChange={e=>setNewStageName(e.target.value)}/>
                              <button onClick={addStage} className="bg-emerald-600 text-white p-1 rounded"><PlusCircle size={18}/></button>
                          </div>
                          <div className="space-y-1">
                              {stages.map((s, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                      <span>{s}</span>
                                      <button onClick={()=>removeStage(i)} className="text-red-500"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div>
                          <h3 className="font-bold text-sm text-slate-700 mb-2">Categorías</h3>
                          {/* Mismo componente para categorías si deseas */}
                          <div className="text-xs text-slate-400 bg-slate-100 p-2 rounded">Edita las categorías en SapiSoft Principal.</div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* --- COLUMNA 2: CHAT AREA (Visible en móvil si showMobileChat=true) --- */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {activeTab === 'BULK' ? (
              // PANEL DIFUSIÓN GRANDE
              <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                  <div className="bg-white w-full max-w-lg p-6 rounded shadow h-fit">
                      <h2 className="text-lg font-bold text-blue-600 flex gap-2 mb-4"><Users/> Configurar Envío</h2>
                      
                      {bulkProgress ? (
                           <div className="text-center py-10">
                               <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={40}/>
                               <div className="text-3xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div>
                               <p className="text-sm text-slate-400">Enviando a: {bulkProgress.lastPhone}</p>
                           </div>
                      ) : (
                          <>
                            <div className="flex gap-4 mb-4 bg-slate-50 p-3 rounded border">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Min Delay</label>
                                    <input type="number" className="w-full border p-1 rounded" value={minDelay} onChange={e=>setMinDelay(Number(e.target.value))}/>
                                </div>
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Max Delay</label>
                                    <input type="number" className="w-full border p-1 rounded" value={maxDelay} onChange={e=>setMaxDelay(Number(e.target.value))}/>
                                </div>
                            </div>

                            <textarea className="w-full border p-3 rounded mb-3" rows={4} placeholder="Escribe tu oferta..." value={bulkMessage} onChange={e=>setBulkMessage(e.target.value)}/>
                            
                            <div className="flex flex-col gap-3 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 p-2 rounded border hover:bg-slate-200">
                                    <Paperclip size={16}/> 
                                    <span className="text-sm font-bold text-slate-600">{bulkFile ? bulkFile.filename : 'Adjuntar Imagen/Video'}</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*"/>
                                    {bulkFile && <button onClick={(e)=>{e.preventDefault(); setBulkFile(null);}} className="ml-auto text-red-500 text-xs">X</button>}
                                </label>

                                {bulkFile && (
                                    <label className="flex items-center gap-2 p-2 border rounded bg-blue-50 cursor-pointer">
                                        <div className={`w-4 h-4 border rounded flex items-center justify-center ${sendTogether ? 'bg-blue-600 border-blue-600' : 'bg-white'}`}>
                                            {sendTogether && <CheckCircle size={12} className="text-white"/>}
                                        </div>
                                        <input type="checkbox" className="hidden" checked={sendTogether} onChange={()=>setSendTogether(!sendTogether)}/>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-blue-800">Enviar como descripción (Caption)</span>
                                            <span className="text-[10px] text-blue-600">La foto y el texto salen en una sola burbuja.</span>
                                        </div>
                                        <ImageIcon size={20} className="ml-auto text-blue-300"/>
                                    </label>
                                )}
                            </div>

                            <button onClick={sendBulk} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 shadow">
                                ENVIAR ({new Set([...selectedBulkClients, ...manualNumbers.split(/[\n,]+/).filter(n=>n.trim().length>8)]).size})
                            </button>
                          </>
                      )}
                  </div>
              </div>
          ) : selectedChatId ? (
              // CHAT INTERFACE
              <>
                <div className="p-3 bg-slate-100 border-b flex justify-between items-center shadow-sm z-10">
                    <div className="flex items-center gap-2">
                        {/* Botón Volver (Solo móvil) */}
                        <button onClick={()=>setShowMobileChat(false)} className="md:hidden p-1 bg-white rounded-full shadow"><ArrowLeft size={16}/></button>
                        <span className="font-bold text-slate-800 truncate max-w-[150px]">{chats.find(c=>c.id._serialized===selectedChatId)?.name}</span>
                    </div>
                    {/* CRM STAGE SELECTOR */}
                    {crmData && (
                        <select className="text-xs border rounded p-1 bg-white text-emerald-700 font-bold outline-none" 
                                value={crmData.stage} 
                                onChange={async (e) => {
                                    const stage = e.target.value;
                                    setCrmData({...crmData, stage});
                                    await api('/crm/client', { method:'POST', body:JSON.stringify({phone:selectedChatId.replace(/\D/g,''), stage}) });
                                }}>
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {messages.map((m, i) => {
                        // FIX: Solo mostrar si hay contenido o multimedia
                        if(!m.body && !m.type.includes('image') && !m.type.includes('video')) return null;
                        
                        return (
                            <div key={i} className={`flex ${m.fromMe?'justify-end':'justify-start'}`}>
                                <div className={`max-w-[85%] md:max-w-[60%] p-2 rounded-lg text-sm shadow relative pb-5 min-w-[80px] ${m.fromMe?'bg-[#d9fdd3] rounded-tr-none':'bg-white rounded-tl-none'}`}>
                                    {m.body}
                                    <span className="text-[9px] text-slate-400 absolute bottom-0.5 right-1.5 flex items-center gap-1">
                                        {new Date(m.timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={msgsEndRef}/>
                </div>

                <div className="p-2 bg-slate-100 flex gap-2">
                    <input className="flex-1 border p-3 rounded-full text-sm outline-none focus:border-emerald-500 shadow-sm" 
                           value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} placeholder="Escribe..."/>
                    <button onClick={sendMessage} className="bg-emerald-600 text-white p-3 rounded-full shadow hover:bg-emerald-700 transition-transform active:scale-95"><Send size={18}/></button>
                </div>
              </>
          ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageCircle size={64} className="opacity-20 mb-4"/>
                  <p className="text-sm font-bold uppercase tracking-widest">SapiSoft Chat</p>
                  <p className="text-xs mt-2">Selecciona un contacto</p>
              </div>
          )}
      </div>

      {/* --- COLUMNA 3: CRM PANEL (Oculto en móvil) --- */}
      {selectedChatId && crmData && activeTab === 'CHAT' && (
          <div className="hidden md:flex w-72 bg-white border-l flex-col shadow-xl z-20">
              <div className="p-4 bg-slate-50 border-b font-bold text-slate-700 flex gap-2 items-center"><User size={16}/> Ficha CRM</div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Categoría</label>
                      <div className="flex flex-wrap gap-1">
                          {categories.map(cat => (
                              <button key={cat} onClick={async ()=>{
                                  setCrmData({...crmData, category: cat});
                                  await api('/crm/client', { method:'POST', body:JSON.stringify({phone:selectedChatId.replace(/\D/g,''), category: cat}) });
                              }} className={`text-[10px] px-2 py-1 rounded border transition-colors ${crmData.category===cat?'bg-blue-600 text-white border-blue-600':'hover:bg-slate-50'}`}>{cat}</button>
                          ))}
                      </div>
                  </div>

                  <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Notas</label>
                      <div className="space-y-2">
                          {crmData.notes.map((n:any) => (
                              <div key={n.id} className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs relative group">
                                  <p>{n.text}</p>
                                  <span className="text-[9px] text-slate-400 mt-1 block">{new Date(n.date).toLocaleDateString()}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>

              <div className="p-3 border-t bg-slate-50">
                  <textarea className="w-full border text-xs p-2 rounded mb-2 bg-white focus:ring-1 focus:ring-blue-500 outline-none" rows={2} placeholder="Nueva nota..." value={newNote} onChange={e=>setNewNote(e.target.value)}/>
                  <button onClick={async ()=>{
                      const res = await api('/crm/client', { method:'POST', body:JSON.stringify({phone:selectedChatId.replace(/\D/g,''), note: newNote}) });
                      setCrmData({...crmData, notes: res.data.notes});
                      setNewNote("");
                  }} className="w-full bg-slate-800 text-white text-xs py-2 rounded font-bold hover:bg-slate-900">Guardar Nota</button>
              </div>
          </div>
      )}
    </div>
  );
}