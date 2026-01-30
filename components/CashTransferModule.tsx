import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, ArrowRight, Wallet, CheckCircle, Clock, MapPin, Download, XCircle, Lock, Store, Send, Hash, User } from 'lucide-react';
import { BankAccount, CashMovement, Branch, CashTransferRequest } from '../types';

interface CashTransferModuleProps {
    bankAccounts: BankAccount[];
    movements: CashMovement[];
    requests: CashTransferRequest[];
    branches: Branch[];
    currentBranchId: string;
    onInitiateTransfer: (from: string, to: string, amount: number, exchangeRate: number, reference: string, opNumber: string, targetBranchId: string) => void;
    onConfirmTransfer: (request: CashTransferRequest) => void;
    onRejectTransfer?: (request: CashTransferRequest) => void;
    systemBaseCurrency: string;
    isCashBoxOpen: boolean;
}

const CashTransferModule: React.FC<CashTransferModuleProps> = ({ 
    movements, requests, branches, currentBranchId, 
    onInitiateTransfer, onConfirmTransfer, onRejectTransfer, systemBaseCurrency, isCashBoxOpen 
}) => {
    const [activeTab, setActiveTab] = useState<'NEW' | 'PENDING'>('NEW');
    
    // State for NEW TRANSFER - Simplified
    const [transferData, setTransferData] = useState({ 
        targetBranchId: '', 
        amount: '', 
        reference: '' 
    });

    const pendingRequests = useMemo(() => {
        return requests.filter(r => r.toBranchId === currentBranchId && r.status === 'PENDING');
    }, [requests, currentBranchId]);

    const mySentRequests = useMemo(() => {
        return requests.filter(r => r.fromBranchId === currentBranchId).sort((a, b) => b.id.localeCompare(a.id));
    }, [requests, currentBranchId]);

    // FILTERED HISTORY: Only show movements relevant to THIS branch
    const transfersHistory = useMemo(() => {
        return movements
            .filter(m => m.category.includes('TRANSFERENCIA') && (m.branchId === currentBranchId))
            .sort((a, b) => {
                const dateA = a.date.split('/').reverse().join('') + a.time;
                const dateB = b.date.split('/').reverse().join('') + b.time;
                return dateB.localeCompare(dateA);
            });
    }, [movements, currentBranchId]);

    // Helper to get Branch Name
    const getBranchName = (id: string) => branches.find(b => b.id === id)?.name || 'Desconocido';
    const currentBranchName = getBranchName(currentBranchId);

    const handleExecuteTransfer = () => {
        const amountNum = parseFloat(transferData.amount);
        
        if (!transferData.targetBranchId) return alert("Debe seleccionar la sucursal de destino.");
        
        // Validation: Cannot send FROM cash if cash box is closed
        if (!isCashBoxOpen) {
            return alert("No puede enviar dinero de Caja porque está CERRADA. Abra turno primero.");
        }
        
        if (transferData.targetBranchId === currentBranchId) {
            return alert("No puede transferirse a sí mismo.");
        }

        if (isNaN(amountNum) || amountNum <= 0) return alert("Monto inválido.");
        
        onInitiateTransfer(
            'CASH', // Fixed Source Account
            'CASH', // Fixed Target Account
            amountNum, 
            1, // Fixed Rate
            transferData.reference || 'TRASPASO INTERNO', 
            'EFECTIVO', // Default Op Number
            transferData.targetBranchId
        );
        
        setTransferData({ targetBranchId: '', amount: '', reference: '' });
    };

    const handleConfirmRequest = (req: CashTransferRequest) => {
        // VALIDACIÓN CRÍTICA: Si recibo en EFECTIVO, la caja debe estar abierta.
        if (!isCashBoxOpen) {
            return alert("⛔ ACCIÓN DENEGADA\n\nLa Caja Principal está CERRADA.\nDebe abrir la caja (Iniciar Turno) antes de aceptar ingresos de efectivo.");
        }
        onConfirmTransfer(req);
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            {/* TABS HEADER */}
            <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-fit shrink-0">
                <button 
                    onClick={() => setActiveTab('NEW')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'NEW' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50'}`}
                >
                    <ArrowRightLeft size={16}/> Enviar / Historial
                </button>
                <button 
                    onClick={() => setActiveTab('PENDING')}
                    className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${activeTab === 'PENDING' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-white/50'}`}
                >
                    <Download size={16}/> Recepción {pendingRequests.length > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>}
                </button>
            </div>

            {activeTab === 'NEW' ? (
                <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
                    
                    {/* PANEL IZQUIERDO: FORMULARIO COMPACTO */}
                    <div className="w-full lg:w-80 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col shrink-0 h-fit">
                        <div className="mb-6 pb-4 border-b border-slate-100 dark:border-slate-700">
                            <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                                <Send className="text-blue-600" size={20}/> Nuevo Envío
                            </h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transferencia entre Cajas</p>
                        </div>
                        
                        {!isCashBoxOpen && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl flex items-center gap-2 text-[10px] font-black text-red-600 dark:text-red-400 uppercase leading-tight">
                                <Lock size={24} className="shrink-0"/> Caja Cerrada: No puede enviar efectivo.
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            {/* RUTA VISUAL */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <div className="text-center">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-1"><MapPin size={14}/></div>
                                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase block max-w-[80px] truncate">{currentBranchName}</span>
                                </div>
                                <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2 relative">
                                    <ArrowRight size={12} className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-slate-400 bg-slate-50 dark:bg-slate-900 px-1"/>
                                </div>
                                <div className="text-center">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-1"><Store size={14}/></div>
                                    <span className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase block max-w-[80px] truncate">Destino</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Sucursal de Destino</label>
                                <select 
                                    className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-black uppercase outline-none focus:border-blue-500 cursor-pointer text-slate-700 dark:text-white transition-colors"
                                    value={transferData.targetBranchId}
                                    onChange={e => setTransferData({...transferData, targetBranchId: e.target.value})}
                                >
                                    <option value="">-- SELECCIONAR --</option>
                                    {branches.filter(b => b.id !== currentBranchId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Monto a Enviar ({systemBaseCurrency})</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">S/</span>
                                    <input 
                                        type="number" 
                                        className="w-full pl-10 p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xl font-black text-slate-800 dark:text-white outline-none focus:border-blue-500 transition-colors" 
                                        value={transferData.amount} 
                                        onChange={e => setTransferData({...transferData, amount: e.target.value})} 
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1.5 ml-2">Referencia / Nota</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl text-xs font-bold uppercase outline-none focus:border-blue-500 transition-colors" value={transferData.reference} onChange={e => setTransferData({...transferData, reference: e.target.value})} placeholder="Ej. Cambio de sencillo"/>
                            </div>
                        </div>

                        <button 
                            onClick={handleExecuteTransfer} 
                            disabled={!isCashBoxOpen}
                            className="w-full py-4 mt-6 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            Confirmar Envío <ArrowRight size={14}/>
                        </button>
                    </div>

                    {/* PANEL DERECHO: HISTORIAL DETALLADO */}
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-sm text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={16}/> Historial de Movimientos
                            </h3>
                            <div className="flex gap-3 text-[9px] font-bold text-slate-400">
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Solicitudes Enviadas</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Entradas</span>
                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Salidas</span>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {transfersHistory.length === 0 && mySentRequests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <ArrowRightLeft size={48} className="text-slate-400 mb-4"/>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay actividad reciente</p>
                                </div>
                            ) : (
                                <>
                                    {/* SHOW SENT PENDING REQUESTS */}
                                    {mySentRequests.filter(r => r.status === 'PENDING').map(req => (
                                        <div key={req.id} className="flex items-center justify-between p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 rounded-xl bg-indigo-200 dark:bg-indigo-800 text-indigo-700 dark:text-white">
                                                    <Clock size={18}/>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">
                                                        <span>{currentBranchName}</span>
                                                        <ArrowRight size={10}/>
                                                        <span>{req.toBranchName}</span>
                                                    </div>
                                                    <p className="text-xs font-bold text-slate-800 dark:text-white uppercase leading-tight">ESPERANDO ACEPTACIÓN</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-300">
                                                    S/ {req.amount.toFixed(2)}
                                                </span>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">{req.date}</p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* SHOW COMPLETED/HISTORICAL MOVEMENTS */}
                                    {transfersHistory.map((t) => {
                                        const isIngreso = t.type === 'Ingreso';
                                        
                                        // Intentar extraer información de origen/destino del concepto
                                        let remoteBranchName = "OTRA SEDE";
                                        if (t.concept.includes("TRASPASO A")) {
                                            remoteBranchName = t.concept.split(" - ")[0].replace("TRASPASO A ", "");
                                        } else if (t.concept.includes("RECEPCIÓN DE")) {
                                            remoteBranchName = t.concept.split(" - ")[0].replace("RECEPCIÓN DE ", ""); 
                                        }

                                        return (
                                            <div key={t.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors group flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2.5 rounded-xl ${isIngreso ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/20'}`}>
                                                            {isIngreso ? <ArrowRight className="rotate-45" size={16}/> : <ArrowRight className="-rotate-45" size={16}/>}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                                <Hash size={10}/>
                                                                <span>ID: {t.id.substring(3, 12)}</span>
                                                                <span className="text-slate-300">|</span>
                                                                <Clock size={10}/>
                                                                <span>{t.time}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-700 dark:text-white uppercase">
                                                                {isIngreso ? (
                                                                    <>
                                                                        <span className="text-slate-500">{remoteBranchName}</span> 
                                                                        <ArrowRight size={12} className="text-emerald-500"/> 
                                                                        <span className="text-emerald-700 dark:text-emerald-400">{currentBranchName}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-rose-700 dark:text-rose-400">{currentBranchName}</span> 
                                                                        <ArrowRight size={12} className="text-rose-500"/> 
                                                                        <span className="text-slate-500">{remoteBranchName}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-lg font-black ${isIngreso ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {isIngreso ? '+' : '-'} {formatSymbol(t.currency)} {t.amount.toFixed(2)}
                                                        </span>
                                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                                            <User size={10} className="text-slate-400"/>
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{t.user}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // PENDING TAB CONTENT (LIST MODE)
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                            <Download size={24} className="text-emerald-500"/> Solicitudes de Ingreso
                        </h3>
                        <div className="px-4 py-1.5 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase">
                            Pendientes en esta sucursal
                        </div>
                    </div>
                    
                    {!isCashBoxOpen && pendingRequests.length > 0 && (
                        <div className="px-6 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 flex items-center justify-center gap-2">
                            <Lock size={14} className="text-red-500"/>
                            <span className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase">
                                Caja Cerrada: Debe abrir turno para confirmar recepciones en efectivo.
                            </span>
                        </div>
                    )}

                    <div className="flex-1 overflow-auto p-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:grid">
                                <div>Origen / Referencia</div>
                                <div className="text-right px-4">Monto</div>
                                <div className="text-center">Acciones</div>
                            </div>

                            {/* Rows */}
                            {pendingRequests.length === 0 ? (
                                <div className="p-12 flex flex-col items-center justify-center text-slate-300 opacity-50">
                                    <CheckCircle size={64} className="mb-4"/>
                                    <p className="font-black uppercase tracking-widest">Todo al día</p>
                                </div>
                            ) : (
                                pendingRequests.map(req => (
                                    <div key={req.id} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-4 items-center px-6 py-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        {/* Origin Info */}
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 shrink-0">
                                                <MapPin size={20}/>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                                    <span>{req.fromBranchName}</span>
                                                    <ArrowRight size={10}/>
                                                    <span>{currentBranchName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                                                    <span>{req.date} • {req.time}</span>
                                                    <span>|</span>
                                                    <span className="text-slate-500">{req.user}</span>
                                                </div>
                                                {req.notes && <p className="text-[10px] text-indigo-500 font-bold italic mt-1 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded w-fit max-w-[200px] truncate">REF: "{req.notes}"</p>}
                                                <span className="text-[9px] font-black text-emerald-600 border border-emerald-200 bg-emerald-50 px-1 rounded mt-1 inline-block uppercase">Efectivo</span>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="text-left sm:text-right px-0 sm:px-4">
                                            <span className="font-black text-lg text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-xl">
                                                {formatSymbol(req.currency)} {req.amount.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex items-center gap-2 justify-end">
                                            <button 
                                                onClick={() => onRejectTransfer && onRejectTransfer(req)}
                                                className="px-4 py-2 text-red-500 bg-white border border-red-100 hover:bg-red-50 dark:bg-slate-800 dark:border-red-900/30 dark:hover:bg-red-900/20 rounded-xl text-[10px] font-black uppercase transition-all"
                                                title="Rechazar"
                                            >
                                                <XCircle size={16}/>
                                            </button>
                                            <button 
                                                onClick={() => handleConfirmRequest(req)}
                                                disabled={!isCashBoxOpen}
                                                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all shadow-md active:scale-95 ${!isCashBoxOpen ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200'}`}
                                                title={!isCashBoxOpen ? 'Caja Cerrada' : 'Confirmar'}
                                            >
                                                {!isCashBoxOpen ? <Lock size={16}/> : <CheckCircle size={16}/>} 
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for currency symbol
const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

export default CashTransferModule;
