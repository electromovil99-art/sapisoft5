import React, { useState, useEffect, useRef } from 'react';
import { Send, Phone, User, MessageCircle, RefreshCw, Loader2, QrCode, LogOut } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';

interface Contact {
  id: string;
  name: string;
  number: string;
  pushname?: string;
  isMyContact: boolean;
}

interface Message {
  id: { id: string, fromMe: boolean };
  body: string;
  timestamp: number;
  from: string;
  to: string;
  type: string;
  fromMe: boolean;
}

interface Chat {
  id: { _serialized: string };
  name: string;
  isGroup: boolean;
  timestamp: number;
  unreadCount: number;
  lastMessage?: Message;
}

interface Props {
  products: any[];
  clients: any[];
  chats: any[]; 
  setChats: (chats: any[]) => void;
}

// TU URL DE NGROK (Ya configurada correctamente)
const BACKEND_URL = 'https://irrespectively-excursional-alisson.ngrok-free.dev';

export default function WhatsAppModule({ clients }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<'DISCONNECTED' | 'INITIALIZING' | 'QR_READY' | 'AUTHENTICATED' | 'READY'>('DISCONNECTED');
  const [qrCode, setQrCode] = useState<string>('');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. CONEXIÓN SOCKET (MODIFICADO: Agregamos extraHeaders)
  useEffect(() => {
    const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        extraHeaders: {
            "ngrok-skip-browser-warning": "true" // <--- LA LLAVE MAESTRA
        }
    });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('connect', () => {
      console.log('Connected to WhatsApp backend');
      setStatus('INITIALIZING');
    });

    socket.on('qr', (qr: string) => {
      setStatus('QR_READY');
      setQrCode(qr);
    });

    socket.on('ready', () => {
      setStatus('READY');
      setQrCode('');
      fetchChats();
    });

    socket.on('authenticated', () => {
      setStatus('AUTHENTICATED');
    });

    socket.on('auth_failure', () => {
      setStatus('DISCONNECTED');
      setQrCode('');
    });

    socket.on('message', (message: Message) => {
      handleIncomingMessage(message);
    });
    
    socket.on('message_create', (message: Message) => {
       if(message.fromMe) handleIncomingMessage(message);
    });

    socket.on('disconnect', () => {
      setStatus('DISCONNECTED');
    });

    return () => {
      socket.off('connect');
      socket.off('qr');
      socket.off('ready');
      socket.off('authenticated');
      socket.off('auth_failure');
      socket.off('message');
      socket.off('message_create');
      socket.off('disconnect');
    };
  }, [socket]);

  // 2. FETCH CHATS (MODIFICADO: Agregamos headers)
  const fetchChats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/chats`, {
          headers: { "ngrok-skip-browser-warning": "true" } // <--- LLAVE MAESTRA
      });
      const data = await res.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  };

  const handleIncomingMessage = (message: Message) => {
    const chatId = message.fromMe ? message.to : message.from;

    if (selectedChatId === chatId) {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    }

    setChats((prevChats) => {
      const chatIndex = prevChats.findIndex(c => c.id._serialized === chatId);
      if (chatIndex > -1) {
        const updatedChat = { 
            ...prevChats[chatIndex], 
            lastMessage: message, 
            timestamp: message.timestamp,
            unreadCount: (selectedChatId === chatId || message.fromMe) ? 0 : prevChats[chatIndex].unreadCount + 1
        };
        const newChats = [...prevChats];
        newChats.splice(chatIndex, 1);
        return [updatedChat, ...newChats];
      }
      return prevChats;
    });
  };

  // 3. FETCH MESSAGES (MODIFICADO: Agregamos headers)
  useEffect(() => {
    if (!selectedChatId) return;
    setLoadingMessages(true);
    fetch(`${BACKEND_URL}/chats/${selectedChatId}/messages`, {
        headers: { "ngrok-skip-browser-warning": "true" } // <--- LLAVE MAESTRA
    })
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoadingMessages(false);
        scrollToBottom();
      })
      .catch(err => {
        console.error("Error fetching messages:", err);
        setLoadingMessages(false);
      });
  }, [selectedChatId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // 4. SEND MESSAGE (MODIFICADO: Agregamos headers)
  const sendMessage = async () => {
    if (!selectedChatId || !messageInput.trim()) return;

    try {
      const response = await fetch(`${BACKEND_URL}/messages`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            "ngrok-skip-browser-warning": "true" // <--- LLAVE MAESTRA
        },
        body: JSON.stringify({
          chatId: selectedChatId,
          content: messageInput
        })
      });
      
      if (response.ok) {
        setMessageInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error al enviar mensaje");
    }
  };

  // 5. LOGOUT (MODIFICADO: Agregamos headers)
  const handleLogout = async () => {
      try {
          await fetch(`${BACKEND_URL}/logout`, { 
              method: 'POST',
              headers: { "ngrok-skip-browser-warning": "true" } // <--- LLAVE MAESTRA
          });
          setStatus('DISCONNECTED');
          setQrCode('');
          setChats([]);
          setSelectedChatId(null);
      } catch (error) {
          console.error("Logout failed", error);
      }
  };

  const getChatName = (chat: Chat) => {
      if (!chat) return "Desconocido";
      const number = chat.id._serialized.replace('@c.us', '');
      const localClient = clients.find(c => c.phone?.includes(number) || c.dni === number);
      return localClient ? localClient.name : (chat.name || number);
  };

  return (
    <div className="flex h-full bg-slate-100 dark:bg-slate-950 p-4 gap-4 animate-in fade-in duration-500">
      
      {/* IZQUIERDA: LISTA DE CONTACTOS */}
      <div className="w-1/3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-xs flex items-center justify-between">
          <div className="flex items-center gap-2"><MessageCircle size={16}/> WhatsApp SapiSoft</div>
          <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${status === 'READY' ? 'bg-green-300' : 'bg-red-400'}`}></div>
              {status === 'READY' && <button onClick={handleLogout} title="Cerrar Sesión"><LogOut size={14}/></button>}
          </div>
        </div>
        
        {status !== 'READY' && status !== 'AUTHENTICATED' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                {status === 'QR_READY' && qrCode ? (
                    <>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Escanea el código QR con WhatsApp</p>
                        <div className="bg-white p-4 rounded-xl shadow-lg">
                            <QRCodeSVG value={qrCode} size={200} />
                        </div>
                    </>
                ) : (
                    <>
                        <Loader2 className="animate-spin text-emerald-600" size={32} />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conectando con el servidor...</p>
                        <p className="text-[10px] text-slate-400">Asegúrate que el backend (puerto 3000) y Ngrok estén corriendo.</p>
                    </>
                )}
            </div>
        ) : (
            <div className="overflow-y-auto flex-1 custom-scrollbar">
                {chats.map(chat => (
                    <div 
                        key={chat.id._serialized}
                        onClick={() => setSelectedChatId(chat.id._serialized)}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${selectedChatId === chat.id._serialized ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <div className="font-bold text-slate-800 dark:text-white text-sm uppercase truncate max-w-[180px]">
                                {getChatName(chat)}
                            </div>
                            {chat.timestamp && (
                                <span className="text-[10px] text-slate-400">
                                    {new Date(chat.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                                {chat.lastMessage?.fromMe && <span className="text-slate-400 italic">Tú: </span>}
                                {chat.lastMessage?.body || <span className="italic text-slate-300">Imagen/Audio</span>}
                            </div>
                            {chat.unreadCount > 0 && (
                                <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {chat.unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* DERECHA: VENTANA DE CHAT */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {selectedChatId && status === 'READY' ? (
          <>
            {/* CABECERA */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
               <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                       <User size={16} className="text-slate-500"/>
                   </div>
                   <div>
                       <span className="font-bold text-slate-800 dark:text-white text-sm block">
                           {getChatName(chats.find(c => c.id._serialized === selectedChatId)!)}
                       </span>
                       <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">En línea</span>
                   </div>
               </div>
               <button onClick={() => setSelectedChatId(null)} className="text-slate-400 hover:text-red-500 transition-colors"><XCircleIcon size={20}/></button>
            </div>

            {/* MENSAJES */}
            <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] dark:bg-slate-950/50 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
               {loadingMessages ? (
                   <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
               ) : (
                   messages.map((msg, idx) => (
                     <div key={msg.id.id} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[70%] p-3 rounded-xl shadow-sm text-sm relative ${msg.fromMe ? 'bg-[#d9fdd3] dark:bg-emerald-700 text-slate-800 dark:text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-none'}`}>
                         <p className="mb-3 leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                         <span className={`text-[9px] absolute bottom-1 right-2 ${msg.fromMe ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-400'}`}>
                           {new Date(msg.timestamp * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         </span>
                       </div>
                     </div>
                   ))
               )}
               <div ref={messagesEndRef} />
            </div>

            {/* INPUT PARA ESCRIBIR */}
            <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
               <input 
                 type="text" 
                 className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-sm outline-none focus:border-emerald-500 transition-colors"
                 placeholder="Escribe un mensaje..."
                 value={messageInput}
                 onChange={(e) => setMessageInput(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
               />
               <button 
                 onClick={sendMessage}
                 disabled={!messageInput.trim()}
                 className="bg-emerald-600 text-white px-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
               >
                 <Send size={20}/>
               </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-10 text-center">
            <MessageCircle size={64} strokeWidth={1} className="mb-4 opacity-50"/>
            <p className="font-bold uppercase text-xs tracking-widest">Selecciona un chat para comenzar</p>
            <p className="text-[10px] mt-2 max-w-xs text-slate-400">Conectado a SapiSoft WhatsApp Server (Ngrok)</p>
          </div>
        )}
      </div>
    </div>
  );
}

function XCircleIcon({size}: {size:number}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
}