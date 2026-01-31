import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Settings, PlusCircle, ArrowLeft, Trash2, CheckCircle, Image as ImageIcon, Briefcase, Edit3 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';
const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

export default function WhatsAppModule({ clients }: { clients: any[] }) {
  // --- ESTADOS ---
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // CHAT
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);

  // CRM GLOBAL (Toda la DB para filtros)
  const [fullCrmDb, setFullCrmDb] = useState<any>({ clients: {}, stages: [] });
  const [crmClient, setCrmClient] = useState<any>(null); // Cliente actual seleccionado
  
  const [stages, setStages] = useState<string[]>([]);
  const [agents, setAgents] = useState<string[]>([]); // Lista de vendedores
  
  const [newNote, setNewNote] = useState("");
  const [newStageName, setNewStageName] = useState("");
  const [isEditingAgent, setIsEditingAgent] = useState(false); // Modo edición vendedor

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

  // --- CONEXIÓN ---
  useEffect(() => {
    const skt = io(BACKEND_URL, { transports: ['websocket', 'polling'], extraHeaders: { "ngrok-skip-browser-warning": "true" } });
    setSocket(skt);
    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { 
        setStatus('READY'); 
        fetchChats(); 
        fetchFullDb(); // Cargar todo el CRM para filtros
    });
    skt.on('message', (msg) => { handleNewMsg(msg); audioRef.current.play().catch(()=>{}); });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleNewMsg(msg); });
    skt.on('bulk_progress', setBulkProgress);
    skt.on('bulk_complete', (res) => { setBulkProgress(null); alert(`✅ Enviados: ${res?.sent} | Errores: ${res?.errors}`); });
    return () => { skt.disconnect(); };
  }, []);

  const api = async (path: string, opts?: any) => fetch(`${BACKEND_URL}${path}`, { ...opts, headers: { ...opts?.headers, "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' } }).then(r => r.json());

  const fetchChats = () => api('/chats').then(setChats);
  
  const fetchFullDb = async () => {
      const db = await api('/crm/all');
      setFullCrmDb(db);
      setStages(db.stages || []);
      setAgents(db.agents || ["Admin"]);
  };

  const loadChat = async (id: string) => {
      setSelectedChatId(id);
      setShowMobileChat(true);
      setMessages(await api(`/chats/${id}/messages`));
      setTimeout(()=>msgsEndRef.current?.scrollIntoView(), 100);
      const phone = id.replace(/\D/g, '');
      const clientData = await api(`/crm/client/${phone}`);
      setCrmClient(clientData);
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

  // --- CRM ACTIONS ---
  const updateCrm = async (field: string, value: string) => {
      if(!selectedChatId) return;
      const phone = selectedChatId.replace(/\D/g, '');
      const res = await api('/crm/client', { method:'POST', body: JSON.stringify({ phone, [field]: value }) });
      setCrmClient(res.data);
      if(field === 'agent') setIsEditingAgent(false); // Salir modo edición
      // Actualizar DB global para que los filtros funcionen al instante
      setFullCrmDb((prev:any) => ({
          ...prev,
          clients: { ...prev.clients, [phone]: res.data }
      }));
  };

  const addStage = async () => {
      if(!newStageName) return;
      const updated = [...stages, newStageName];
      setStages(updated);
      await api('/crm/config', { method:'POST', body: JSON.stringify({ stages: updated }) });
      setNewStageName("");
  };

  // --- DIFUSIÓN ---
  const handleFileUpload = (e: any) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => setBulkFile({ data: (reader.result as string).split(',')[1], mimetype: file.type, filename: file.name });
      }
  };

  const sendBulk = () => {
      const manualList = manualNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n.length >= 7);
      const finalNumbers = [...new Set([...selectedBulkClients, ...manualList])];
      if(finalNumbers.length === 0) return alert("¡Ingresa números o selecciona clientes!");

      if(confirm(`¿Enviar a ${finalNumbers.length} contactos?\n(El sistema agregará prefijo 51 si falta)`)) {
          socket?.emit('bulk_send', { numbers: finalNumbers, message: bulkMessage, media: bulkFile, minDelay, maxDelay, sendTogether });
      }
  };

  // --- FILTRO PODEROSO ---
  const filteredBulkList = useMemo(() => {
      // 1. Obtenemos lista base (de Chats recientes + SapiSoft clients)
      // *Truco:* Usamos los chats recientes como fuente principal de "contactos" para el CRM
      const allPhones = new Set([...chats.map(c => c.id.user), ...clients.map(c => c.phone)]);
      
      return Array.from(allPhones).map(phone => {
          // Buscar datos en CRM Global
          const crmInfo = fullCrmDb.clients[phone] || {};
          const name = clients.find(c=>c.phone === phone)?.name || chats.find(c=>c.id.user === phone)?.name || phone;
          return { phone, name, stage: crmInfo.stage || stages[0] };
      }).filter(c => {
          if(bulkFilterStage === "Todas") return true;
          return c.stage === bulkFilterStage;
      });
  }, [chats, clients, fullCrmDb, bulkFilterStage, stages]);


  // RENDER
  if(status !== 'READY') return <div className="flex flex-col items-center justify-center h-screen bg-slate-100 font-bold text-slate-500"><Loader2 className="animate-spin mb-4" size={48}/>Cargando CRM...</div>;

  return (
    <div className="flex h-screen bg-white relative overflow-hidden text-slate-800">
      
      {/* SIDEBAR */}
      <div className={`flex flex-col bg-slate-50 border-r ${showMobileChat ? 'hidden md:flex md:w-80' : 'w-full md:w-80'}`}>
          <div className="p-3 bg-emerald-600 text-white flex justify-between items-center shadow">
              <span className="font-bold flex gap-2"><MessageCircle/> SapiSoft CRM</span>
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
                          <span className="font-bold text-sm truncate w-32">{c.name || c.id.user}</span>
                          <span className="text-[10px] text-slate-400">{new Date(c.timestamp*1000).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-slate-500 truncate w-32">{c.lastMessage?.body || '📎 Adjunto'}</span>
                          {/* Etiqueta CRM pequeña */}
                          {fullCrmDb.clients[c.id.user]?.stage && (
                              <span className="text-[9px] px-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                                  {fullCrmDb.clients[c.id.user].stage}
                              </span>
                          )}
                      </div>
                  </div>
              ))}

              {activeTab === 'BULK' && (
                  <div className="p-2 space-y-3">
                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block mb-1">Filtrar por Etapa de Venta</label>
                          <select className="w-full border text-xs p-1 rounded" value={bulkFilterStage} onChange={e=>setBulkFilterStage(e.target.value)}>
                              <option value="Todas">Todas las Etapas</option>
                              {stages.map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                          <div className="text-[10px] mt-1 text-blue-600 font-bold">Encontrados: {filteredBulkList.length}</div>
                      </div>

                      <div className="max-h-60 overflow-y-auto border rounded bg-white">
                          {filteredBulkList.map((c:any, i:number) => (
                              <div key={i} className="flex gap-2 items-center p-2 border-b hover:bg-slate-50">
                                  <input type="checkbox" checked={selectedBulkClients.includes(c.phone)} onChange={()=>{
                                      setSelectedBulkClients(prev=>prev.includes(c.phone)?prev.filter(p=>p!==c.phone):[...prev, c.phone])
                                  }}/>
                                  <div className="text-xs">
                                      <div className="font-bold">{c.name}</div>
                                      <div className="flex gap-1">
                                          <span className="text-slate-400">{c.phone}</span>
                                          <span className="bg-slate-100 px-1 rounded">{c.stage}</span>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <div className="bg-white p-2 rounded border">
                          <label className="text-xs font-bold block mb-1">Números Manuales</label>
                          <textarea className="w-full border text-xs p-1 rounded font-mono" rows={3} placeholder="999888777, 955444333" value={manualNumbers} onChange={e=>setManualNumbers(e.target.value)}/>
                          <p className="text-[9px] text-slate-400">Prefijo 51 se agrega automático.</p>
                      </div>
                  </div>
              )}

              {activeTab === 'CONFIG' && (
                  <div className="p-4 space-y-4">
                      <div>
                          <h3 className="font-bold text-sm text-slate-700 mb-2">Administrar Etapas</h3>
                          <div className="flex gap-2 mb-2">
                              <input className="flex-1 border p-1 text-sm rounded" placeholder="Nueva etapa..." value={newStageName} onChange={e=>setNewStageName(e.target.value)}/>
                              <button onClick={addStage} className="bg-emerald-600 text-white p-1 rounded"><PlusCircle size={18}/></button>
                          </div>
                          <div className="space-y-1">
                              {stages.map((s, i) => (
                                  <div key={i} className="flex justify-between items-center bg-white p-2 rounded border text-sm">
                                      <span>{s}</span>
                                      <button className="text-red-500"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* CHAT AREA */}
      <div className={`flex-1 flex-col bg-[#efeae2] relative ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {activeTab === 'BULK' ? (
              <div className="flex-1 overflow-y-auto p-4 flex justify-center">
                  <div className="bg-white w-full max-w-lg p-6 rounded shadow h-fit">
                      <h2 className="text-lg font-bold text-blue-600 flex gap-2 mb-4"><Users/> Enviar Difusión</h2>
                      
                      {bulkProgress ? (
                           <div className="text-center py-10">
                               <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={40}/>
                               <div className="text-3xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div>
                           </div>
                      ) : (
                          <>
                            <div className="flex gap-4 mb-4 bg-slate-50 p-2 rounded border">
                                <div className="flex-1"><label className="text-[10px] font-bold">Min (s)</label><input type="number" className="w-full border rounded" value={minDelay} onChange={e=>setMinDelay(Number(e.target.value))}/></div>
                                <div className="flex-1"><label className="text-[10px] font-bold">Max (s)</label><input type="number" className="w-full border rounded" value={maxDelay} onChange={e=>setMaxDelay(Number(e.target.value))}/></div>
                            </div>
                            <textarea className="w-full border p-3 rounded mb-3" rows={4} placeholder="Mensaje..." value={bulkMessage} onChange={e=>setBulkMessage(e.target.value)}/>
                            
                            <div className="flex flex-col gap-2 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-100 p-2 rounded border">
                                    <Paperclip size={16}/> <span className="text-sm font-bold">{bulkFile ? bulkFile.filename : 'Subir Imagen'}</span>
                                    <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*"/>
                                    {bulkFile && <button onClick={(e)=>{e.preventDefault(); setBulkFile(null);}} className="ml-auto text-red-500">X</button>}
                                </label>
                                {bulkFile && (
                                    <label className="flex items-center gap-2 p-2 border rounded bg-blue-50 cursor-pointer">
                                        <input type="checkbox" checked={sendTogether} onChange={()=>setSendTogether(!sendTogether)}/>
                                        <span className="text-xs font-bold text-blue-800">Enviar junto (Caption)</span>
                                    </label>
                                )}
                            </div>
                            <button onClick={sendBulk} className="w-full bg-blue-600 text-white py-3 rounded font-bold shadow hover:bg-blue-700">
                                ENVIAR A {new Set([...selectedBulkClients, ...manualNumbers.split(/[\n,]+/).filter(n=>n.trim().length>6)]).size}
                            </button>
                          </>
                      )}
                  </div>
              </div>
          ) : selectedChatId ? (
              <>
                <div className="p-2 bg-slate-100 border-b flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2">
                        <button onClick={()=>setShowMobileChat(false)} className="md:hidden p-1 bg-white rounded-full"><ArrowLeft size={16}/></button>
                        <span className="font-bold text-slate-800 truncate max-w-[120px]">{chats.find(c=>c.id._serialized===selectedChatId)?.name}</span>
                    </div>
                    {/* SELECTOR RÁPIDO DE ETAPA */}
                    {crmClient && (
                        <select className="text-xs border rounded p-1 bg-white text-emerald-700 font-bold outline-none" 
                                value={crmClient.stage} 
                                onChange={(e) => updateCrm('stage', e.target.value)}>
                            {stages.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {messages.map((m, i) => {
                        if(!m.body && !m.type.includes('image')) return null;
                        return (
                            <div key={i} className={`flex ${m.fromMe?'justify-end':'justify-start'}`}>
                                <div className={`max-w-[70%] p-2 rounded-lg text-sm shadow relative ${m.fromMe?'bg-[#d9fdd3] rounded-tr-none':'bg-white rounded-tl-none'}`}>
                                    {m.body}
                                    <span className="text-[9px] text-slate-400 block text-right mt-1">{new Date(m.timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={msgsEndRef}/>
                </div>

                <div className="p-2 bg-slate-100 flex gap-2">
                    <input className="flex-1 border p-2 rounded-full" value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} placeholder="Escribe..."/>
                    <button onClick={sendMessage} className="bg-emerald-600 text-white p-2 rounded-full"><Send size={18}/></button>
                </div>
              </>
          ) : (
              <div className="flex items-center justify-center h-full text-slate-400">Selecciona un chat</div>
          )}
      </div>

      {/* CRM PANEL (DERECHA) */}
      {selectedChatId && crmClient && activeTab === 'CHAT' && (
          <div className="hidden md:flex w-72 bg-white border-l flex-col shadow-xl z-20">
              <div className="p-4 bg-slate-50 border-b">
                  <h3 className="font-bold text-slate-700 flex gap-2 items-center"><User size={16}/> Ficha Cliente</h3>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-4">
                  {/* ASIGNACIÓN DE VENDEDOR */}
                  <div className="bg-blue-50 p-2 rounded border border-blue-100">
                      <label className="text-[10px] font-bold text-slate-500 uppercase flex justify-between">
                          Atendido por:
                          <button onClick={()=>setIsEditingAgent(!isEditingAgent)} className="text-blue-600"><Edit3 size={12}/></button>
                      </label>
                      {isEditingAgent ? (
                          <div className="flex gap-1 mt-1">
                              <input className="w-full text-xs border p-1 rounded" defaultValue={crmClient.agent} onBlur={(e)=>updateCrm('agent', e.target.value)} autoFocus/>
                          </div>
                      ) : (
                          <div className="font-bold text-blue-800 text-sm flex gap-2 items-center mt-1">
                              <Briefcase size={12}/> {crmClient.agent}
                          </div>
                      )}
                  </div>

                  {/* NOTAS */}
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