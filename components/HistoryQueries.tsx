
import React, { useState, useMemo } from 'react';
import { 
    Search, Calendar, FileText, ArrowRight, ArrowDownRight, ArrowUpRight, Package, 
    ShoppingCart, ShoppingBag, Eye, X, FileMinus, User, Clock, Printer, Layout, 
    FileText as FileIcon, Landmark, UserCog, History, CalendarDays, Filter, RotateCcw, 
    TrendingUp, TrendingDown, SearchCode, BadgeCheck, AlertCircle, ChevronRight, 
    Timer, Tag, Activity, Wrench, Star, FileScan 
} from 'lucide-react';
import { SaleRecord, PurchaseRecord, StockMovement, CashMovement, CartItem, Product } from '../types';

interface HistoryQueriesProps {
    salesHistory: SaleRecord[];
    purchasesHistory: PurchaseRecord[];
    stockMovements: StockMovement[];
    cashMovements: CashMovement[];
    initialTab: 'ventas' | 'compras' | 'kardex' | 'notas_credito' | 'ingresos' | 'egresos' | 'historial_producto';
    products?: Product[];
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

export const HistoryQueries: React.FC<HistoryQueriesProps> = ({ salesHistory, purchasesHistory, stockMovements, cashMovements, initialTab, products = [] }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedDetail, setSelectedDetail] = useState<any>(null);
    const [linkedRecord, setLinkedRecord] = useState<any>(null); 
    const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');
    
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [productSearch, setProductSearch] = useState('');

    const activeTab = initialTab;

    const getTitle = () => {
        switch(activeTab){
            case 'ventas': return { title: "Consulta de Ventas", icon: ShoppingCart, color: "emerald" };
            case 'compras': return { title: "Consulta de Compras", icon: ShoppingBag, color: "blue" };
            case 'ingresos': return { title: "Ingresos de Caja", icon: TrendingUp, color: "emerald" };
            case 'egresos': return { title: "Gastos Operativos", icon: TrendingDown, color: "rose" };
            case 'kardex': return { title: "Movimientos (Kardex)", icon: Package, color: "slate" };
            case 'notas_credito': return { title: "Historial Notas de Crédito", icon: FileMinus, color: "red" };
            case 'historial_producto': return { title: "Auditoría de Vida de Producto", icon: SearchCode, color: "indigo" };
        }
    }
    const { title, icon: Icon, color } = getTitle();

    const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const parseDate = (dateStr: string) => {
        const [day, month, year] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day).getTime();
    };

    const productSearchResults = useMemo(() => {
        if (!productSearch.trim()) return [];
        const term = normalize(productSearch);
        return products.filter(p => normalize(`${p.name} ${p.code}`).includes(term)).slice(0, 5);
    }, [products, productSearch]);

    const productHistoryStats = useMemo(() => {
        if (activeTab !== 'historial_producto' || !selectedProductId) return null;
        const movements = stockMovements
            .filter(m => m.productId === selectedProductId)
            .sort((a, b) => parseDate(a.date) - parseDate(b.date));
        const totalIn = movements.filter(m => m.type === 'ENTRADA').reduce((a, b) => a + b.quantity, 0);
        const totalOut = movements.filter(m => m.type === 'SALIDA').reduce((a, b) => a + b.quantity, 0);
        const product = products.find(p => p.id === selectedProductId);
        const creationDate = movements.length > 0 ? `${movements[0].date} ${movements[0].time}` : 'No disponible';
        const creationUser = movements.length > 0 ? movements[0].user : 'Sistema';
        return { totalIn, totalOut, currentStock: product?.stock || 0, name: product?.name, code: product?.code, creationDate, creationUser };
    }, [selectedProductId, stockMovements, products, activeTab]);

    const getFilteredList = () => {
        let list: any[] = [];
        if (activeTab === 'ventas') list = salesHistory;
        else if (activeTab === 'compras') list = purchasesHistory;
        else if (activeTab === 'ingresos') list = cashMovements.filter(m => m.type === 'Ingreso' && m.category?.toUpperCase() !== 'VENTA');
        else if (activeTab === 'egresos') list = cashMovements.filter(m => m.type === 'Egreso' && m.category?.toUpperCase() !== 'COMPRA');
        else if (activeTab === 'historial_producto') list = selectedProductId ? stockMovements.filter(m => m.productId === selectedProductId) : [];
        else if (activeTab === 'notas_credito') list = stockMovements.filter(m => m.reference.toUpperCase().includes('NC #'));
        else list = stockMovements;

        if (startDate || endDate) {
            list = list.filter(item => {
                const itemTime = parseDate(item.date);
                const start = startDate ? new Date(startDate).getTime() : 0;
                const end = endDate ? new Date(endDate).getTime() : Infinity;
                return itemTime >= start && itemTime <= end;
            });
        }

        const term = normalize(searchTerm);
        if (term && activeTab !== 'historial_producto') {
            const searchWords = term.split(" ").filter(w => w !== "");
            list = list.filter(item => {
                const targetString = normalize(`${item.id} ${item.reference || ""} ${item.clientName || ""} ${item.supplierName || ""} ${item.productName || ""} ${item.docType || ""} ${item.concept || ""}`);
                return searchWords.every(word => targetString.includes(word));
            });
        }

        return list.sort((a, b) => {
            const dateComp = parseDate(b.date) - parseDate(a.date);
            if (dateComp !== 0) return dateComp;
            return (b.time || "").localeCompare(a.time || "");
        });
    };

    const filteredData = getFilteredList();

    const handleViewDetail = (item: any) => {
        setSelectedDetail(item);
        setLinkedRecord(null);
        setPrintFormat('80mm'); 
        const ref = (item.reference || item.concept || "").toUpperCase();

        const ticketIdMatch = ref.match(/TICKET #([A-Z0-9-]+)/) || ref.match(/VENTA.*#([A-Z0-9-]+)/);
        const purchaseIdMatch = ref.match(/COMPRA.*#([A-Z0-9-]+)/) || ref.match(/ORDEN.*#([A-Z0-9-]+)/) || (item.id.startsWith('PUR-') ? [null, item.id] : null);
        const ncIdMatch = ref.match(/NC #([A-Z0-9-]+)/);
        const originalTicketFromNC = ref.match(/DEV\. TICKET #([A-Z0-9-]+)/);

        if (ref.includes('VENTA') || activeTab === 'ventas' || ncIdMatch || ref.includes('NC #')) {
            let searchId = activeTab === 'ventas' ? item.id : (ticketIdMatch ? ticketIdMatch[1] : (originalTicketFromNC ? originalTicketFromNC[1] : null));
            
            if (searchId) {
                const sale = salesHistory.find(s => s.id === searchId);
                if (sale) {
                    const isNC = (ncIdMatch || ref.includes('NC #'));
                    
                    // Explicitly typed itemsToShow to avoid CartItem union type inference issues
                    const itemsToShow: any[] = isNC && activeTab === 'historial_producto' 
                        ? [{ 
                            name: item.productName || 'PRODUCTO', 
                            quantity: item.quantity, 
                            price: sale.items.find(i => i.id === item.productId)?.price || 0,
                            code: products.find(p => p.id === item.productId)?.code || ''
                          }]
                        : sale.items;

                    // FIX: Typed 'acc' as number and 'curr' as any in reduce to ensure correct overload selection and avoid type mismatch with initial value 0.
                    setLinkedRecord({ 
                        ...sale, 
                        items: itemsToShow,
                        total: itemsToShow.reduce((acc: number, curr: any) => acc + (curr.price * curr.quantity), 0),
                        type: isNC ? 'CREDIT_NOTE' : 'SALE',
                        customLabel: isNC ? `NOTA DE CRÉDITO` : sale.docType,
                        displayId: ncIdMatch ? ncIdMatch[1] : (originalTicketFromNC ? `DEV-${originalTicketFromNC[1]}` : sale.id),
                        originalId: sale.id,
                        client: { name: sale.clientName, dni: '---' } 
                    });
                    return;
                }
            }
        }

        if (ref.includes('COMPRA') || activeTab === 'compras' || item.id.startsWith('PUR-')) {
            const searchId = activeTab === 'compras' ? item.id : (purchaseIdMatch ? purchaseIdMatch[1] : null);
            if (searchId) {
                const purchase = purchasesHistory.find(p => p.id === searchId);
                if (purchase) {
                    setLinkedRecord({ ...purchase, type: 'PURCHASE', supplier: { name: purchase.supplierName, ruc: '---' } });
                    return;
                }
            }
        }
    };

    const formatOpType = (reference: string) => {
        const ref = reference.toUpperCase();
        if (ref.includes('VENTA')) return { label: 'VENTA', color: 'rose', icon: ShoppingCart };
        if (ref.includes('COMPRA')) return { label: 'COMPRA', color: 'blue', icon: ShoppingBag };
        if (ref.includes('AJUSTE')) return { label: 'AJUSTE', color: 'amber', icon: FileScan };
        if (ref.includes('NC #') || ref.includes('DEVOLUCION')) return { label: 'DEVOLUCION', color: 'purple', icon: RotateCcw };
        if (ref.includes('INICIAL')) return { label: 'I. INICIAL', color: 'emerald', icon: Star };
        if (ref.includes('SERVICIO')) return { label: 'TALLER', color: 'indigo', icon: Wrench };
        return { label: 'MOVIMIENTO', color: 'slate', icon: History };
    };

    const resetFilters = () => {
        setSearchTerm(''); setStartDate(''); setEndDate('');
        setSelectedProductId(null); setProductSearch('');
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-area-history, #print-area-history * { visibility: visible; }
                    #print-area-history { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; transform: scale(1) !important; }
                    .no-print { display: none !important; }
                }
                .a4-preview-container { width: 800px; transform-origin: top center; }
                @media (max-width: 900px) { .a4-preview-container { transform: scale(0.7); } }
                @media (max-width: 600px) { .a4-preview-container { transform: scale(0.45); } }
                .tabular-nums { font-variant-numeric: tabular-nums; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-4 transition-all">
                <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 text-${color}-600 dark:text-${color}-400 rounded-xl`}><Icon size={20}/></div>
                    <h2 className="font-black text-sm text-slate-700 dark:text-white uppercase tracking-tighter mr-2">{title}</h2>
                </div>

                {activeTab === 'historial_producto' ? (
                    <div className="relative flex-1 min-w-[250px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" placeholder="Seleccione un producto para ver su hoja de vida..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs w-full focus:bg-white focus:border-indigo-500 font-bold" value={productSearch} onChange={e => setProductSearch(e.target.value)}/>
                        {productSearchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[500] overflow-hidden">
                                {productSearchResults.map(p => (
                                    <button key={p.id} onClick={() => { setSelectedProductId(p.id); setProductSearch(p.name); }} className="w-full p-4 text-left hover:bg-indigo-50 dark:hover:bg-slate-700 flex justify-between items-center border-b last:border-0 transition-colors border-slate-100 dark:border-slate-700 group">
                                        <div>
                                            <div className="font-black text-[10px] uppercase text-slate-700 dark:text-white group-hover:text-indigo-600">{p.name}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">SKU: {p.code} | STOCK: {p.stock}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500"/>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input type="text" placeholder="Buscar por Nro Doc, Cliente, Concepto..." className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs w-full outline-none focus:border-primary-500 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                )}

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 px-2"><Calendar size={14} className="text-slate-400"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rango:</span></div>
                    <input type="date" className="bg-white dark:bg-slate-800 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-slate-300">-</span>
                    <input type="date" className="bg-white dark:bg-slate-800 border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    <button onClick={resetFilters} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Limpiar"><RotateCcw size={14}/></button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-md text-slate-400 font-black uppercase tracking-widest border-b">
                            <tr>
                                <th className="px-6 py-4">Fecha / Hora</th>
                                <th className="px-6 py-4">{activeTab === 'historial_producto' ? 'Tipo Operación' : (activeTab === 'ventas' ? 'Cliente' : 'Concepto / Proveedor')}</th>
                                <th className="px-6 py-4">{activeTab === 'historial_producto' ? 'Detalle / Comprobante' : 'Documento / ID'}</th>
                                {activeTab === 'kardex' || activeTab === 'notas_credito' || activeTab === 'historial_producto' ? (
                                    <>
                                        <th className="px-6 py-4 text-center">Variación</th>
                                        <th className="px-6 py-4 text-right">Saldo Stock</th>
                                        <th className="px-6 py-4 text-center">Auditor</th>
                                        <th className="px-6 py-4 text-center"></th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4 text-right">Monto</th>
                                        <th className="px-6 py-4 text-center"></th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {activeTab === 'historial_producto' && !selectedProductId ? (
                                <tr><td colSpan={7} className="text-center py-24 text-slate-300 font-black uppercase tracking-[0.2em] italic flex flex-col items-center gap-6 opacity-30"><SearchCode size={64}/><p>Busque un producto arriba para ver su historial completo</p></td></tr>
                            ) : filteredData.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-20 text-slate-300 font-black uppercase tracking-[0.2em] italic">No se encontraron registros</td></tr>
                            ) : filteredData.map((item: any) => {
                                const op = activeTab === 'historial_producto' ? formatOpType(item.reference) : null;
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="font-black text-slate-700 dark:text-slate-200">{item.date}</div>
                                            <div className="text-[10px] opacity-70">{item.time}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'historial_producto' && op ? (
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase border border-${op.color}-100 bg-${op.color}-50 text-${op.color}-600`}>
                                                    <op.icon size={12}/> {op.label}
                                                </div>
                                            ) : (
                                                <div className="font-black text-slate-700 dark:text-white uppercase truncate max-w-[250px]">
                                                    {activeTab === 'ventas' ? item.clientName : (item.supplierName || item.concept)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-mono font-black text-slate-800 dark:text-white uppercase truncate max-w-[200px]">
                                                {activeTab === 'historial_producto' ? item.reference : (item.docType || item.id.substring(0,10))}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400">ID: #{item.id.substring(0,8)}</div>
                                        </td>
                                        {activeTab === 'kardex' || activeTab === 'notas_credito' || activeTab === 'historial_producto' ? (
                                            <>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase ${item.type === 'ENTRADA' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                                                        {item.type === 'ENTRADA' ? '+' : '-'}{item.quantity}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-white text-sm">
                                                    {item.currentStock} <span className="text-[9px] text-slate-400 uppercase">Und</span>
                                                </td>
                                                <td className="px-6 py-4 text-center text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.user}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetail(item)} className="text-slate-300 hover:text-primary-600 transition-all"><Eye size={18}/></button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{item.user}</td>
                                                <td className={`px-6 py-4 text-right font-black text-sm ${item.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                                                    {formatSymbol(item.currency)} {item.amount ? item.amount.toFixed(2) : (item.total ? item.total.toFixed(2) : '0.00')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => handleViewDetail(item)} className="text-slate-300 hover:text-primary-600 transition-all"><Eye size={18}/></button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedDetail && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
                    {/* MODAL CON ANCHO MÁXIMO DINÁMICO: 350px para ticket (80mm) y LG para A4 */}
                    <div className={`bg-zinc-100 p-4 shadow-2xl rounded-[2.5rem] animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 transition-all duration-500 ${printFormat === 'A4' ? 'lg:max-w-4xl w-full h-[90vh]' : 'max-w-[350px] w-full h-auto mx-auto'}`}>
                        <div className="no-print bg-white p-2 rounded-2xl border flex gap-2 shadow-sm shrink-0 items-center">
                            <div className="flex-1 flex gap-2">
                                <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Layout size={14}/> 80mm</button>
                                <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><FileIcon size={14}/> A4</button>
                            </div>
                            <button onClick={() => setSelectedDetail(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                        </div>
                        <div id="print-area-history" className="flex-1 overflow-auto p-4 bg-zinc-200 rounded-xl flex justify-center items-start no-scrollbar">
                             {linkedRecord ? (
                                 /* MOSTRAR TICKET ORIGINAL VINCULADO O NOTA DE CRÉDITO SINTÉTICA */
                                 printFormat === '80mm' ? (
                                    <div className="bg-white w-[270px] p-6 shadow-2xl font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums border-x border-slate-200">
                                        <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                            <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                            <p className="text-[8px] text-black font-bold uppercase">
                                                {linkedRecord.type === 'SALE' ? 'PUNTO DE VENTA' : 
                                                 linkedRecord.type === 'CREDIT_NOTE' ? 'VOUCHER DE DEVOLUCIÓN' : 
                                                 'LOGISTICA - COMPRAS'}
                                            </p>
                                        </div>
                                        <div className="mb-3 space-y-0.5 text-black">
                                            <div className="flex justify-between"><span>Comprobante:</span> <span className="font-bold">#{linkedRecord.displayId || linkedRecord.id}</span></div>
                                            <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{linkedRecord.date}</span></div>
                                            <div className="flex justify-between"><span>{linkedRecord.type === 'PURCHASE' ? 'Prov:' : 'Cliente:'}</span> <span className="font-bold truncate max-w-[110px]">{linkedRecord.client?.name || linkedRecord.supplier?.name}</span></div>
                                            <div className="flex justify-between"><span>Pago:</span> <span className="font-black uppercase">{linkedRecord.condition || 'CONTADO'}</span></div>
                                            {linkedRecord.type === 'CREDIT_NOTE' && <div className="text-[8px] font-black text-red-600 mt-1 uppercase border-t border-red-100 pt-1">Ref. Venta: #{linkedRecord.originalId}</div>}
                                        </div>
                                        <div className="border-y border-dashed border-black py-2 mb-3">
                                            <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase">
                                                <span>Articulo</span>
                                                <span className="text-center">Cant</span>
                                                <span className="text-right">Unit</span>
                                                <span className="text-right">Total</span>
                                            </div>
                                            {linkedRecord.items.map((item: any, idx: number) => (
                                                <div key={idx} className="grid grid-cols-[1fr_22px_40px_45px] mb-1 last:mb-0 leading-tight">
                                                    <span className="uppercase truncate pr-1">{item.name}</span>
                                                    <span className="text-center font-black">{item.quantity}</span>
                                                    <span className="text-right">{item.price.toFixed(0)}</span>
                                                    <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black">
                                            <div className="flex justify-between text-xs font-black">
                                                <span>TOTAL {formatSymbol(linkedRecord.currency)}</span>
                                                <span>{linkedRecord.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-6 text-center italic text-[7px] font-bold uppercase border-t border-black pt-4">Re-impresión de Auditoría</div>
                                    </div>
                                 ) : (
                                    <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                                        <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                            <div className="space-y-1">
                                                <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1>
                                                <p className="font-bold text-slate-500 uppercase">{linkedRecord.type === 'SALE' || linkedRecord.type === 'CREDIT_NOTE' ? 'SISTEMA INTEGRAL DE VENTAS' : 'GESTIÓN LOGÍSTICA E INVENTARIOS'}</p>
                                            </div>
                                            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]">
                                                <p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1 uppercase">{linkedRecord.customLabel || linkedRecord.docType?.toUpperCase() || 'DOCUMENTO'}</p>
                                                <p className="font-mono text-lg font-black">{linkedRecord.displayId || linkedRecord.id}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos de {linkedRecord.type === 'PURCHASE' ? 'Proveedor' : 'Cliente'}</p>
                                                <p className="font-black text-sm uppercase">{linkedRecord.client?.name || linkedRecord.supplier?.name}</p>
                                                <p><strong>Identificación:</strong> {linkedRecord.client?.dni || linkedRecord.supplier?.ruc}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información de Operación</p>
                                                <p><strong>Fecha:</strong> {linkedRecord.date}</p>
                                                <p><strong>Moneda:</strong> {formatSymbol(linkedRecord.currency)}</p>
                                                {linkedRecord.type === 'CREDIT_NOTE' && <p><strong>Ref. Original:</strong> #{linkedRecord.originalId}</p>}
                                            </div>
                                        </div>
                                        <table className="w-full border-collapse">
                                            <thead><tr className="bg-blue-600 text-white"><th className="p-2 text-left text-[8px] uppercase">SKU</th><th className="p-2 text-left text-[8px] uppercase">Descripción</th><th className="p-2 text-center text-[8px] uppercase">Cant.</th><th className="p-2 text-right text-[8px] uppercase">P. Unit</th><th className="p-2 text-right text-[8px] uppercase">Total</th></tr></thead>
                                            <tbody>
                                                {linkedRecord.items.map((item: any, i: number) => (
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
                                                <span className="font-black uppercase block text-[10px] mb-1">Total Operación:</span>
                                                <span className="text-2xl font-black font-mono">{formatSymbol(linkedRecord.currency)} {linkedRecord.total.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    </div>
                                 )
                             ) : (
                                 /* MOSTRAR VOUCHER DE AUDITORÍA INTERNO SI NO HAY VINCULACIÓN */
                                printFormat === '80mm' ? (
                                    <div className="bg-white w-[270px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums border-x border-slate-200">
                                        <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                            <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                            <p className="text-[8px] text-black font-bold uppercase">REPORTE AUDITORÍA</p>
                                        </div>
                                        <div className="mb-3 space-y-0.5 text-black">
                                            <div className="flex justify-between"><span>ID Doc:</span> <span className="font-bold">#{selectedDetail.id.substring(0,10)}</span></div>
                                            <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{selectedDetail.date}</span></div>
                                            <div className="flex justify-between"><span>Responsable:</span> <span className="font-bold uppercase">{selectedDetail.user}</span></div>
                                        </div>
                                        <div className="border-y border-dashed border-black py-4 mb-3 text-center">
                                            <div className="text-[8px] font-black uppercase mb-1">MOVIMIENTO:</div>
                                            <div className="text-xl font-black">{selectedDetail.amount ? `S/ ${selectedDetail.amount.toFixed(2)}` : `${selectedDetail.type === 'ENTRADA' ? '+' : '-'}${selectedDetail.quantity} Und`}</div>
                                            {selectedDetail.unitCost > 0 && (
                                                <div className="mt-2 py-2 border-t border-slate-100">
                                                    <div className="text-[9px] font-black uppercase text-slate-500">Costo Unit Apertura: S/ {selectedDetail.unitCost.toFixed(2)}</div>
                                                    <div className="text-xs font-black uppercase text-slate-800">Valorización Inicial: S/ {(selectedDetail.unitCost * selectedDetail.quantity).toFixed(2)}</div>
                                                </div>
                                            )}
                                            <p className="text-[9px] font-bold uppercase leading-tight mt-2 italic">"{selectedDetail.reference || selectedDetail.concept}"</p>
                                        </div>
                                        <div className="mt-6 text-center italic text-[7px] text-black font-bold uppercase border-t border-black pt-4">Documento Informativo de Auditoría</div>
                                    </div>
                                ) : (
                                    <div className="a4-preview-container bg-white p-8 md:p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0 w-full md:w-[800px]">
                                        <h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter border-b-2 border-blue-600 pb-4 mb-8">SapiSoft ERP - Copia de Auditoría</h1>
                                        <div className="grid grid-cols-2 gap-8 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2">Información del Registro</p>
                                                <p className="font-black text-sm uppercase">{selectedDetail.clientName || selectedDetail.supplierName || 'MOVIMIENTO INTERNO'}</p>
                                                <p><strong>Referencia:</strong> {selectedDetail.reference || selectedDetail.concept || '---'}</p>
                                                <p><strong>ID Sistema:</strong> #{selectedDetail.id}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
                                                <p className="text-[9px] font-black text-blue-600 uppercase mb-2">Detalles Temporales</p>
                                                <p><strong>Fecha Registro:</strong> {selectedDetail.date}</p>
                                                <p><strong>Hora:</strong> {selectedDetail.time}</p>
                                                <p><strong>Operador:</strong> {selectedDetail.user.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Magnitud Involucrada</p>
                                            <div className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter mb-4">
                                                {selectedDetail.amount ? `S/ ${selectedDetail.amount.toFixed(2)}` : `${selectedDetail.type === 'ENTRADA' ? '+' : '-'}${selectedDetail.quantity}`}
                                            </div>
                                            {!selectedDetail.amount && <p className="text-sm font-black text-slate-400 uppercase mb-6">Unidades de Almacén</p>}
                                            
                                            {selectedDetail.unitCost > 0 && (
                                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-6 w-full max-w-sm">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Valorización de Entrada</p>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Costo Unitario:</span>
                                                        <span className="text-lg font-black text-slate-800">S/ {selectedDetail.unitCost.toFixed(2)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                                        <span className="text-xs font-bold text-slate-500 uppercase">Valor Total:</span>
                                                        <span className="text-2xl font-black text-emerald-600">S/ {(selectedDetail.unitCost * selectedDetail.quantity).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="w-32 h-1 bg-blue-600 rounded-full mb-6"></div>
                                            <p className="text-xl font-bold text-slate-500 uppercase italic">"{selectedDetail.reference || selectedDetail.concept || 'Sin descripción'}"</p>
                                        </div>
                                        <div className="mt-auto pt-16 flex flex-col items-center opacity-30">
                                            <p className="text-[8px] uppercase font-bold tracking-widest">SISTEMA SAPISOFT CLOUD v4.0 - DOCUMENTO DE AUDITORÍA</p>
                                        </div>
                                    </div>
                                )
                             )}
                        </div>
                        <div className="no-print p-4 bg-white rounded-xl border border-slate-200 flex gap-2 shrink-0">
                            <button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-xl hover:bg-blue-700 transition-all uppercase tracking-widest"><Printer size={16}/> Imprimir Copia</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoryQueries;
