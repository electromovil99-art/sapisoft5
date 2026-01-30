
import React, { useState, useMemo } from 'react';
import { Clock, Trash2, Upload, FileText, Calendar, Edit3, X, Plus, ArrowLeft, AlertTriangle, CheckCircle2, PackageX, ShoppingCart, Printer, Layout } from 'lucide-react';
import { Presale, Product, Client, CartItem, PaymentBreakdown, Category, PurchaseRecord, StockMovement, BankAccount, GeoLocation, Quotation, Branch } from '../types';
import SalesModule from './SalesModule';

interface PresaleModuleProps {
    presales: Presale[];
    onLoadPresale: (presale: Presale) => void;
    onDeletePresale: (id: string) => void;
    
    // Props required for embedded SalesModule (New Presale Mode)
    products: Product[];
    clients: Client[];
    categories: Category[];
    purchasesHistory: PurchaseRecord[];
    stockMovements: StockMovement[];
    bankAccounts: BankAccount[];
    locations: GeoLocation[];
    onAddClient: (client: Client) => void;
    onAddPresale: (presale: Presale) => void; 
    systemBaseCurrency: string;
    branches?: Branch[];
    globalStocks?: Record<string, Record<string, number>>;
    currentBranchId?: string;
    quotations: Quotation[]; // Needed for SalesModule signature
    onAddQuotation: (q: Quotation) => void; // Needed for SalesModule signature
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

const PresaleModule: React.FC<PresaleModuleProps> = ({ 
    presales, onLoadPresale, onDeletePresale,
    products, clients, categories, purchasesHistory, stockMovements, bankAccounts, locations,
    onAddClient, onAddPresale, systemBaseCurrency, branches, globalStocks, currentBranchId,
    quotations, onAddQuotation
}) => {
    
    const [selectedPresale, setSelectedPresale] = useState<Presale | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    
    // Ticket State
    const [showTicket, setShowTicket] = useState(false);
    const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');
    
    // Dummy state for SalesModule when used in Presale mode
    const [tempCart, setTempCart] = useState<CartItem[]>([]);
    const [tempClient, setTempClient] = useState<Client | null>(null);

    const handleDelete = (id: string, name: string) => {
        if(confirm(`¿Estás seguro de eliminar la preventa de "${name}"?`)) {
            onDeletePresale(id);
            if (selectedPresale?.id === id) setSelectedPresale(null);
        }
    };

    // Calculate stock availability for the selected presale
    const stockStatus = useMemo(() => {
        if (!selectedPresale) return { available: false, missing: [] };
        
        const missing: { name: string, required: number, current: number }[] = [];
        
        const isAvailable = selectedPresale.items.every(item => {
            const product = products.find(p => p.id === item.id);
            const currentStock = product ? product.stock : 0;
            
            if (currentStock < item.quantity) {
                missing.push({ 
                    name: item.name, 
                    required: item.quantity, 
                    current: currentStock 
                });
                return false;
            }
            return true;
        });

        return { available: isAvailable, missing };
    }, [selectedPresale, products]);

    if (isCreatingNew) {
        return (
            <SalesModule 
                mode="PRESALE"
                products={products}
                clients={clients}
                categories={categories}
                purchasesHistory={purchasesHistory}
                stockMovements={stockMovements}
                bankAccounts={bankAccounts}
                locations={locations}
                onAddClient={onAddClient}
                onProcessSale={() => {}} // Not used in PRESALE mode
                cart={tempCart}
                setCart={setTempCart}
                client={tempClient}
                setClient={setTempClient}
                quotations={quotations}
                onLoadQuotation={() => {}} // Not typically used here
                onAddQuotation={onAddQuotation}
                onAddPresale={onAddPresale}
                systemBaseCurrency={systemBaseCurrency}
                branches={branches}
                globalStocks={globalStocks}
                currentBranchId={currentBranchId}
                onCancel={() => setIsCreatingNew(false)}
            />
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in">
            <style>{`
                @media print { body * { visibility: hidden; } #print-area-presale, #print-area-presale * { visibility: visible; } #print-area-presale { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; transform: scale(1) !important; } .no-print { display: none !important; } }
                .a4-preview-container { width: 800px; transform-origin: top center; } .tabular-nums { font-variant-numeric: tabular-nums; } @media (max-width: 900px) { .a4-preview-container { transform: scale(0.7); } } @media (max-width: 600px) { .a4-preview-container { transform: scale(0.45); } }
            `}</style>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Clock className="text-orange-500"/> Gestión de Preventas
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Pedidos confirmados pendientes de entrega o stock.
                    </p>
                </div>
                <button 
                    onClick={() => setIsCreatingNew(true)}
                    className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-orange-600 transition-all active:scale-95"
                >
                    <Plus size={16}/> Nueva Preventa
                </button>
            </div>

            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-sm text-slate-700 dark:text-white uppercase tracking-wider">Listado de Preventas Activas</h3>
                    </div>
                    
                    {presales.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                            <Clock size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                            <p className="font-medium uppercase text-xs">No hay preventas pendientes</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto p-4 space-y-3">
                            {presales.map(p => (
                                <div 
                                    key={p.id} 
                                    onClick={() => setSelectedPresale(p)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedPresale?.id === p.id ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:border-orange-200'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-black text-sm text-slate-800 dark:text-white uppercase">{p.clientName}</p>
                                            <p className="text-[10px] text-slate-400 font-mono font-bold">#{p.id}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded uppercase">
                                                Entrega: {p.deliveryDate}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-medium">{p.items.length} productos</span>
                                        <span className="font-black text-slate-700 dark:text-white">S/ {p.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DETALLE LATERAL */}
                <div className="w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    {selectedPresale ? (
                        <>
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                                <div>
                                    <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase">Detalle Preventa</h3>
                                    <p className="text-[10px] text-slate-400 font-bold">{selectedPresale.date} {selectedPresale.time}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setShowTicket(true)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500" title="Ver Pedido">
                                        <Printer size={18}/>
                                    </button>
                                    <button onClick={() => setSelectedPresale(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                                        <X size={18}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-auto p-6 space-y-4">
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar size={16} className="text-orange-600"/>
                                        <span className="text-xs font-black text-orange-700 dark:text-orange-400 uppercase">Fecha de Entrega Pactada</span>
                                    </div>
                                    <p className="text-xl font-black text-slate-800 dark:text-white">{selectedPresale.deliveryDate}</p>
                                </div>

                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Productos Comprometidos</h4>
                                    <div className="space-y-2">
                                        {selectedPresale.items.map((item, i) => (
                                            <div key={i} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div className="min-w-0 flex-1 pr-2">
                                                    <p className="text-xs font-bold text-slate-700 dark:text-white uppercase truncate">{item.name}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold">Cant: {item.quantity}</p>
                                                </div>
                                                <span className="text-xs font-black text-slate-800 dark:text-white">S/ {item.total.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ALERTAS DE STOCK */}
                                {!stockStatus.available && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 space-y-2 animate-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-xs uppercase">
                                            <AlertTriangle size={16}/> Stock Insuficiente
                                        </div>
                                        <div className="space-y-1">
                                            {stockStatus.missing.map((m, idx) => (
                                                <div key={idx} className="flex justify-between text-[10px] text-red-500 dark:text-red-300 font-bold uppercase">
                                                    <span className="truncate max-w-[180px]">{m.name}</span>
                                                    <span>Faltan: {m.required - m.current}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Total a Pagar</span>
                                    <span className="text-xl font-black text-slate-800 dark:text-white">S/ {selectedPresale.total.toFixed(2)}</span>
                                </div>
                                
                                {stockStatus.available ? (
                                    <button 
                                        onClick={() => onLoadPresale(selectedPresale)}
                                        className="w-full py-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
                                    >
                                        <CheckCircle2 size={18}/> Procesar Entrega
                                    </button>
                                ) : (
                                    <button 
                                        disabled
                                        className="w-full py-4 bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 cursor-not-allowed"
                                    >
                                        <PackageX size={18}/> Stock No Disponible
                                    </button>
                                )}

                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(selectedPresale.id, selectedPresale.clientName); }}
                                    className="w-full py-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/30 text-red-500 rounded-xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                >
                                    <Trash2 size={16}/> Eliminar Preventa
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-8 text-center opacity-50">
                            <FileText size={64} strokeWidth={1} className="mb-4"/>
                            <p className="font-bold uppercase text-xs">Seleccione una preventa para ver detalles</p>
                        </div>
                    )}
                </div>
            </div>

            {/* PREVIEW MODAL FOR PRESALE TICKET */}
            {showTicket && selectedPresale && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2500] flex items-center justify-center p-2 md:p-4">
                    <div className={`bg-zinc-100 p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 ${printFormat === 'A4' ? 'max-w-4xl w-full h-[90vh]' : 'max-w-[340px] w-full h-auto'}`}>
                        <div className="no-print bg-white p-2 rounded-xl border border-slate-200 flex gap-2 shadow-sm shrink-0">
                            <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Layout size={14}/> 80mm</button>
                            <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><FileText size={14}/> A4</button>
                        </div>
                        <div id="print-area-presale" className="flex-1 overflow-auto p-4 bg-zinc-200 no-scrollbar rounded-xl flex justify-center items-start">
                            {printFormat === '80mm' ? (
                                <div className="bg-white w-[280px] p-6 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums">
                                    <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                        <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                        <p className="text-[8px] text-black font-bold uppercase">NOTA DE PEDIDO (PREVENTA)</p>
                                    </div>
                                    <div className="mb-3 space-y-0.5 text-black">
                                        <div className="flex justify-between"><span>Pedido:</span> <span className="font-bold">#{selectedPresale.id}</span></div>
                                        <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{selectedPresale.date}</span></div>
                                        <div className="flex justify-between"><span>Entrega:</span> <span className="font-black">{selectedPresale.deliveryDate}</span></div>
                                        <div className="flex justify-between"><span>Cliente:</span> <span className="font-bold truncate max-w-[150px]">{selectedPresale.clientName}</span></div>
                                    </div>
                                    <div className="border-y border-dashed border-black py-2 mb-3">
                                        <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase text-black"><span>Articulo</span><span className="text-center">Cant</span><span className="text-right">Unit</span><span className="text-right">Total</span></div>
                                        {selectedPresale.items.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-[1fr_22px_40px_45px] mb-1 last:mb-0 leading-tight text-black">
                                                <span className="uppercase truncate pr-1 font-bold">{item.name}</span>
                                                <span className="text-center font-black">{item.quantity}</span>
                                                <span className="text-right font-medium">{item.price.toFixed(0)}</span>
                                                <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black font-black">
                                        <div className="flex justify-between text-xs"><span>TOTAL</span><span>{selectedPresale.total.toFixed(2)}</span></div>
                                    </div>
                                    <div className="mt-6 text-center italic text-[8px] text-black font-bold uppercase border-t border-black pt-2">Documento no válido como comprobante de pago</div>
                                </div>
                            ) : (
                                <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                                    <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                        <div className="space-y-1">
                                            <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1>
                                            <p className="font-bold text-slate-500 uppercase">NOTA DE PEDIDO - PREVENTA</p>
                                        </div>
                                        <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]">
                                            <p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1 uppercase">PEDIDO</p>
                                            <p className="font-mono text-lg font-black">{selectedPresale.id}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos del Cliente</p>
                                            <p className="font-black text-sm uppercase">{selectedPresale.clientName}</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                            <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Pedido</p>
                                            <p><strong>Fecha Registro:</strong> {selectedPresale.date}</p>
                                            <p className="text-lg text-orange-600 font-bold"><strong>Fecha Entrega:</strong> {selectedPresale.deliveryDate}</p>
                                        </div>
                                    </div>
                                    <table className="w-full border-collapse">
                                        <thead><tr className="bg-blue-600 text-white"><th className="p-2 text-left text-[8px] uppercase">SKU</th><th className="p-2 text-left text-[8px] uppercase">Descripción</th><th className="p-2 text-center text-[8px] uppercase">Cant.</th><th className="p-2 text-right text-[8px] uppercase">P. Unit</th><th className="p-2 text-right text-[8px] uppercase">Total</th></tr></thead>
                                        <tbody>
                                            {selectedPresale.items.map((item, i) => (
                                                <tr key={i} className="border-b border-slate-100">
                                                    <td className="p-2 font-mono">{item.code}</td>
                                                    <td className="p-2 uppercase">{item.name}</td>
                                                    <td className="p-2 text-center font-black">{item.quantity}</td>
                                                    <td className="p-2 text-right">{item.price.toFixed(2)}</td>
                                                    <td className="p-2 text-right font-black">{(item.price * item.quantity).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="flex justify-end pt-8">
                                        <div className="w-72 p-4 bg-blue-600 text-white rounded-xl text-right">
                                            <span className="font-black uppercase block text-[10px] mb-1">Total Pedido:</span>
                                            <span className="text-2xl font-black font-mono">S/ {selectedPresale.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="no-print flex gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200">
                            <button onClick={() => setShowTicket(false)} className="flex-1 py-3 bg-white text-slate-500 font-black rounded-xl text-[10px] uppercase border">Cerrar</button>
                            <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest"><Printer size={16}/> Imprimir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresaleModule;
