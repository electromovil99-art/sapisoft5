import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, User, Loader2, Users, FileText, Paperclip, Calendar, CheckSquare, Save } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

// === TIPOS DE DATOS ===
interface Client {
  id: string;
  name: string;
  phone: string; // Esperamos formato limpio '51999...'
  category?: string;
}

interface Note {
    id: number;
    text: string;
    date: string;
    reminder: string | null;
}

interface Chat {
  id: { _serialized: string };
  name: string;
  unreadCount: number;
  lastMessage?: { body: string, fromMe: boolean, timestamp: number };
}

interface Props {
  clients: Client[]; // Viene de SapiSoft (Tus clientes registrados)
}

// ⚠️ TU URL DE NGROK AQUÍ
const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';

export default function WhatsAppModule({ clients }: Props) {
  // Estados de Conexión
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState('DISCONNECTED');
  const [qrCode, setQrCode] = useState('');
  
  // Estados de Chat
  const [activeTab, setActiveTab] = useState<'CHAT' | 'BULK'>('CHAT');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Estados CRM
  const [crmNotes, setCrmNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [reminderDate, setReminderDate] = useState("");

  // Estados Difusión (Masivos)
  const [bulkMessage, setBulkMessage] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]); // Array de teléfonos
  const [bulkFile, setBulkFile] = useState<{data: string, mimetype: string, filename: string} | null>(null);
  const [bulkProgress, setBulkProgress] = useState<{current: number, total: number} | null>(null);

  // --- 1. CONEXIÓN INTELIGENTE ---
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        extraHeaders: { "ngrok-skip-browser-warning": "true" }
    });
    setSocket(newSocket);

    // Eventos
    newSocket.on('connect', () => setStatus('INITIALIZING'));
    newSocket.on('qr', (qr) => { setStatus('QR_READY'); setQrCode(qr); });
    newSocket.on('ready', () => { 
        setStatus('READY'); 
        fetchChats(); 
    });
    newSocket.on('authenticated', () => setStatus('AUTHENTICATED'));
    
    // Escuchar progreso de masivos
    newSocket.on('bulk_progress', (data) => setBulkProgress(data));
    newSocket.on('bulk_complete', () => {
        setBulkProgress(null);
        alert("✅ ¡Difusión completada con éxito!");
        setBulkMessage("");
        setBulkFile(null);
    });

    // Escuchar mensajes nuevos
    newSocket.on('message', handleIncomingMsg);
    newSocket.on('message_create', (msg) => { if(msg.fromMe) handleIncomingMsg(msg); });

    return () => { newSocket.disconnect(); };
  }, []);

  const handleIncomingMsg = (msg: any) => {
      // Lógica simple para actualizar chat en vivo (puedes mejorarla)
      if (selectedChatId === (msg.fromMe ? msg.to : msg.from)) {
          setMessages(prev => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      }
  };

  // --- 2. API CALLS ---
  const fetchChats = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/chats`, { headers: { "ngrok-skip-browser-warning": "true" }});
        const data = await res.json();
        setChats(data);
      } catch(e) { console.error(e); }
  };

  const loadChat = async (chatId: string) => {
      setSelectedChatId(chatId);
      // Cargar mensajes
      const res = await fetch(`${BACKEND_URL}/chats/${chatId}/messages`, { headers: { "ngrok-skip-browser-warning": "true" }});
      setMessages(await res.json());
      setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
      
      // Cargar CRM
      const phone = chatId.replace('@c.us', '');
      const resCrm = await fetch(`${BACKEND_URL}/crm/${phone}`, { headers: { "ngrok-skip-browser-warning": "true" }});
      const dataCrm = await resCrm.json();
      setCrmNotes(dataCrm.notes || []);
  };

  const sendMessage = async () => {
      if(!msgInput.trim() || !selectedChatId) return;
      await fetch(`${BACKEND_URL}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ chatId: selectedChatId, content: msgInput })
      });
      setMsgInput("");
  };

  // --- 3. FUNCIONES CRM ---
  const saveNote = async () => {
      if(!newNote.trim() || !selectedChatId) return;
      const phone = selectedChatId.replace('@c.us', '');
      
      const res = await fetch(`${BACKEND_URL}/crm/note`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', "ngrok-skip-browser-warning": "true" },
          body: JSON.stringify({ phone, note: newNote, reminderDate })
      });
      const data = await res.json();
      setCrmNotes(data.data.notes);
      setNewNote("");
      setReminderDate("");
  };

  // --- 4. FUNCIONES DIFUSIÓN ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if(file) {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onloadend = () => {
              setBulkFile({
                  data: (reader.result as string).split(',')[1], // Base64 puro
                  mimetype: file.type,
                  filename: file.name
              });
          };
      }
  };

  const sendBulk = () => {
      if(selectedClients.length === 0) return alert("Selecciona al menos un cliente");
      if(!bulkMessage && !bulkFile) return alert("Escribe un mensaje o sube un archivo");
      
      if(confirm(`¿Enviar mensaje a ${selectedClients.length} personas?`)) {
          socket?.emit('bulk_send', {
              numbers: selectedClients,
              message: bulkMessage,
              media: bulkFile
          });
      }
  };

  const toggleClient = (phone: string) => {
      if(selectedClients.includes(phone)) {
          setSelectedClients(prev => prev.filter(p => p !== phone));
      } else {
          setSelectedClients(prev => [...prev, phone]);
      }
  };

  // --- RENDERIZADO ---
  if(status !== 'READY' && status !== 'AUTHENTICATED') {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-100 text-slate-500">
            {status === 'QR_READY' && qrCode ? (
                <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                    <QRCodeSVG value={qrCode} size={220} />
                    <p className="mt-4 font-bold text-slate-700">Escanea para activar el CRM</p>
                </div>
            ) : (
                <div className="text-center">
                    <Loader2 className="animate-spin mb-2 mx-auto" size={40}/>
                    <p>Conectando con SapiSoft Server...</p>
                </div>
            )}
        </div>
      );
  }

  return (
    <div className="flex h-full bg-slate-50 gap-2 p-2">
      
      {/* 1. BARRA LATERAL (Chats) */}
      <div className="w-1/4 bg-white rounded-lg shadow-sm flex flex-col border">
          <div className="p-3 border-b flex gap-2 bg-slate-100">
              <button 
                onClick={() => setActiveTab('CHAT')}
                className={`flex-1 py-2 text-xs font-bold rounded ${activeTab === 'CHAT' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}
              >
                  CHATS
              </button>
              <button 
                onClick={() => setActiveTab('BULK')}
                className={`flex-1 py-2 text-xs font-bold rounded ${activeTab === 'BULK' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600'}`}
              >
                  DIFUSIÓN 📢
              </button>
          </div>

          <div className="flex-1 overflow-y-auto">
              {activeTab === 'CHAT' ? (
                  chats.map(chat => (
                      <div key={chat.id._serialized} onClick={() => loadChat(chat.id._serialized)} className="p-3 border-b hover:bg-slate-50 cursor-pointer">
                          <div className="font-bold text-sm text-slate-800 truncate">{chat.name}</div>
                          <div className="text-xs text-slate-400 truncate">{chat.lastMessage?.body || 'Multimedia'}</div>
                      </div>
                  ))
              ) : (
                  // LISTA PARA SELECCIÓN MASIVA
                  <div className="p-2">
                      <div className="p-2 bg-blue-50 text-blue-800 text-xs rounded mb-2 font-bold">
                          Seleccionados: {selectedClients.length}
                      </div>
                      {clients.map((client, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 hover:bg-slate-50 border-b">
                              <input 
                                type="checkbox" 
                                checked={selectedClients.includes(client.phone)}
                                onChange={() => toggleClient(client.phone)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <div>
                                  <div className="text-sm font-bold">{client.name}</div>
                                  <div className="text-xs text-slate-400">{client.phone} | {client.category || 'General'}</div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>

      {/* 2. ÁREA CENTRAL (Chat o Compositor Masivo) */}
      <div className="flex-1 bg-white rounded-lg shadow-sm border flex flex-col bg-[#e5ddd5] relative">
          {activeTab === 'CHAT' ? (
              selectedChatId ? (
                  <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[70%] p-2 rounded-lg text-sm ${m.fromMe ? 'bg-[#d9fdd3]' : 'bg-white'}`}>
                                    {m.body}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-2 bg-slate-100 flex gap-2">
                        <input 
                            className="flex-1 p-2 rounded border" 
                            value={msgInput} 
                            onChange={e => setMsgInput(e.target.value)} 
                            onKeyPress={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Escribe un mensaje..."
                        />
                        <button onClick={sendMessage} className="bg-emerald-500 text-white p-2 rounded"><Send size={18}/></button>
                    </div>
                  </>
              ) : (
                  <div className="flex items-center justify-center h-full text-slate-400">Selecciona un chat</div>
              )
          ) : (
              // VISTA DE DIFUSIÓN (MASIVOS)
              <div className="p-8 flex flex-col items-center justify-center h-full bg-slate-50">
                  <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-lg">
                      <h2 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2"><Users/> Nueva Campaña</h2>
                      
                      {bulkProgress ? (
                          <div className="text-center py-8">
                              <Loader2 className="animate-spin mx-auto text-blue-600 mb-4" size={48}/>
                              <div className="text-2xl font-bold">{bulkProgress.current} / {bulkProgress.total}</div>
                              <p className="text-slate-500 text-sm">Enviando a: {bulkProgress.lastPhone}</p>
                              <div className="w-full bg-slate-200 h-2 rounded-full mt-4 overflow-hidden">
                                  <div className="bg-blue-600 h-full transition-all" style={{width: `${(bulkProgress.current / bulkProgress.total) * 100}%`}}></div>
                              </div>
                          </div>
                      ) : (
                          <>
                            <textarea 
                                className="w-full p-3 border rounded-lg mb-4 bg-slate-50 min-h-[100px]"
                                placeholder="Escribe tu mensaje de oferta aquí..."
                                value={bulkMessage}
                                onChange={e => setBulkMessage(e.target.value)}
                            />
                            
                            <div className="mb-4">
                                <label className="block text-xs font-bold text-slate-500 mb-1">ADJUNTAR FOTO/VIDEO (Opcional)</label>
                                <div className="flex gap-2 items-center">
                                    <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 px-4 py-2 rounded text-sm flex items-center gap-2">
                                        <Paperclip size={16}/> {bulkFile ? 'Archivo cargado' : 'Subir'}
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,video/*"/>
                                    </label>
                                    {bulkFile && <span className="text-xs text-blue-600 truncate max-w-[150px]">{bulkFile.filename}</span>}
                                    {bulkFile && <button onClick={() => setBulkFile(null)} className="text-red-500 text-xs">X</button>}
                                </div>
                            </div>

                            <button 
                                onClick={sendBulk}
                                disabled={selectedClients.length === 0}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                <Send size={18}/> ENVIAR A {selectedClients.length} CLIENTES
                            </button>
                            <p className="text-[10px] text-slate-400 mt-2 text-center">El sistema enviará con pausas aleatorias para seguridad.</p>
                          </>
                      )}
                  </div>
              </div>
          )}
      </div>

      {/* 3. PANEL DERECHO (CRM y NOTAS) */}
      {activeTab === 'CHAT' && selectedChatId && (
          <div className="w-1/4 bg-white border-l p-4 flex flex-col shadow-sm">
              <div className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-orange-500"/> Notas CRM
              </div>
              
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                  {crmNotes.length === 0 && <p className="text-sm text-slate-400 italic">No hay notas para este cliente.</p>}
                  {crmNotes.map(note => (
                      <div key={note.id} className="bg-yellow-50 p-3 rounded border border-yellow-200 text-sm relative group">
                          <p className="text-slate-800">{note.text}</p>
                          <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500">
                              <span>{new Date(note.date).toLocaleDateString()}</span>
                              {note.reminder && (
                                  <span className="bg-red-100 text-red-600 px-1 rounded flex items-center gap-1">
                                      <Calendar size={8}/> {note.reminder}
                                  </span>
                              )}
                          </div>
                      </div>
                  ))}
              </div>

              <div className="pt-4 border-t">
                  <textarea 
                    className="w-full border rounded p-2 text-sm mb-2" 
                    placeholder="Nueva nota..."
                    rows={2}
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <div className="flex gap-2 mb-2">
                      <input 
                        type="date" 
                        className="border rounded p-1 text-xs flex-1"
                        value={reminderDate}
                        onChange={e => setReminderDate(e.target.value)}
                      />
                  </div>
                  <button onClick={saveNote} className="w-full bg-orange-500 text-white py-2 rounded text-sm font-bold flex justify-center gap-2 hover:bg-orange-600">
                      <Save size={16}/> Guardar Nota
                  </button>
              </div>
          </div>
      )}
    </div>
  );
}