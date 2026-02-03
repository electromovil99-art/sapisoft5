
import React, { useState, useEffect } from 'react';
import { KanbanSquare, Plus, MoreHorizontal, User, Phone, Tag, Wifi, WifiOff, QrCode, LogOut } from 'lucide-react';
import { CrmContact, ViewState } from '../types';
import { checkConnection, socket, BACKEND_URL } from '../socketService';

interface CrmModuleProps {
    crmDb: Record<string, CrmContact>;
    setCrmDb: React.Dispatch<React.SetStateAction<Record<string, CrmContact>>>;
    stages: any[];
    onNavigate: (view: ViewState) => void;
}

const CrmModule: React.FC<CrmModuleProps> = ({ crmDb, setCrmDb, stages, onNavigate }) => {
    // Estado para visualizar la "rpta" del socket en tiempo real
    const [connectionStatus, setConnectionStatus] = useState(socket.connected ? 'Conectado' : 'Desconectado');

    // Listener para actualizar el cuadrito de estado automáticamente
    useEffect(() => {
        const onConnect = () => setConnectionStatus('Conectado');
        const onDisconnect = () => setConnectionStatus('Desconectado');

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
        };
    }, []);

    const handleQrReset = async () => {
        if(!confirm("¿Deseas cambiar el número de WhatsApp? Se cerrará la sesión actual.")) return;
        
        // Cambiamos el estado visual para feedback inmediato
        setConnectionStatus('Desconectando...');

        try {
            // 1. Enviar señal de logout por Socket (rápido)
            if (socket.connected) {
                socket.emit('logout');
            }

            // 2. Enviar señal por API REST (seguro, por si el socket falla)
            // Usamos fetch con headers para evitar bloqueos de ngrok si aplica
            await fetch(`${BACKEND_URL}/logout`, { 
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    "ngrok-skip-browser-warning": "true" 
                }
            });

        } catch (e) {
            console.error("Error crítico desconectando:", e);
        } finally {
            // 3. Forzar desconexión local del socket
            // Esto asegura que al volver a conectar, el servidor (si ya se reseteó) envíe el evento QR nuevo
            // en lugar de reanudar una sesión fantasma.
            socket.disconnect();
            
            // 4. Navegar a la vista de WhatsApp donde está el escáner
            onNavigate(ViewState.WHATSAPP);
            
            // 5. Reconectar socket tras un breve delay para permitir que el módulo de WhatsApp monte
            setTimeout(() => {
                socket.connect(); 
            }, 1000);
        }
    };
    
    // Group contacts by stage
    const columns = stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        color: stage.color,
        items: Object.values(crmDb).filter((contact: CrmContact) => contact.stage === stage.id)
    }));

    const handleDragStart = (e: React.DragEvent, phone: string) => {
        e.dataTransfer.setData("text/plain", phone);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        const phone = e.dataTransfer.getData("text/plain");
        if (crmDb[phone]) {
            setCrmDb(prev => ({
                ...prev,
                [phone]: { ...prev[phone], stage: stageId }
            }));
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                        <KanbanSquare className="text-indigo-500"/> Pipeline de Ventas (CRM)
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Gestión visual de oportunidades y estado de clientes.
                    </p>
                </div>

                {/* CUADRO CHICO DE ESTADO Y PRUEBA DE ENLACE */}
                <div className="flex flex-col sm:items-end gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner w-full sm:w-auto">
                    <div className="flex items-center gap-2 px-1">
                        <div className={`w-2 h-2 rounded-full ${connectionStatus === 'Conectado' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-[10px] font-black uppercase ${connectionStatus === 'Conectado' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                            {connectionStatus}
                        </span>
                    </div>
                    <div className="flex gap-1">
                        <button 
                            onClick={checkConnection}
                            className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-white text-[9px] px-3 py-1.5 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all font-bold uppercase tracking-wider shadow-sm flex items-center gap-1"
                            title="Verificar conexión con el servidor"
                        >
                            {connectionStatus === 'Conectado' ? <Wifi size={10}/> : <WifiOff size={10}/>}
                            Estado
                        </button>
                        <button 
                            onClick={handleQrReset}
                            className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[9px] px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-all font-black uppercase tracking-wider shadow-sm flex items-center gap-1 border border-red-100 dark:border-red-900/30"
                            title="Cerrar sesión e ir a escanear nuevo QR"
                        >
                            <QrCode size={10}/>
                            Conectar / QR
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex h-full gap-4 min-w-max px-1">
                    {columns.map(col => (
                        <div 
                            key={col.id} 
                            className="w-72 flex flex-col bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700"
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                        >
                            {/* Column Header */}
                            <div className={`p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center border-l-4 ${col.color.replace('border-', 'border-l-')}`}>
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300">{col.name}</h3>
                                <span className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] font-bold text-slate-400 shadow-sm border border-slate-100 dark:border-slate-700">{col.items.length}</span>
                            </div>

                            {/* Cards Container */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                {col.items.map(contact => (
                                    <div 
                                        key={contact.phone}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, contact.phone)}
                                        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs text-slate-800 dark:text-white line-clamp-1">{contact.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-mono">{contact.phone}</p>
                                                </div>
                                            </div>
                                            <button className="text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreHorizontal size={14}/>
                                            </button>
                                        </div>
                                        
                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {contact.labels.map((label, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded text-[8px] font-bold uppercase">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Value / Date */}
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                            <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                                {contact.value ? `S/ ${contact.value.toFixed(2)}` : '-'}
                                            </p>
                                            <p className="text-[8px] text-slate-400">
                                                {contact.lastInteraction ? new Date(contact.lastInteraction).toLocaleDateString() : 'Sin actividad'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CrmModule;
