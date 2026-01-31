import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Calendar, Settings, PlusCircle, Clock, Volume2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// ⚠️ VERIFICA QUE ESTA URL SEA LA DE TU NGROK ACTUAL
const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';

const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3';

interface Props { clients: any[] }

export default function WhatsAppModule({ clients }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK' | 'CONFIG'>('CHAT');
  
  // Chat Vars
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const msgsEndRef = useRef<HTMLDivElement>(null);

  // CRM Vars
  const [crmData, setCrmData] = useState<any>(null);
  const [stages, setStages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  
  // Difusión Vars (MASIVOS)
  const [bulkFilter, setBulkFilter] = useState("Todas");
  const [selectedBulkClients, setSelectedBulkClients] = useState<string[]>([]);
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkFile, setBulkFile] = useState<any>(null);
  const [bulkProgress, setBulkProgress] = useState<any>(null);
  
  // NUEVO: Configuración de Tiempos
  const [minDelay, setMinDelay] = useState(3); // Mínimo 3 segundos
  const [maxDelay, setMaxDelay] = useState(7); // Máximo 7 segundos

  const audioRef = useRef(new Audio(NOTIFICATION_SOUND));

  // --- CONEXIÓN ---
  useEffect(() => {
    const skt = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });
    setSocket(skt);

    skt.on('connect', () => setStatus('INITIALIZING'));
    skt.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    skt.on('ready', () => { 
        setStatus('READY'); 
        fetchChats(); 
        fetchConfig();
    });
    
    skt.on('message', (msg) => { handleNewMsg(msg); audioRef.current.play().catch(()=>{}); });
    skt.on('message_create', (msg) => { if(msg.fromMe) handleNewMsg(msg); });

    skt.on('bulk_progress', setBulkProgress);
    skt.on('bulk_complete', (res) => {
        setBulkProgress(null);
        alert(`✅ Difusión Finalizada\nEnviados: ${res?.sent || 0}\nErrores: ${res?.errors || 0}`);
    });

    return () => { skt.disconnect(); };
  }, []);

  const handleNewMsg = (msg: any) => {
      setSelectedChatId(prev => {
          const id = msg.fromMe ? msg.to : msg.from;
          if(prev === id) {
              setMessages(m => [...m, msg]);
              setTimeout(scrollToBottom, 100);
          }
          return prev;
      });
      fetchChats();
  };

  // --- API ---
  const api = async (path: string, opts?: any) => {
      return fetch(`${BACKEND_URL}${path}`, {
          ...opts,
          headers: { ...opts?.headers, "ngrok-skip-browser-warning": "true", 'Content-Type': 'application/json' }
      }).then(r => r.json());
  };

  const fetchChats = () => api('/chats').then(setChats);
  const fetchConfig = () => api('/crm/config').then(d => { setStages(d.stages); setCategories(d.categories); });
  
  const loadChat = async (id: string) => {
      setSelectedChatId(id);
      setMessages(await api(`/chats/${id}/messages`));
      setTimeout(scrollToBottom, 100);
      const phone = id.replace(/\D/g, '');
      setCrmData(await api(`/crm/client/${phone}`));
  };

  const sendMessage = async () => {
      if(!msgInput.trim() || !selectedChatId) return;
      await api('/messages', { method:'POST', body: JSON.stringify({ chatId: selectedChatId, content: msgInput }) });
      setMsgInput("");
  };

  const scrollToBottom = () => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // --- LOGICA MASIVOS ---
  const handleFileUpload = (e: any) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => setBulkFile({ data: (reader.result as string).split(',')[1], mimetype: file.type, filename: file.name });
      }
  };

  const sendBulk = () => {
      if(selectedBulkClients.length === 0) return alert("Selecciona clientes");
      if(!bulkMessage && !bulkFile) return alert("Escribe un mensaje o sube archivo");
      
      const confirmMsg = `¿Enviar a ${selectedBulkClients.length} personas?\n\nDelay: ${minDelay}s - ${maxDelay}s entre mensajes.`;
      
      if(confirm(confirmMsg)) {
          socket?.emit('bulk_send', { 
              numbers: selectedBulkClients, 
              message: bulkMessage, 
              media: bulkFile,
              minDelay: parseInt(minDelay.toString()), // Enviar configuración
              maxDelay: parseInt(maxDelay.toString()) 
          });
      }
  };

  // --- RENDER ---
  const filteredClients = useMemo(() => {
      return bulkFilter === "Todas" ? clients : clients.filter(c => c.category === bulkFilter);
  }, [clients, bulkFilter]);

  if(status !== 'READY') return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-100">
          {status==='QR_READY' && qrCode ? <QRCodeSVG value={qrCode} size={250}/> : <Loader2 className="animate-spin" size={50}/>}
          <p className="mt-4 font-bold text-slate-600">Conectando...</p>
      </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* SIDEBAR */}
      <div className="w-80 border-r flex flex-col bg-slate-50">
          <div className="p-3 bg-emerald-600 text-white flex justify-between items-center shadow-md">
              <span className="font-bold flex gap-2"><MessageCircle/> SapiSoft</span>
          </div>
          <div className="flex text-xs font-bold border-b bg-white">
              <button onClick={()=>setActiveTab('CHAT')} className={`flex-1 p-3 ${activeTab==='CHAT'?'text-emerald-600 border-b-2 border-emerald-600':''}`}>CHATS</button>
              <button onClick={()=>setActiveTab('BULK')} className={`flex-1 p-3 ${activeTab==='BULK'?'text-blue-600 border-b-2 border-blue-600':''}`}>DIFUSIÓN</button>
              <button onClick={()=>setActiveTab('CONFIG')} className={`flex-1 p-3 ${activeTab==='CONFIG'?'text-slate-600 border-b-2 border-slate-600':''}`}><Settings size={14} className="mx-auto"/></button>
          </div>

          {activeTab === 'CHAT' && (
              <div className="flex-1 overflow-y-auto">
                  {chats.map(c => (
                      <div key={c.id._serialized} onClick={() => loadChat(c.id._serialized)} className={`p-3 border-b cursor-pointer hover:bg-slate-100 ${selectedChatId===c.id._serialized?'bg-emerald-50':''}`}>
                          <div className="font-bold text-slate-800 truncate">{c.name || c.id.user}</div>
                          <div className="text-xs text-slate-500 truncate">{c.lastMessage?.body || 'Multimedia'}</div>
                      </div>
                  ))}
              </div>
          )}

          {activeTab === 'BULK' && (
              <div className="flex-1 overflow-y-auto p-2">
                  <select className="w-full border p-1 rounded text-sm mb-2" value={bulkFilter} onChange={e=>setBulkFilter(e.target.value)}>
                      <option value="Todas">Todas las Categorías</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <div className="text-xs font-bold mb-1 text-blue-600">Seleccionados: {selectedBulkClients.length}</div>
                  {filteredClients.map((c: any, i: number) => (
                      <div key={i} className="flex gap-2 items-center p-2 border-b">
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
          )}
          
          {activeTab === 'CONFIG' && (
            <div className="p-4">
                <p className="text-sm">Configura tus etapas de venta y categorías aquí.</p>
                {/* Aquí podrías poner los inputs para editar etapas */}
            </div>
          )}
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col bg-[#efeae2]">
          {activeTab === 'BULK' ? (
              <div className="flex flex-col items-center justify-center h-full p-4 overflow-y-auto">
                  <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
                      <h2 className="text-xl font-bold mb-4 text-blue-600 flex gap-2"><Users/> Configurar Envío</h2>
                      
                      {bulkProgress ? (
                          <div className="text-center py-6">
                              <Loader2 className="animate-spin mx-auto text-blue-500 mb-2" size={40}/>
                              <div className="text-2xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div>
                              <p className="text-sm text-slate-500">Enviando a: {bulkProgress.lastPhone}</p>
                              <div className="w-full bg-slate-200 h-2 rounded mt-2"><div className="bg-blue-500 h-2 transition-all" style={{width:`${(bulkProgress.current/bulkProgress.total)*100}%`}}></div></div>
                          </div>
                      ) : (
                          <>
                              {/* CONFIGURACIÓN DE TIEMPO */}
                              <div className="flex gap-4 mb-4 bg-slate-50 p-3 rounded border">
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> Min Delay (s)</label>
                                      <input type="number" className="w-full border rounded p-1" value={minDelay} onChange={e=>setMinDelay(Number(e.target.value))}/>
                                  </div>
                                  <div className="flex-1">
                                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Clock size={12}/> Max Delay (s)</label>
                                      <input type="number" className="w-full border rounded p-1" value={maxDelay} onChange={e=>setMaxDelay(Number(e.target.value))}/>
                                  </div>
                              </div>

                              <textarea className="w-full border p-3 rounded mb-4" rows={4} placeholder="Mensaje..." value={bulkMessage} onChange={e=>setBulkMessage(e.target.value)}/>
                              
                              <div className="mb-4">
                                  <label className="block text-xs font-bold mb-1">Adjuntar Archivo</label>
                                  <div className="flex gap-2 items-center">
                                      <label className="cursor-pointer bg-slate-200 px-3 py-1 rounded text-sm flex gap-1 items-center hover:bg-slate-300">
                                          <Paperclip size={14}/> {bulkFile ? 'Archivo Listo' : 'Subir'}
                                          <input type="file" className="hidden" onChange={handleFileUpload}/>
                                      </label>
                                      {bulkFile && <button onClick={()=>setBulkFile(null)} className="text-red-500 text-xs font-bold">Quitar</button>}
                                  </div>
                              </div>

                              <button onClick={sendBulk} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 shadow-md transition-all">
                                  ENVIAR A {selectedBulkClients.length} CONTACTOS
                              </button>
                              <p className="text-[10px] text-center mt-2 text-slate-400">Recomendado: 5 a 10 segundos para evitar bloqueos.</p>
                          </>
                      )}
                  </div>
              </div>
          ) : (
              selectedChatId ? (
                  <>
                    <div className="p-3 bg-slate-100 border-b font-bold flex justify-between">
                        <span>{chats.find(c=>c.id._serialized===selectedChatId)?.name}</span>
                        {/* Selector de Etapa CRM en el header */}
                        {crmData && (
                            <select className="text-xs border rounded p-1 bg-white text-emerald-700" 
                                    value={crmData.stage} 
                                    onChange={async (e) => {
                                        const stage = e.target.value;
                                        const phone = selectedChatId.replace(/\D/g, '');
                                        setCrmData({...crmData, stage});
                                        await api('/crm/client', { method:'POST', body:JSON.stringify({phone, stage}) });
                                    }}>
                                {stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.fromMe?'justify-end':'justify-start'}`}>
                                <div className={`max-w-[70%] p-2 rounded-lg text-sm shadow relative pb-4 ${m.fromMe?'bg-[#d9fdd3]':'bg-white'}`}>
                                    {m.body}
                                    <span className="text-[9px] text-slate-400 absolute bottom-1 right-2">{new Date(m.timestamp*1000).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                                </div>
                            </div>
                        ))}
                        <div ref={msgsEndRef}/>
                    </div>
                    <div className="p-3 bg-slate-100 flex gap-2">
                        <input className="flex-1 border p-2 rounded-full" value={msgInput} onChange={e=>setMsgInput(e.target.value)} onKeyPress={e=>e.key==='Enter'&&sendMessage()} placeholder="Escribe..."/>
                        <button onClick={sendMessage} className="bg-emerald-600 text-white p-2 rounded-full"><Send size={20}/></button>
                    </div>
                  </>
              ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Selecciona un chat</div>
              )
          )}
      </div>
      
      {/* CRM PANEL (Derecha) */}
      {selectedChatId && crmData && (
          <div className="w-72 bg-white border-l p-4 flex flex-col z-10 shadow-lg">
              <h3 className="font-bold mb-4 flex gap-2"><User/> CRM</h3>
              <div className="mb-4">
                  <label className="text-xs font-bold block mb-1">Categoría</label>
                  <div className="flex flex-wrap gap-1">
                      {categories.map(cat => (
                          <button key={cat} onClick={async ()=>{
                              const phone = selectedChatId.replace(/\D/g, '');
                              setCrmData({...crmData, category: cat});
                              await api('/crm/client', { method:'POST', body:JSON.stringify({phone, category: cat}) });
                          }} className={`text-xs px-2 py-1 rounded border ${crmData.category===cat?'bg-blue-500 text-white':''}`}>{cat}</button>
                      ))}
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto border-t pt-2 space-y-2">
                  <label className="text-xs font-bold">Notas</label>
                  {crmData.notes.map((n:any) => (
                      <div key={n.id} className="bg-yellow-50 p-2 rounded border border-yellow-200 text-xs">
                          <p>{n.text}</p>
                          <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                              <span>{new Date(n.date).toLocaleDateString()}</span>
                              {n.reminder && <span className="text-red-500 font-bold flex items-center gap-1"><Calendar size={8}/> {n.reminder}</span>}
                          </div>
                      </div>
                  ))}
              </div>
              <div className="mt-2 pt-2 border-t">
                  <textarea className="w-full border text-xs p-2 rounded mb-2" rows={2} placeholder="Nueva nota..." value={newNote} onChange={e=>setNewNote(e.target.value)}/>
                  <button onClick={async ()=>{
                      const phone = selectedChatId.replace(/\D/g, '');
                      const res = await api('/crm/client', { method:'POST', body:JSON.stringify({phone, note: newNote}) });
                      setCrmData({...crmData, notes: res.data.notes});
                      setNewNote("");
                  }} className="w-full bg-slate-800 text-white text-xs py-2 rounded flex gap-2 justify-center"><FileText size={12}/> Guardar</button>
              </div>
          </div>
      )}
    </div>
  );
}