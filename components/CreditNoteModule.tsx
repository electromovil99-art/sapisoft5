
import React, { useState, useRef } from 'react';
import { Search, FileMinus, RotateCcw, AlertTriangle, CheckCircle, Package, ArrowRight, X, Banknote, QrCode, CreditCard, Landmark, Wallet, List, ShoppingCart, Calendar, User, Plus, FileText } from 'lucide-react';
import { SaleRecord, PaymentMethodType, PaymentBreakdown, BankAccount } from '../types';

interface CreditNoteModuleProps {
    salesHistory: SaleRecord[];
    onProcessCreditNote: (originalSaleId: string, itemsToReturn: { itemId: string, quantity: number }[], totalRefund: number, breakdown: PaymentBreakdown, detailedRefunds?: any[]) => void;
    bankAccounts: BankAccount[];
}

interface RefundDetail { id: string; method: PaymentMethodType; amount: number; reference?: string; accountId?: string; }

const CreditNoteModule: React.FC<CreditNoteModuleProps> = ({ salesHistory, onProcessCreditNote, bankAccounts }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SaleRecord[]>([]);
    const [foundSale, setFoundSale] = useState<SaleRecord | null>(null);
    const [selectedItems, setSelectedItems] = useState<{ [itemId: string]: number }>({}); 
    
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundList, setRefundList] = useState<RefundDetail[]>([]);
    const [currentRefund, setCurrentRefund] = useState<{ method: PaymentMethodType; amount: string; reference: string; accountId: string; }>({ method: 'Efectivo', amount: '', reference: '', accountId: '' });
    const refundAmountRef = useRef<HTMLInputElement>(null);

    // Helper de normalización para búsqueda inteligente
    const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const handleSearch = () => {
        const term = normalize(searchTerm.trim());
        if(!term) return;

        const searchWords = term.split(" ").filter(w => w !== "");
        const matches = salesHistory.filter(s => {
            const targetString = normalize(`${s.id} ${s.docType} ${s.clientName} ${s.items.map(i => i.name).join(" ")}`);
            return searchWords.every(word => targetString.includes(word));
        });
        
        if (matches.length === 0) { 
            alert("No se encontraron ventas con ese criterio."); 
            setFoundSale(null); 
            setSearchResults([]); 
        } 
        else if (matches.length === 1) { 
            handleSelectSale(matches[0]); 
            setSearchResults([]); 
        } 
        else { 
            setSearchResults(matches); 
            setFoundSale(null); 
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch();
        }
    };

    const handleSelectSale = (sale: SaleRecord) => {
        setFoundSale(sale);
        setSearchResults([]);
        const initialSelection: { [key: string]: number } = {};
        sale.items.forEach(item => { initialSelection[item.id] = 0; });
        setSelectedItems(initialSelection);
    };

    const handleQuantityChange = (itemId: string, maxQty: number, newQty: number) => {
        if (newQty < 0 || newQty > maxQty) return;
        setSelectedItems(prev => ({ ...prev, [itemId]: newQty }));
    };

    const calculateRefundTotal = () => {
        if (!foundSale) return 0;
        return foundSale.items.reduce((acc, item) => { 
            const qtyToReturn = selectedItems[item.id] || 0; 
            return acc + (item.price * qtyToReturn); 
        }, 0);
    };

    const handlePrepareRefund = () => {
        const total = calculateRefundTotal();
        if (total <= 0) {
            alert("Seleccione items para devolver.");
            return;
        }
        setRefundList([]);
        setCurrentRefund({ method: 'Efectivo', amount: total.toFixed(2), reference: '', accountId: '' });
        setShowRefundModal(true);
        setTimeout(() => refundAmountRef.current?.focus(), 100);
    };

    const handleAddRefund = () => {
        const amountVal = parseFloat(currentRefund.amount);
        if (isNaN(amountVal) || amountVal <= 0) return alert("Monto inválido");
        const totalToRefund = calculateRefundTotal();
        const currentTotalRefunded = refundList.reduce((a,r) => a + r.amount, 0);
        const remainingToRefund = Math.max(0, totalToRefund - currentTotalRefunded);

        if (amountVal > remainingToRefund + 0.1) return alert("El monto excede el total a devolver");
        if (currentRefund.method !== 'Efectivo' && currentRefund.method !== 'Saldo Favor' && !currentRefund.accountId) {
            return alert("Debe seleccionar la CUENTA DE ORIGEN para este medio de devolución.");
        }
        if ((currentRefund.method === 'Yape' || currentRefund.method === 'Tarjeta' || currentRefund.method === 'Yape/Plin' || currentRefund.method === 'Transferencia') && !currentRefund.reference) {
            return alert("Debe ingresar el número de operación o referencia.");
        }

        const newRefund: RefundDetail = { 
            id: Math.random().toString(), method: currentRefund.method, amount: amountVal, reference: currentRefund.reference, accountId: currentRefund.accountId
        };
        setRefundList([...refundList, newRefund]);
        const nextRemaining = Math.max(0, totalToRefund - (currentTotalRefunded + amountVal));
        setCurrentRefund({ ...currentRefund, amount: nextRemaining > 0 ? nextRemaining.toFixed(2) : '', reference: '', accountId: '' });
        if (refundAmountRef.current) refundAmountRef.current.focus();
    };

    const handleFinalizeCreditNote = () => {
        if (!foundSale) return;
        const totalToRefund = calculateRefundTotal();
        const totalRefunded = refundList.reduce((acc, r) => acc + r.amount, 0);
        if (Math.abs(totalRefunded - totalToRefund) > 0.1) { alert("Debe asignar el monto total de la devolución."); return; }
        
        const breakdown: PaymentBreakdown = { 
            cash: refundList.filter(p => p.method === 'Efectivo').reduce((acc, p) => acc + p.amount, 0), 
            yape: refundList.filter(p => p.method === 'Yape' || p.method === 'Plin' || p.method === 'Yape/Plin').reduce((acc, p) => acc + p.amount, 0), 
            card: refundList.filter(p => p.method === 'Tarjeta').reduce((acc, p) => acc + p.amount, 0), 
            bank: refundList.filter(p => p.method === 'Deposito' || p.method === 'Transferencia').reduce((acc, p) => acc + p.amount, 0), 
            wallet: refundList.filter(p => p.method === 'Saldo Favor').reduce((acc, p) => acc + p.amount, 0)
        };
        const itemsToReturn = Object.entries(selectedItems)
            .filter(([_, qty]) => (qty as number) > 0)
            .map(([itemId, quantity]) => ({ itemId, quantity: quantity as number }));
            
        onProcessCreditNote(foundSale.id, itemsToReturn, totalToRefund, breakdown, refundList);
        setShowRefundModal(false); setFoundSale(null); setSearchTerm(''); setSelectedItems({});
    };

    const totalToRefund = calculateRefundTotal();
    const remainingToRefund = Math.max(0, totalToRefund - refundList.reduce((a,r)=>a+r.amount, 0));

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-red-100 text-red-600 rounded-2xl"><FileMinus size={24}/></div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Notas de Crédito</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Emisión de Notas de Crédito y Devoluciones de Almacén</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20}/>
                        <input 
                            type="text" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none text-slate-900 dark:text-white font-bold transition-all" 
                            placeholder="Buscar por Ticket, Cliente, DNI o Producto..." 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <button onClick={handleSearch} className="bg-slate-800 dark:bg-slate-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-900 shadow-lg flex items-center gap-2 transition-all active:scale-95">
                        <Search size={18}/> Buscar Venta
                    </button>
                </div>
            </div>

            {searchResults.length > 0 && !foundSale && (
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center px-6">
                        <h3 className="font-black text-xs text-slate-700 dark:text-white flex items-center gap-2 uppercase tracking-widest"><List size={16} className="text-blue-500"/> Resultados Encontrados ({searchResults.length})</h3>
                        <button onClick={() => setSearchResults([])} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18}/></button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 dark:bg-slate-700 text-slate-400 font-black uppercase text-[10px] tracking-widest border-b">
                                <tr><th>Fecha</th><th>Documento</th><th>Cliente</th><th className="text-right">Total</th><th className="text-center">Acción</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {searchResults.map(sale => (
                                    <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4"><div className="font-bold text-slate-700 dark:text-slate-200">{sale.date}</div><div className="text-[10px] text-slate-400">{sale.time}</div></td>
                                        <td className="px-6 py-4"><div className="font-black text-xs text-slate-800 dark:text-white">{sale.docType}</div><div className="text-[10px] text-slate-400 font-mono">#{sale.id}</div></td>
                                        <td className="px-6 py-4 font-bold uppercase text-slate-700 dark:text-slate-300">{sale.clientName}</td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">S/ {sale.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center"><button onClick={() => handleSelectSale(sale)} className="px-6 py-2 bg-primary-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 transition-all active:scale-95 shadow-md">Seleccionar</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {foundSale && (
                <div className="flex-1 flex gap-6 min-h-0 animate-in fade-in">
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center px-8">
                            <div>
                                <h3 className="font-black text-xs text-slate-700 dark:text-white uppercase tracking-widest mb-1">Items de Venta Original</h3>
                                <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase">
                                    <span className="flex items-center gap-1"><ShoppingCart size={12}/> #{foundSale.id}</span>
                                    <span className="flex items-center gap-1"><User size={12}/> {foundSale.clientName}</span>
                                    <span className="flex items-center gap-1"><Calendar size={12}/> {foundSale.date}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pagado</p>
                                <p className="font-black text-slate-800 dark:text-white text-lg">S/ {foundSale.total.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            <table className="w-full text-sm">
                                <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr><th className="pb-2 text-left">Producto</th><th className="pb-2 text-center">Comprado</th><th className="pb-2 text-right">Precio</th><th className="pb-2 text-center w-32">Devolver</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {foundSale.items.map(item => (
                                        <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{item.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono uppercase">{item.code}</div>
                                            </td>
                                            <td className="py-4 text-center text-slate-600 dark:text-slate-400 font-black">{item.quantity}</td>
                                            <td className="py-4 text-right text-slate-600 dark:text-slate-400 font-bold">S/ {item.price.toFixed(2)}</td>
                                            <td className="py-4 text-center">
                                                <div className="flex items-center justify-center gap-3 bg-slate-100 dark:bg-slate-700 rounded-xl p-1 w-fit mx-auto">
                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity, (selectedItems[item.id] || 0) - 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm text-red-500 font-black active:scale-90 transition-all">-</button>
                                                    <span className="w-6 text-center font-black text-slate-800 dark:text-white">{selectedItems[item.id] || 0}</span>
                                                    <button onClick={() => handleQuantityChange(item.id, item.quantity, (selectedItems[item.id] || 0) + 1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-600 rounded-lg shadow-sm text-emerald-500 font-black active:scale-90 transition-all">+</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <button onClick={() => {setFoundSale(null); setSearchTerm('');}} className="text-[10px] font-black text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 uppercase flex items-center gap-2 transition-colors">
                                <ArrowRight size={14} className="rotate-180"/> Buscar otra venta
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reembolso Total</p>
                                    <p className="text-xl font-black text-red-600">S/ {totalToRefund.toFixed(2)}</p>
                                </div>
                                <button onClick={handlePrepareRefund} disabled={totalToRefund <= 0} className="px-10 py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-red-100 dark:shadow-none hover:bg-red-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">Continuar Reembolso</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showRefundModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-[800px] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95">
                        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 bg-red-50/50 dark:bg-red-950/20">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><RotateCcw size={20} className="text-red-500"/> Confirmar Reembolso al Cliente</h3>
                            <button onClick={() => setShowRefundModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-8 flex gap-8 bg-slate-50/30 dark:bg-slate-900/50 flex-1 overflow-y-auto">
                            <div className="flex-1 flex flex-col">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><List size={14}/> Desglose de Fondos a Devolver</h4>
                                <div className="flex-1 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2 overflow-y-auto">
                                    {refundList.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 text-slate-400">
                                            <Banknote size={40}/>
                                            <p className="text-[9px] font-black uppercase mt-2">Sin pagos agregados</p>
                                        </div>
                                    ) : refundList.map((p) => (
                                        <div key={p.id} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-700 rounded-xl border border-slate-100 dark:border-slate-600 group shadow-sm">
                                            <div>
                                                <span className="font-black text-xs uppercase text-slate-700 dark:text-white">{p.method}</span>
                                                {p.reference && <p className="text-[8px] font-mono text-slate-400 uppercase tracking-tighter">REF: {p.reference}</p>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-black text-sm text-red-600">- S/ {p.amount.toFixed(2)}</span>
                                                <button onClick={() => setRefundList(refundList.filter(r => r.id !== p.id))} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><X size={18}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 p-5 bg-slate-900 rounded-2xl shadow-inner">
                                    <div className="flex justify-between items-center text-xs font-black">
                                        <span className="text-slate-400 uppercase tracking-widest">Saldo Restante:</span>
                                        <span className={`text-2xl ${remainingToRefund > 0.05 ? 'text-red-500' : 'text-emerald-500'} tracking-tighter`}>S/ {remainingToRefund.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-[320px] flex flex-col gap-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Método de Devolución</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Efectivo', 'Transferencia', 'Yape/Plin', 'Tarjeta', 'Deposito', 'Saldo Favor'].map(m => (
                                        <button 
                                            key={m} 
                                            onClick={() => setCurrentRefund({...currentRefund, method: m as any, reference: '', accountId: ''})} 
                                            className={`py-3 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${currentRefund.method === m ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : 'bg-white dark:bg-slate-700 text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                
                                {currentRefund.method !== 'Efectivo' && currentRefund.method !== 'Saldo Favor' && (
                                    <div className="space-y-1 animate-in slide-in-from-top-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cuenta Origen (Obligatorio)</label>
                                        <select className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none" value={currentRefund.accountId} onChange={e => setCurrentRefund({...currentRefund, accountId: e.target.value})}>
                                            <option value="">-- SELECCIONAR CUENTA --</option>
                                            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} - {b.accountNumber}</option>)}
                                        </select>
                                    </div>
                                )}

                                {(currentRefund.method.includes('Yape') || currentRefund.method === 'Tarjeta' || currentRefund.method === 'Transferencia') && (
                                    <div className="space-y-1 animate-in slide-in-from-top-1">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nro. Operación / Ref</label>
                                        <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-red-500 transition-all" placeholder="EJ. 123456" value={currentRefund.reference} onChange={e => setCurrentRefund({...currentRefund, reference: e.target.value})} />
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Monto a Entregar</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 italic">S/</span>
                                        <input 
                                            ref={refundAmountRef}
                                            type="number" 
                                            className="w-full pl-12 p-4 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-2xl text-4xl font-black text-slate-800 dark:text-white outline-none focus:border-red-500 shadow-inner" 
                                            placeholder="0.00" 
                                            value={currentRefund.amount} 
                                            onChange={e => setCurrentRefund({...currentRefund, amount: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <button onClick={handleAddRefund} className="w-full py-4 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"><Plus size={16}/> Agregar Reembolso</button>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={() => setShowRefundModal(false)} className="px-8 py-3 text-slate-500 font-black uppercase text-[10px] transition-colors hover:bg-slate-200 rounded-xl">Cancelar</button>
                            <button onClick={handleFinalizeCreditNote} disabled={remainingToRefund > 0.05} className="px-12 py-3 bg-red-600 text-white font-black rounded-xl text-[10px] uppercase shadow-lg shadow-red-100 dark:shadow-none hover:bg-red-700 transition-all disabled:opacity-30 flex items-center gap-2"><CheckCircle size={18}/> Emitir Nota de Crédito</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreditNoteModule;
