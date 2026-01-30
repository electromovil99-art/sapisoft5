
import React, { useState, useMemo } from 'react';
import { ArrowRightLeft, Plus, Search, Trash2, History, X, Package, Download, CheckCircle, Truck, MapPin, XCircle, ClipboardList, ArrowLeft, ArrowRight, Inbox, Edit3, Send, Eye, Printer, User, FileText, Clock } from 'lucide-react';
import { Branch, Product, WarehouseTransfer, Quotation, Presale } from '../types';

interface WarehouseTransferProps {
    branches: Branch[];
    currentBranchId: string;
    products: Product[];
    onProcessTransfer: (transfer: WarehouseTransfer) => void;
    onConfirmTransfer: (transfer: WarehouseTransfer) => void;
    onRejectTransfer: (transfer: WarehouseTransfer) => void;
    onFulfillRequest?: (transfer: WarehouseTransfer) => void; 
    history: WarehouseTransfer[];
    quotations?: Presale[]; // CHANGED FROM Quotation[] TO Presale[] to reflect the new logic
}

const WarehouseTransferModule: React.FC<WarehouseTransferProps> = ({ 
    branches, currentBranchId, products, onProcessTransfer, onConfirmTransfer, onRejectTransfer, onFulfillRequest, history, quotations = [] 
}) => {
    const [activeTab, setActiveTab] = useState<'SEND' | 'RECEIVE' | 'REQUESTS'>('SEND');
    const [showModal, setShowModal] = useState(false);
    const [showQuoteSelector, setShowQuoteSelector] = useState(false);
    
    // NEW: Detail Modal
    const [selectedTransfer, setSelectedTransfer] = useState<WarehouseTransfer | null>(null);
    const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');

    const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
    const [selectedRequestToFulfill, setSelectedRequestToFulfill] = useState<WarehouseTransfer | null>(null);
    const [fulfillItems, setFulfillItems] = useState<{productId: string, quantity: number, maxStock: number}[]>([]);

    const [transferMode, setTransferMode] = useState<'SEND' | 'REQUEST'>('SEND');
    const [referenceNote, setReferenceNote] = useState(''); 
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState('');
    const [transferCart, setTransferCart] = useState<{ productId: string, productName: string, quantity: number, maxStock: number }[]>([]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return products.filter(p => p.name.toLowerCase().includes(term) || p.code.includes(term)).slice(0, 5);
    }, [products, searchTerm]);

    const incomingTransfers = useMemo(() => {
        return history.filter(t => t.toBranchId === currentBranchId && t.status === 'PENDING');
    }, [history, currentBranchId]);

    const requestsToFulfill = useMemo(() => {
        return history.filter(t => t.fromBranchId === currentBranchId && t.status === 'REQUESTED');
    }, [history, currentBranchId]);

    const addToCart = (p: Product, qty: number = 1) => {
        if (transferCart.some(i => i.productId === p.id)) return;
        setTransferCart(prev => [...prev, { productId: p.id, productName: p.name, quantity: qty, maxStock: p.stock }]);
        setSearchTerm('');
    };

    const handleImportQuote = (presale: Presale) => {
        const newItems = presale.items.map(item => {
            const product = products.find(p => p.id === item.id);
            return {
                productId: item.id,
                productName: item.name,
                quantity: item.quantity,
                maxStock: product ? product.stock : 0
            };
        });
        
        const existingIds = new Set(transferCart.map(i => i.productId));
        const itemsToAdd = newItems.filter(i => !existingIds.has(i.productId));
        
        setTransferCart(prev => [...prev, ...itemsToAdd]);
        setReferenceNote(`${presale.clientName} (Entrega: ${presale.deliveryDate})`); 
        setShowQuoteSelector(false);
        alert(`Se cargaron ${itemsToAdd.length} productos de la preventa de ${presale.clientName}.`);
    };

    const handleProcess = () => {
        if (!selectedBranchId) return alert("Seleccione la sucursal.");
        if (selectedBranchId === currentBranchId) return alert("Origen y destino no pueden ser iguales.");
        if (transferCart.length === 0) return alert("Agregue productos.");

        const isRequest = transferMode === 'REQUEST';
        const fromId = isRequest ? selectedBranchId : currentBranchId;
        const toId = isRequest ? currentBranchId : selectedBranchId;

        const fromB = branches.find(b => b.id === fromId)!;
        const toB = branches.find(b => b.id === toId)!;

        const newTransfer: WarehouseTransfer = {
            id: 'TR-' + Date.now(),
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            fromBranchId: fromId,
            toBranchId: toId,
            fromBranchName: fromB.name,
            toBranchName: toB.name,
            items: transferCart.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, originalRequestedQty: i.quantity })),
            status: isRequest ? 'REQUESTED' : 'PENDING',
            user: 'ADMIN', 
            notes: referenceNote || (isRequest ? 'SOLICITUD DE STOCK' : 'ENVIO DE MERCADERIA') 
        };

        onProcessTransfer(newTransfer);
        setTransferCart([]);
        setReferenceNote('');
        setShowModal(false);
    };

    const openFulfillModal = (request: WarehouseTransfer) => {
        setSelectedRequestToFulfill(request);
        const items = request.items.map(i => {
            const prod = products.find(p => p.id === i.productId);
            return {
                productId: i.productId,
                quantity: i.quantity,
                maxStock: prod ? prod.stock : 0
            };
        });
        setFulfillItems(items);
        setFulfillModalOpen(true);
    };

    const confirmFulfill = () => {
        if (!selectedRequestToFulfill || !onFulfillRequest) return;
        
        const invalidItems = fulfillItems.filter(i => i.quantity > i.maxStock);
        if (invalidItems.length > 0) {
            if(!confirm("Advertencia: Estás enviando más cantidad de la que tienes en stock local. ¿Continuar y dejar stock en negativo?")) return;
        }

        const updatedTransfer: WarehouseTransfer = {
            ...selectedRequestToFulfill,
            status: 'PENDING',
            items: selectedRequestToFulfill.items.map(i => {
                const fulfilled = fulfillItems.find(f => f.productId === i.productId);
                return { ...i, quantity: fulfilled ? fulfilled.quantity : i.quantity };
            })
        };

        onFulfillRequest(updatedTransfer);
        setFulfillModalOpen(false);
        setSelectedRequestToFulfill(null);
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            {/* Header Tabs */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('SEND')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'SEND' ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <ArrowRightLeft size={16}/> Historial / Envíos
                    </button>
                    <button 
                        onClick={() => setActiveTab('REQUESTS')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'REQUESTS' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Inbox size={16}/> Por Atender {requestsToFulfill.length > 0 && <span className="bg-white text-indigo-600 px-1.5 py-0.5 rounded-full text-[9px]">{requestsToFulfill.length}</span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('RECEIVE')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'RECEIVE' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100'}`}
                    >
                        <Download size={16}/> Recepción {incomingTransfers.length > 0 && <span className="bg-white text-emerald-600 px-1.5 py-0.5 rounded-full text-[9px]">{incomingTransfers.length}</span>}
                    </button>
                </div>
                <button onClick={() => { setTransferMode('SEND'); setTransferCart([]); setReferenceNote(''); setSelectedBranchId(''); setShowModal(true); }} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-2 active:scale-95">
                    <Plus size={16}/> Nueva Operación
                </button>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                
                {activeTab === 'SEND' && (
                    <>
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex items-center gap-2">
                            <History size={16} className="text-slate-400"/>
                            <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Historial General</h3>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white dark:bg-slate-800 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b z-10">
                                    <tr>
                                        <th className="px-8 py-4">ID Operación</th>
                                        <th className="px-8 py-4">Fecha</th>
                                        <th className="px-8 py-4">Origen {'>'} Destino</th>
                                        <th className="px-8 py-4">Referencia / Cliente</th>
                                        <th className="px-8 py-4">Solicitante</th>
                                        <th className="px-8 py-4 text-center">Items</th>
                                        <th className="px-8 py-4 text-center">Estado</th>
                                        <th className="px-8 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {history.filter(t => t.fromBranchId === currentBranchId || t.toBranchId === currentBranchId).length === 0 ? (
                                        <tr><td colSpan={8} className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest italic opacity-50">Sin registros</td></tr>
                                    ) : history.filter(t => t.fromBranchId === currentBranchId || t.toBranchId === currentBranchId).map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                            <td className="px-8 py-4 font-mono text-[10px] text-blue-600 font-black">#{t.id.substring(3,9)}</td>
                                            <td className="px-8 py-4"><div className="text-[11px] font-black text-slate-700 dark:text-slate-200">{t.date}</div><div className="text-[9px] text-slate-400">{t.time}</div></td>
                                            <td className="px-8 py-4 uppercase text-[10px] font-bold text-slate-700 dark:text-white flex items-center gap-2">
                                                {t.fromBranchName} <ArrowRight size={12}/> {t.toBranchName}
                                                {t.status === 'REQUESTED' && <span className="bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded text-[8px]">SOLICITUD</span>}
                                            </td>
                                            <td className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase max-w-[150px] truncate" title={t.notes}>
                                                {t.notes || '-'}
                                            </td>
                                            <td className="px-8 py-4 text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                                                <User size={12}/> {t.user || 'ADMIN'}
                                            </td>
                                            <td className="px-8 py-4 text-center font-black text-slate-700 dark:text-white">{t.items.length}</td>
                                            <td className="px-8 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : t.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' : t.status === 'REQUESTED' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'}`}>
                                                    {t.status === 'COMPLETED' ? 'Recibido' : t.status === 'REJECTED' ? 'Rechazado' : t.status === 'REQUESTED' ? 'Solicitado' : 'En Tránsito'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-4 text-center">
                                                <button onClick={() => setSelectedTransfer(t)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors bg-white border rounded-lg shadow-sm hover:shadow-md" title="Ver / Imprimir">
                                                    <Printer size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {activeTab === 'REQUESTS' && (
                    <div className="flex-1 overflow-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start bg-slate-50/50 dark:bg-slate-900/20">
                        {requestsToFulfill.length === 0 ? (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-300 opacity-50">
                                <Inbox size={64} className="mb-4"/>
                                <p className="font-black uppercase tracking-widest">No hay pedidos pendientes</p>
                            </div>
                        ) : (
                            requestsToFulfill.map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all flex flex-col h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <ClipboardList size={80}/>
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Solicitado Por</p>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-indigo-500"/>
                                                    <span className="font-black text-sm uppercase text-slate-800 dark:text-white">{t.toBranchName}</span>
                                                </div>
                                                <div className="text-[9px] font-bold text-slate-500 mt-1 flex items-center gap-1"><User size={10}/> {t.user || 'ADMIN'}</div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                                                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">{t.date}</span>
                                            </div>
                                        </div>
                                        
                                        {t.notes && (
                                            <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800/30">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Referencia / Cliente</p>
                                                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">{t.notes}</p>
                                            </div>
                                        )}

                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                                            {t.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-[10px] py-1 border-b border-slate-100 last:border-0 dark:border-slate-700">
                                                    <span className="font-bold uppercase truncate pr-2">{item.productName}</span>
                                                    <span className="font-black text-slate-700 dark:text-white">Pide: {item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex gap-2 mt-auto">
                                        <button 
                                            onClick={() => onRejectTransfer(t)}
                                            className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-500 border border-red-200 dark:border-red-900/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16}/> Rechazar
                                        </button>
                                        <button 
                                            onClick={() => openFulfillModal(t)}
                                            className="flex-[2] py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <Edit3 size={16}/> Atender / Editar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'RECEIVE' && (
                    <div className="flex-1 overflow-auto p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start bg-slate-50/50 dark:bg-slate-900/20">
                        {incomingTransfers.length === 0 ? (
                            <div className="col-span-full h-64 flex flex-col items-center justify-center text-slate-300 opacity-50">
                                <Truck size={64} className="mb-4"/>
                                <p className="font-black uppercase tracking-widest">No hay mercadería en tránsito</p>
                            </div>
                        ) : (
                            incomingTransfers.map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all flex flex-col h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Package size={80}/>
                                    </div>
                                    <div className="relative z-10 flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origen</p>
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-blue-500"/>
                                                    <span className="font-black text-sm uppercase text-slate-800 dark:text-white">{t.fromBranchName}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Enviado</p>
                                                <span className="font-bold text-xs text-slate-600 dark:text-slate-300">{t.date}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                                            {t.items.map((item, i) => (
                                                <div key={i} className="flex justify-between text-[10px] py-1 border-b border-slate-100 last:border-0 dark:border-slate-700">
                                                    <span className="font-bold uppercase truncate pr-2">{item.productName}</span>
                                                    <div className="flex flex-col text-right">
                                                        <span className="font-black text-slate-700 dark:text-white">Llegan: {item.quantity}</span>
                                                        {item.originalRequestedQty && item.quantity !== item.originalRequestedQty && (
                                                            <span className="text-[8px] text-amber-500 font-bold line-through decoration-amber-500/50">Pediste: {item.originalRequestedQty}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex gap-2 mt-auto">
                                        <button 
                                            onClick={() => onRejectTransfer(t)}
                                            className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-500 border border-red-200 dark:border-red-900/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            <XCircle size={16}/> Rechazar
                                        </button>
                                        <button 
                                            onClick={() => onConfirmTransfer(t)}
                                            className="flex-[2] py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle size={16}/> Confirmar Ingreso
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* DETAIL / PRINT MODAL */}
            {selectedTransfer && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
                    <div className={`bg-white dark:bg-slate-900 p-4 shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 flex flex-col gap-4 overflow-hidden ${printFormat === 'A4' ? 'w-full max-w-4xl h-[90vh]' : 'w-[350px] h-auto'}`}>
                        <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
                            <button onClick={() => setPrintFormat('80mm')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Ticket 80mm</button>
                            <button onClick={() => setPrintFormat('A4')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>Hoja A4</button>
                            <button onClick={() => setSelectedTransfer(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={18}/></button>
                        </div>

                        <div className="flex-1 overflow-auto bg-white p-6 rounded-2xl border border-slate-100 flex justify-center custom-scrollbar">
                            {printFormat === '80mm' ? (
                                <div className="w-[280px] font-mono text-[10px] text-black">
                                    <div className="text-center border-b-2 border-dashed border-black pb-2 mb-2">
                                        <h2 className="font-bold text-xs">NOTA DE TRASPASO</h2>
                                        <p className="font-bold">ID: {selectedTransfer.id}</p>
                                    </div>
                                    <div className="mb-2 space-y-1">
                                        <p><strong>FECHA:</strong> {selectedTransfer.date} {selectedTransfer.time}</p>
                                        <p><strong>DE:</strong> {selectedTransfer.fromBranchName}</p>
                                        <p><strong>PARA:</strong> {selectedTransfer.toBranchName}</p>
                                        <p><strong>SOLICITA:</strong> {selectedTransfer.user}</p>
                                        {selectedTransfer.notes && <p><strong>REF:</strong> {selectedTransfer.notes}</p>}
                                        <p><strong>ESTADO:</strong> {selectedTransfer.status}</p>
                                    </div>
                                    <div className="border-t border-b border-black py-1 mb-2">
                                        <div className="flex font-bold"><span className="flex-1">DESCRIPCION</span><span className="w-10 text-right">CANT</span></div>
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        {selectedTransfer.items.map((item, i) => (
                                            <div key={i} className="flex">
                                                <span className="flex-1 truncate pr-1">{item.productName}</span>
                                                <span className="w-10 text-right font-bold">{item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="text-center pt-4 border-t-2 border-dashed border-black mt-4">
                                        <br/><br/>
                                        _________________________<br/>
                                        Recibí Conforme
                                    </div>
                                </div>
                            ) : (
                                <div className="w-[800px] font-sans text-xs text-slate-800 p-8">
                                    <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4 mb-6">
                                        <div>
                                            <h1 className="text-2xl font-black uppercase">Nota de Traspaso</h1>
                                            <p className="font-bold text-slate-500">CONTROL DE MERCADERÍA INTERNA</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-mono font-bold">#{selectedTransfer.id}</p>
                                            <p>{selectedTransfer.date} - {selectedTransfer.time}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div className="border p-4 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Origen</p>
                                            <p className="font-bold text-lg uppercase">{selectedTransfer.fromBranchName}</p>
                                            <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase">Solicitado Por</p>
                                            <p className="font-bold uppercase">{selectedTransfer.user}</p>
                                        </div>
                                        <div className="border p-4 rounded-xl">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Destino</p>
                                            <p className="font-bold text-lg uppercase">{selectedTransfer.toBranchName}</p>
                                            {selectedTransfer.notes && (
                                                <>
                                                    <p className="text-[10px] mt-2 font-bold text-slate-400 uppercase">Referencia / Cliente</p>
                                                    <p className="font-bold uppercase">{selectedTransfer.notes}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <table className="w-full border-collapse mb-8">
                                        <thead>
                                            <tr className="bg-slate-100 border-b-2 border-slate-200">
                                                <th className="p-3 text-left">Ítem / Producto</th>
                                                <th className="p-3 text-center w-32">Cantidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {selectedTransfer.items.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-3 uppercase font-medium">{item.productName}</td>
                                                    <td className="p-3 text-center font-bold">{item.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-between mt-12 pt-8">
                                        <div className="text-center w-64 border-t border-slate-300 pt-2">
                                            <p className="font-bold uppercase text-[10px]">Firma Emisor</p>
                                        </div>
                                        <div className="text-center w-64 border-t border-slate-300 pt-2">
                                            <p className="font-bold uppercase text-[10px]">Firma Receptor</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => window.print()} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-lg">
                                <Printer size={16}/> Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL NUEVA OPERACIÓN (ENVIO / PEDIDO) */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="font-black text-xl uppercase tracking-tighter dark:text-white flex items-center gap-4">
                                <ArrowRightLeft size={24} className="text-blue-600"/> 
                                {transferMode === 'SEND' ? 'Enviar Mercadería' : 'Solicitar Stock (Pedido)'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="flex-1 flex min-h-0">
                            <div className="w-[40%] p-8 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 space-y-6 overflow-y-auto no-scrollbar">
                                
                                {/* TIPO DE OPERACIÓN */}
                                <div className="bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 flex">
                                    <button 
                                        onClick={() => setTransferMode('SEND')} 
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${transferMode === 'SEND' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                                    >
                                        <ArrowRight size={14} className="inline mr-2"/> Enviar A...
                                    </button>
                                    <button 
                                        onClick={() => setTransferMode('REQUEST')} 
                                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${transferMode === 'REQUEST' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                                    >
                                        <ArrowLeft size={14} className="inline mr-2"/> Pedir De...
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                                            {transferMode === 'SEND' ? 'Destino (Sucursal Receptora)' : 'Origen (Sucursal Proveedora)'}
                                        </label>
                                        <select className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-black text-[11px] uppercase outline-none focus:border-blue-500" value={selectedBranchId} onChange={e=>setSelectedBranchId(e.target.value)}>
                                            <option value="">Seleccionar Sucursal...</option>
                                            {branches.filter(b=>b.id!==currentBranchId).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                        </select>
                                    </div>
                                    
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Referencia / Cliente</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm uppercase outline-none focus:border-blue-500"
                                            placeholder="Nombre del Cliente o Nota..."
                                            value={referenceNote}
                                            onChange={e => setReferenceNote(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Seleccionar Artículos</label>
                                    
                                    {/* Load Quote Button */}
                                    {transferMode === 'REQUEST' && (
                                        <button 
                                            onClick={() => setShowQuoteSelector(true)}
                                            className="w-full py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 mb-2 hover:bg-indigo-100 transition-colors"
                                        >
                                            <Clock size={14}/> Cargar desde Preventa
                                        </button>
                                    )}

                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input type="text" className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-2xl outline-none font-bold text-sm" placeholder="SKU o Nombre..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                                        {filteredProducts.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in">
                                                {filteredProducts.map(p => (
                                                    <button key={p.id} onClick={() => addToCart(p)} className="w-full p-4 text-left hover:bg-blue-50 dark:hover:bg-slate-700 flex justify-between items-center border-b border-slate-50 last:border-0 group transition-colors">
                                                        <div>
                                                            <div className="font-black text-[10px] uppercase text-slate-700 dark:text-white group-hover:text-blue-600">{p.name}</div>
                                                            <div className="text-[9px] text-slate-400 font-bold">Disp. Local: {p.stock}</div>
                                                        </div>
                                                        <Plus size={16} className="text-blue-600"/>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 p-8 flex flex-col min-h-0 bg-white dark:bg-slate-950">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Package size={14}/> Lista de Carga</h4>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {transferCart.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale scale-75"><Package size={64} className="mb-4"/><p className="font-black uppercase tracking-widest text-sm">Lista Vacía</p></div>
                                    ) : transferCart.map((item, idx) => (
                                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-between group animate-in slide-in-from-right-4">
                                            <div className="min-w-0">
                                                <p className="font-black text-[11px] uppercase text-slate-800 dark:text-white truncate pr-4">{item.productName}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Stock Local: {item.maxStock}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase">Cant:</span>
                                                    <input type="number" className="w-16 p-2 bg-white dark:bg-slate-800 border rounded-xl text-center font-black text-sm outline-none focus:border-blue-500" value={item.quantity} onChange={e => {
                                                        const val = Math.max(1, Number(e.target.value));
                                                        setTransferCart(transferCart.map(it => it.productId === item.productId ? { ...it, quantity: val } : it));
                                                    }}/>
                                                </div>
                                                <button onClick={() => setTransferCart(transferCart.filter(it => it.productId !== item.productId))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-8 shrink-0">
                                    <button onClick={handleProcess} disabled={transferCart.length === 0 || !selectedBranchId} className={`w-full py-5 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl transition-all active:scale-95 disabled:opacity-30 ${transferMode === 'SEND' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30' : 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30'}`}>
                                        {transferMode === 'SEND' ? 'Enviar Mercadería' : 'Solicitar Pedido'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* QUOTE SELECTOR MODAL (NOW LISTS PRESALES) */}
            {showQuoteSelector && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/20 animate-in zoom-in-95 flex flex-col max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2"><Clock size={16}/> Seleccionar Preventa</h3>
                            <button onClick={() => setShowQuoteSelector(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {quotations && quotations.length > 0 ? (
                                quotations.map(q => (
                                    <button key={q.id} onClick={() => handleImportQuote(q)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-black text-xs text-slate-800 dark:text-white uppercase">{q.clientName}</span>
                                            <span className="text-[9px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">Entr: {q.deliveryDate}</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] text-slate-500 font-bold">{q.items.length} productos</span>
                                            <span className="text-sm font-black text-indigo-600">S/ {q.total.toFixed(2)}</span>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase">No hay preventas disponibles</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FULFILL REQUEST MODAL */}
            {fulfillModalOpen && selectedRequestToFulfill && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl h-[80vh] rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter text-indigo-700 dark:text-white flex items-center gap-2">
                                    <Truck size={24}/> Atender Pedido
                                </h3>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mt-1">Solicitado por: {selectedRequestToFulfill.toBranchName}</p>
                            </div>
                            <button onClick={() => setFulfillModalOpen(false)} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                            <div className="flex justify-between items-center px-2 mb-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Producto</span>
                                <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase">
                                    <span className="w-16 text-center">Pedido</span>
                                    <span className="w-16 text-center">Enviar</span>
                                </div>
                            </div>
                            
                            {fulfillItems.map(item => {
                                const prodName = products.find(p => p.id === item.productId)?.name || 'Unknown';
                                const originalQty = selectedRequestToFulfill.items.find(i => i.productId === item.productId)?.quantity || 0;
                                const hasStock = item.maxStock >= item.quantity;

                                return (
                                    <div key={item.productId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                        <div className="flex-1">
                                            <p className="font-black text-xs text-slate-800 dark:text-white uppercase truncate pr-4">{prodName}</p>
                                            <p className={`text-[9px] font-bold uppercase mt-1 ${hasStock ? 'text-emerald-500' : 'text-red-500'}`}>Stock Local: {item.maxStock}</p>
                                        </div>
                                        <div className="flex items-center gap-8">
                                            <span className="w-16 text-center font-bold text-slate-400">{originalQty}</span>
                                            <input 
                                                type="number" 
                                                className={`w-16 p-2 rounded-xl text-center font-black text-sm outline-none border-2 focus:border-indigo-500 ${item.quantity > item.maxStock ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-600'}`}
                                                value={item.quantity}
                                                onChange={e => {
                                                    const val = Math.max(0, Number(e.target.value));
                                                    setFulfillItems(prev => prev.map(pi => pi.productId === item.productId ? { ...pi, quantity: val } : pi));
                                                }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={confirmFulfill} className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                                <Send size={18}/> Confirmar Despacho
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseTransferModule;
