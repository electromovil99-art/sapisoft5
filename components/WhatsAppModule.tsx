
import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Paperclip, Smile, Mic, Send, CheckCheck, X, Play, Square, Users, Zap, Loader2, QrCode, User, Image as ImageIcon, Globe, Lock, ArrowLeft, ArrowRight, RotateCcw, ShieldCheck, Download, CheckCircle, Video, Smartphone, RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Product, Client, Chat, Message } from '../types';
import { QRCodeSVG } from 'qrcode.react'; // Real QR Renderer
import { io, Socket } from 'socket.io-client'; // Real Socket Client

interface WhatsAppModuleProps {
    products: Product[];
    clients: Client[];
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    initialContact?: { name: string, phone: string, message?: string };
}

interface CampaignMedia {
    url: string;
    type: 'image' | 'video';
    name: string;
}

type ConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'WAITING_QR' | 'SCANNED' | 'AUTHENTICATING' | 'READY' | 'INITIALIZING';

const WhatsAppModule: React.FC<WhatsAppModuleProps> = ({ products, clients, chats, setChats, initialContact }) => {
    // --- ESTADOS DE CONEXIÓN REAL ---
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('DISCONNECTED');
    const [qrValue, setQrValue] = useState<string>('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [serverError, setServerError] = useState(false);
    
    // --- APP STATES ---
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [inputText, setInputText] = useState('');
    
    // --- EXTENSION STATE (Mass Sender) ---
    const [isExtensionOpen, setIsExtensionOpen] = useState(false); 
    const [bulkMessage, setBulkMessage] = useState('Hola {NOMBRE}, le enviamos información de su interés. ¡Gracias por su preferencia!');
    const [campaignMedia, setCampaignMedia] = useState<CampaignMedia | null>(null);
    const [msgInterval, setMsgInterval] = useState(5);
    const [isSending, setIsSending] = useState(false);
    const [sendingProgress, setSendingProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [antiBanMode, setAntiBanMode] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // -------------------------------------------------------------------------
    // 🔌 CONEXIÓN REAL AL BACKEND (whatsapp-server.js)
    // -------------------------------------------------------------------------
    
    useEffect(() => {
        // Conectar al puerto 3001 donde corre el script de Node.js
        const newSocket = io('http://localhost:3001', {
            transports: ['websocket'],
            reconnectionAttempts: 5
        });

        setSocket(newSocket);
        setConnectionStatus('CONNECTING');

        newSocket.on('connect', () => {
            console.log("Conectado al motor WhatsApp");
            setServerError(false);
            // El estado inicial vendrá del servidor via 'status' o 'qr'
        });

        newSocket.on('connect_error', () => {
            console.log("Error de conexión con el motor");
            setServerError(true);
            setConnectionStatus('DISCONNECTED');
        });

        // Recibir el QR Real del servidor
        newSocket.on('qr', (qrData) => {
            console.log("QR Recibido");
            setQrValue(qrData);
            setConnectionStatus('WAITING_QR');
        });

        // Recibir estado
        newSocket.on('status', (status) => {
            console.log("Estado:", status);
            if (status === 'AUTHENTICATING') setConnectionStatus('AUTHENTICATING');
            if (status === 'READY') {
                setConnectionStatus('READY');
                setQrValue('');
            }
            if (status === 'INITIALIZING') setConnectionStatus('INITIALIZING');
        });

        // Listo para usar
        newSocket.on('ready', () => {
            setConnectionStatus('READY');
            setQrValue('');
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    // -------------------------------------------------------------------------
    // 💬 LÓGICA DE CHAT
    // -------------------------------------------------------------------------

    // Manejo de contacto inicial (desde otros módulos)
    useEffect(() => {
        if (initialContact) {
            // Si viene de otro módulo y el socket está listo, preparamos el chat
            const exist = chats.find(c => c.name === initialContact.name);
            
            if (exist) {
                setActiveChatId(exist.id);
            } else {
                const newChat: Chat = {
                    id: Math.random().toString(),
                    name: initialContact.name,
                    phone: initialContact.phone,
                    avatar: initialContact.name.substring(0,2).toUpperCase(),
                    lastMessage: '',
                    lastMessageTime: 'Ahora',
                    unread: 0,
                    messages: []
                };
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChat.id);
            }

            if (initialContact.message) {
                setInputText(initialContact.message);
            }
        }
    }, [initialContact]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chats, activeChatId, isSending, chatLoading]); 

    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [logs]);

    const handleSendMessage = () => {
        if (!inputText.trim() && !campaignMedia) return;
        if (!activeChatId) return;

        const currentChat = chats.find(c => c.id === activeChatId);
        if (!currentChat) return;

        // 1. Enviar comando real al servidor si está conectado
        if (socket && connectionStatus === 'READY') {
            const cleanPhone = currentChat.phone.replace(/\D/g,'');
            // Asegurar formato internacional simple (ej: 519...)
            const finalPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;

            socket.emit('send_message', {
                number: finalPhone, 
                message: inputText
            });
        } else {
            console.warn("Socket no listo, mensaje solo en UI");
        }

        // 2. Actualizar UI Optimista
        const newMsg: Message = {
            id: Math.random().toString(),
            text: inputText,
            sender: 'me',
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            status: 'sent'
        };

        setChats(prev => prev.map(c => c.id === activeChatId ? { 
            ...c, 
            messages: [...c.messages, newMsg],
            lastMessage: inputText || 'Multimedia',
            lastMessageTime: 'Ahora'
        } : c));

        setInputText('');
    };

    // --- LOGICA DE ENVÍO MASIVO REAL ---
    useEffect(() => {
        let timer: any;

        if (isSending && sendingProgress < clients.length) {
            const client = clients[sendingProgress];
            const personalizedMsg = bulkMessage.replace('{NOMBRE}', client.name.split(' ')[0]).replace('{DNI}', client.dni);
            const randomDelay = antiBanMode ? Math.random() * 3000 : 0; 
            const totalInterval = (msgInterval * 1000) + randomDelay;

            setLogs(prev => [...prev, `⏳ Preparando envío a ${client.name}...`]);
            
            timer = setTimeout(() => {
                // Lógica de Envío Real
                if (socket && connectionStatus === 'READY' && client.phone) {
                    const cleanPhone = client.phone.replace(/\D/g, '');
                    const finalPhone = cleanPhone.length === 9 ? `51${cleanPhone}` : cleanPhone;
                    
                    socket.emit('send_message', {
                        number: finalPhone,
                        message: personalizedMsg
                    });
                    setLogs(prev => [...prev, `🚀 Enviado comando al servidor -> ${finalPhone}`]);
                } else {
                    setLogs(prev => [...prev, `⚠️ Error: Servidor no conectado o cliente sin teléfono`]);
                }

                // Actualizar UI
                setSendingProgress(prev => prev + 1);
                
            }, totalInterval); 
        } else if (isSending && sendingProgress >= clients.length) {
            setIsSending(false);
            setLogs(prev => [...prev, `🎉 CAMPAÑA FINALIZADA.`]);
        }
        return () => clearTimeout(timer);
    }, [isSending, sendingProgress, clients, chats, bulkMessage, msgInterval, campaignMedia, antiBanMode, setChats, socket, connectionStatus]);

    // -------------------------------------------------------------------------
    // 🖥️ VISTA: LOGIN / SCANNER QR
    // -------------------------------------------------------------------------
    if (connectionStatus !== 'READY') {
        return (
            <div className="flex flex-col h-full bg-[#d1d7db] relative overflow-hidden font-sans">
                <div className="h-[220px] bg-[#00a884] w-full absolute top-0 left-0 z-0"></div>
                
                {/* Server Header */}
                <div className="absolute top-5 left-5 z-20 flex items-center gap-3 text-white">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20 ${serverError ? 'bg-red-500/50' : 'bg-black/20'}`}>
                        {serverError ? <WifiOff size={14}/> : <Wifi size={14}/>}
                        <span className="text-xs font-bold uppercase tracking-wider">
                            {serverError ? 'MOTOR DESCONECTADO' : 'BUSCANDO SERVIDOR...'}
                        </span>
                    </div>
                </div>

                <div className="z-10 flex-1 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl w-[1000px] h-[70vh] flex overflow-hidden relative">
                        
                        {/* Mensaje de Error de Servidor */}
                        {serverError && (
                            <div className="absolute inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-10 text-center">
                                <AlertCircle size={64} className="text-red-500 mb-4"/>
                                <h2 className="text-2xl font-bold text-slate-800">Motor de WhatsApp Offline</h2>
                                <p className="text-slate-500 mt-2 max-w-lg">
                                    Para activar la integración real, debes ejecutar el servidor Node.js en una terminal aparte:
                                </p>
                                <div className="bg-slate-900 text-green-400 font-mono p-4 rounded-xl mt-6 text-left text-sm shadow-xl">
                                    <p className="opacity-50 text-xs mb-2"># Abre una nueva terminal y ejecuta:</p>
                                    <p>$ npm run server</p>
                                </div>
                                <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">Reintentar Conexión</button>
                            </div>
                        )}

                        <div className="flex-1 p-12 flex flex-col justify-between">
                            <div>
                                <h1 className="text-3xl font-light text-[#41525d] mb-10">Usar WhatsApp en SapiSoft ERP</h1>
                                <ol className="text-lg text-[#3b4a54] space-y-5 list-decimal list-inside">
                                    <li>Abre WhatsApp en tu teléfono</li>
                                    <li>Toca <strong>Menú</strong> o <strong>Configuración</strong></li>
                                    <li>Toca <strong>Dispositivos vinculados</strong></li>
                                    <li>Escanea el código QR que aparecerá</li>
                                </ol>
                            </div>
                            <div className="text-[#008069] font-medium text-sm">Integración WhatsApp Web.js + Socket.IO</div>
                        </div>
                        
                        <div className="w-[400px] flex flex-col items-center justify-center border-l border-gray-100 p-10">
                            {qrValue ? (
                                <div className="relative group">
                                    <div className="border-4 border-white shadow-lg p-2 bg-white rounded-lg">
                                        <QRCodeSVG value={qrValue} size={260} level={"L"} includeMargin={true} />
                                    </div>
                                    <p className="text-center mt-4 text-sm text-slate-500 font-medium animate-pulse">Escanea el código QR</p>
                                </div>
                            ) : (
                                <div className="w-64 h-64 flex flex-col items-center justify-center text-center">
                                    {connectionStatus === 'AUTHENTICATING' ? (
                                        <>
                                            <Loader2 className="animate-spin text-[#00a884] mb-4" size={48}/>
                                            <p className="text-slate-600 text-sm font-bold">Autenticando...</p>
                                            <p className="text-slate-400 text-xs">Por favor espera un momento</p>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="animate-spin text-slate-300 mb-4" size={48}/>
                                            <p className="text-slate-400 text-sm font-medium">Iniciando motor...</p>
                                        </>
                                    )}
                                </div>
                            )}
                            
                            <div className="mt-10 flex items-center gap-2">
                                <input type="checkbox" id="keep-signed-in" className="rounded text-[#00a884] focus:ring-[#00a884]" defaultChecked />
                                <label htmlFor="keep-signed-in" className="text-sm text-[#3b4a54] font-medium">Mantener sesión iniciada</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // 📱 VISTA: CHAT PRINCIPAL (CONECTADO)
    // -------------------------------------------------------------------------
    return (
        <div className="flex flex-col h-full bg-slate-200 overflow-hidden rounded-xl border border-slate-300 shadow-2xl relative">
            <div className="bg-[#dee1e6] px-4 py-2 flex items-center gap-3 border-b border-[#bdc1c6] shrink-0">
                <div className="flex gap-2 text-slate-500">
                    <ArrowLeft size={16} className="cursor-not-allowed opacity-50"/>
                    <ArrowRight size={16} className="cursor-not-allowed opacity-50"/>
                    <RotateCcw size={16} className="hover:text-slate-800 cursor-pointer"/>
                </div>
                <div className="flex-1 bg-white rounded-full px-4 py-1.5 flex items-center gap-2 border border-slate-300 text-xs text-slate-600 shadow-sm">
                    <Lock size={12} className="text-emerald-600"/>
                    <span className="flex-1 font-bold">WhatsApp Web Real (Socket.IO)</span>
                    <Globe size={12} className="text-blue-500"/> 
                </div>
                <div className="flex gap-3 text-slate-600"><User size={16}/><MoreVertical size={16}/></div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* SIDEBAR DE CHATS */}
                <div className="w-[380px] flex flex-col border-r border-[#e9edef] bg-white h-full">
                    <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 shrink-0">
                        <div className="w-10 h-10 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-500"><User size={24}/></div>
                        <div className="flex gap-6 text-[#54656f]"><Users size={20} /><MoreVertical size={20} /></div>
                    </div>
                    <div className="p-2 border-b border-[#f0f2f5]">
                        <div className="bg-[#f0f2f5] rounded-lg flex items-center px-4 py-2">
                            <Search size={18} className="text-[#54656f] mr-4"/>
                            <input type="text" placeholder="Busca un chat o inicia uno nuevo" className="bg-transparent text-sm w-full outline-none placeholder-[#54656f]"/>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-white">
                        {chats.map(chat => (
                            <div key={chat.id} onClick={() => { setActiveChatId(chat.id); setChats(chats.map(c => c.id === chat.id ? {...c, unread: 0} : c)) }}
                                className={`flex items-center px-3 py-3 cursor-pointer hover:bg-[#f5f6f6] ${activeChatId === chat.id ? 'bg-[#f0f2f5]' : ''}`}>
                                <div className="w-12 h-12 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-600 font-bold text-lg mr-3 shrink-0">{chat.avatar}</div>
                                <div className="flex-1 min-w-0 border-b border-[#f0f2f5] pb-3">
                                    <div className="flex justify-between items-baseline mb-1"><span className="text-[#111b21] font-normal text-base truncate">{chat.name}</span><span className="text-xs text-[#667781]">{chat.lastMessageTime}</span></div>
                                    <div className="flex justify-between items-center"><p className="text-sm text-[#667781] truncate pr-2">{chat.lastMessage}</p>{chat.unread > 0 && (<span className="bg-[#25d366] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">{chat.unread}</span>)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AREA DE MENSAJES */}
                {activeChatId ? (
                    <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                        <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>
                        
                        <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 shrink-0 z-10 border-b border-[#d1d7db]">
                            <div className="flex items-center"><div className="w-10 h-10 rounded-full bg-[#dfe3e5] flex items-center justify-center text-gray-600 font-bold mr-3">{chats.find(c => c.id === activeChatId)?.avatar}</div><div className="flex flex-col"><span className="text-[#111b21] font-normal">{chats.find(c => c.id === activeChatId)?.name}</span><span className="text-xs text-[#667781]">en línea</span></div></div>
                            <div className="flex gap-6 text-[#54656f]"><Search size={20}/><MoreVertical size={20}/></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 space-y-2 z-10 scrollbar-thin">
                            {chats.find(c => c.id === activeChatId)?.messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[65%] rounded-lg shadow-sm text-sm relative overflow-hidden ${msg.sender === 'me' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                                        {(msg.text) && (
                                            <div className="px-2 py-1.5">
                                                <p className="text-[#111b21] leading-relaxed whitespace-pre-line">{msg.text}</p>
                                                <div className="flex justify-end items-center gap-1 mt-1 select-none"><span className="text-[10px] text-[#667781]">{msg.time}</span>{msg.sender === 'me' && <CheckCheck size={14} className="text-[#53bdeb]"/>}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="min-h-[62px] bg-[#f0f2f5] px-4 py-2 flex items-center gap-2 z-10">
                            <Smile size={24} className="text-[#54656f] cursor-pointer"/>
                            <Paperclip size={24} className="text-[#54656f] cursor-pointer"/>
                            <div className="flex-1 bg-white rounded-lg py-2 px-4 mx-2"><input type="text" className="w-full text-sm outline-none placeholder-[#667781] text-[#111b21]" placeholder="Escribe un mensaje" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}/></div>
                            <button onClick={handleSendMessage}><Send size={24} className="text-[#54656f] cursor-pointer"/></button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 bg-[#f0f2f5] flex items-center justify-center border-b-[6px] border-[#25d366]"><div className="text-center text-[#41525d]"><h1 className="text-3xl font-light mb-4">WhatsApp Web</h1><p className="text-sm">Envía y recibe mensajes sin necesidad de tener tu teléfono conectado.</p></div></div>
                )}

                {/* EXTENSIÓN MASS SENDER */}
                {isExtensionOpen ? (
                    <div className="absolute right-4 top-4 bottom-4 w-96 bg-white shadow-2xl rounded-lg border border-gray-200 z-[999] flex flex-col animate-in slide-in-from-right-10 duration-300">
                        <div className="bg-emerald-600 p-4 rounded-t-lg text-white flex justify-between items-start shadow-md">
                            <div><h3 className="font-bold flex items-center gap-2"><Zap size={18} fill="currentColor"/> Envíos Masivos</h3><p className="text-[10px] opacity-90">WhatsApp Bulk Sender Pro</p></div>
                            <button onClick={() => setIsExtensionOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={16}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50">
                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> Destinatarios</span>
                                <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded text-xs">{clients.length} contactos</span>
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Mensaje Texto</label>
                                <textarea className="w-full p-3 border border-slate-300 rounded-lg text-xs h-24 focus:border-emerald-500 outline-none resize-none bg-white text-slate-700" value={bulkMessage} onChange={(e) => setBulkMessage(e.target.value)} placeholder="Hola {NOMBRE}..."></textarea>
                                <div className="flex gap-2 mt-1"><span className="cursor-pointer text-[9px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-300" onClick={() => setBulkMessage(prev => prev + ' {NOMBRE}')}>+ Nombre</span><span className="cursor-pointer text-[9px] bg-slate-200 px-2 py-0.5 rounded text-slate-600 hover:bg-slate-300" onClick={() => setBulkMessage(prev => prev + ' {DNI}')}>+ DNI</span></div>
                            </div>
                            
                            <div className="bg-black/90 rounded-lg p-3 h-32 overflow-y-auto font-mono text-[9px] text-green-400 border border-slate-700 shadow-inner">
                                {logs.length === 0 ? <span className="opacity-50">// Esperando comando...</span> : logs.map((l, i) => <div key={i}>{l}</div>)}
                                <div ref={logsEndRef}/>
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t border-slate-200">
                            {isSending ? (
                                <button onClick={() => setIsSending(false)} className="w-full py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 text-sm animate-pulse"><Square size={14} fill="currentColor"/> DETENER CAMPAÑA</button>
                            ) : (
                                <button onClick={() => { setIsSending(true); setSendingProgress(0); setLogs([]); }} className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-200"><Play size={14} fill="currentColor"/> INICIAR ENVÍO MASIVO</button>
                            )}
                            <div className="text-center mt-2"><span className="text-[10px] text-slate-400">{sendingProgress} / {clients.length} completados</span><div className="w-full bg-slate-100 h-1.5 mt-1 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-300" style={{ width: `${(sendingProgress / clients.length) * 100}%` }}></div></div></div>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsExtensionOpen(true)} className="absolute right-0 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3 rounded-l-xl shadow-xl z-40 hover:bg-emerald-700 transition-transform hover:-translate-x-1 flex flex-col items-center gap-1" title="Herramientas Masivas">
                        <Zap size={20}/>
                    </button>
                )}
            </div>
        </div>
    );
};

export default WhatsAppModule;
