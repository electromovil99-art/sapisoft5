
import React, { useState, useMemo, useRef } from 'react';
import { Search, Building2, FileText, CheckCircle, ChevronRight, ChevronUp, ChevronDown, X, Calculator, Calendar, DollarSign, Wallet, CreditCard, Banknote, QrCode, Landmark, Truck, Lock, ShoppingCart, History, Clock, ArrowDownLeft } from 'lucide-react';
import { Supplier, PurchaseRecord, PaymentMethodType, BankAccount, CartItem } from '../types';

interface AccountsPayableProps {
    suppliers: Supplier[];
    purchasesHistory: PurchaseRecord[];
    bankAccounts: BankAccount[];
    onRegisterPayment: (purchaseId: string, amount: number, paymentDetails: any, allocations?: Record<string, number>) => void;
    isCashBoxOpen: boolean;
}

const AccountsPayableModule: React.FC<AccountsPayableProps> = ({ suppliers, purchasesHistory, bankAccounts, onRegisterPayment, isCashBoxOpen }) => {
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Payment Logic State
    // Stores allocation per item per ticket. Key: `${purchaseId}_${itemId}`, Value: amount
    const [itemAllocations, setItemAllocations] = useState<Record<string, number>>({});

    // UI State for Payment Form
    const [receivedAmountInput, setReceivedAmountInput] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    
    // UI State
    const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

    // Toggle for History View in Main Screen
    const [showHistoryForTicket, setShowHistoryForTicket] = useState<string | null>(null);

    const pendingPurchases = useMemo(() => {
        return purchasesHistory.filter(p => {
             const paid = (p.detailedPayments || []).reduce((acc: number, pay: any) => acc + (Number(pay.amount) || 0), 0);
             return p.paymentCondition === 'Credito' && (p.total - paid) > 0.01;
        });
    }, [purchasesHistory]);

    const supplierDebts = useMemo(() => {
        if (!selectedSupplier) return [];
        return pendingPurchases.filter(p => p.supplierName === selectedSupplier.name);
    }, [selectedSupplier, pendingPurchases]);

    // Calculate total allocated to items (Debt Payment)
    const totalAllocated = useMemo(() => {
        return Object.values(itemAllocations).reduce((acc: number, val: number) => acc + val, 0);
    }, [itemAllocations]);

    // Calculate Wallet Excess
    const totalReceived = parseFloat(receivedAmountInput) || 0;
    const walletExcess = Math.max(0, totalReceived - totalAllocated);

    const filteredSuppliers = useMemo(() => {
        const suppliersWithDebt = new Set(pendingPurchases.map(p => p.supplierName));
        return suppliers.filter(s => 
            suppliersWithDebt.has(s.name) && 
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.ruc.includes(searchTerm))
        );
    }, [suppliers, pendingPurchases, searchTerm]);

    const toggleTicketExpand = (ticketId: string) => {
        setExpandedTickets(prev => ({ ...prev, [ticketId]: !prev[ticketId] }));
    };

    // Calculate how much has been paid for a specific item across all payments
    const getItemPaidAmount = (purchase: PurchaseRecord, itemId: string) => {
        if (!purchase.detailedPayments) return 0;
        return purchase.detailedPayments.reduce((acc, pay: any) => {
            if (pay.allocations && pay.allocations[itemId]) {
                return acc + pay.allocations[itemId];
            }
            return acc;
        }, 0);
    };

    const handleAllocateItem = (purchaseId: string, item: CartItem, amountStr: string) => {
        let amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) amount = 0;

        // Calculate remaining balance for the whole purchase
        const purchase = supplierDebts.find(p => p.id === purchaseId);
        if (!purchase) return;

        // Calculate item specific balance (STRICT LIMIT)
        const itemPaid = getItemPaidAmount(purchase, item.id);
        const itemBalance = item.total - itemPaid;

        // Force amount to not exceed item balance
        if (amount > itemBalance + 0.001) {
            amount = itemBalance;
        }

        setItemAllocations(prev => {
            if (amount <= 0) {
                const copy = { ...prev };
                delete copy[`${purchaseId}_${item.id}`];
                return copy;
            }
            return { ...prev, [`${purchaseId}_${item.id}`]: amount };
        });
    };

    const handleConfirmPayment = () => {
        if (totalAllocated <= 0) return alert("Debe asignar montos a los items para pagar.");
        if (totalReceived < totalAllocated) return alert("El monto de pago no cubre lo asignado.");

        if (paymentMethod !== 'Efectivo' && !paymentAccountId && paymentMethod !== 'Saldo Favor') return alert("Seleccione cuenta bancaria de origen.");
        
        if (paymentMethod === 'Efectivo' && !isCashBoxOpen) {
            return alert("⛔ CAJA CERRADA: No puede realizar pagos en efectivo. Abra la caja primero.");
        }

        // Group allocations by Purchase
        const paymentsByPurchase: Record<string, Record<string, number>> = {};
        const totalByPurchase: Record<string, number> = {};

        Object.entries(itemAllocations).forEach(([key, amount]: [string, number]) => {
            const [purchaseId, itemId] = key.split('_');
            if (!paymentsByPurchase[purchaseId]) paymentsByPurchase[purchaseId] = {};
            paymentsByPurchase[purchaseId][itemId] = amount;
            totalByPurchase[purchaseId] = (totalByPurchase[purchaseId] || 0) + amount;
        });

        const purchasesToPay = Object.entries(totalByPurchase);
        
        // Similar multi-ticket logic as AR module
        purchasesToPay.forEach(([purchaseId, allocatedAmt], index) => {
            if (allocatedAmt > 0) {
                const isLast = index === purchasesToPay.length - 1;
                const cashToRegister = allocatedAmt + (isLast ? walletExcess : 0);

                const details = {
                    id: Math.random().toString(),
                    method: paymentMethod,
                    amount: cashToRegister, // Total cash movement
                    reference: paymentReference,
                    accountId: paymentAccountId,
                    date: new Date().toLocaleDateString('es-PE'),
                    time: new Date().toLocaleTimeString('es-PE'),
                    note: "Pago detallado por items"
                };

                const purchaseAllocations = paymentsByPurchase[purchaseId];

                // Handler receives allocatedAmt as DEBT reduction, details.amount as CASH OUT
                onRegisterPayment(purchaseId, allocatedAmt, details, purchaseAllocations);
            }
        });

        alert(`Pago registrado exitosamente para ${purchasesToPay.length} documento(s).`);

        setShowPaymentModal(false);
        setItemAllocations({});
        setReceivedAmountInput('');
        setPaymentReference('');
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in duration-500">
            {/* Left: Supplier List */}
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <Truck className="text-orange-500"/> Proveedores por Pagar
                    </h2>
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-orange-500"
                            placeholder="Buscar proveedor..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredSuppliers.map(s => {
                        const debt = pendingPurchases.filter(p => p.supplierName === s.name).reduce((acc, p) => {
                            const paid = (p.detailedPayments || []).reduce((a: number, pay: any) => a + (Number(pay.amount) || 0), 0);
                            return acc + (p.total - paid);
                        }, 0);
                        
                        return (
                            <div 
                                key={s.id} 
                                onClick={() => setSelectedSupplier(s)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedSupplier?.id === s.id ? 'bg-orange-50 border-orange-500 shadow-md ring-1 ring-orange-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:border-orange-200'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase truncate">{s.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{s.ruc}</p>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${selectedSupplier?.id === s.id ? 'rotate-90 text-orange-500' : ''}`}/>
                                </div>
                                <div className="mt-3 flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">A Pagar</span>
                                    <span className="text-sm font-black text-red-500">S/ {debt.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Debts & Payment */}
            <div className="flex-1 flex flex-col gap-4">
                {selectedSupplier ? (
                    <>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedSupplier.name}</h3>
                                <p className="text-xs font-bold text-slate-400">Facturas Pendientes</p>
                            </div>
                            <button 
                                onClick={() => { setItemAllocations({}); setReceivedAmountInput(''); setShowPaymentModal(true); }}
                                className="bg-orange-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <DollarSign size={16}/> Pagar Deuda
                            </button>
                        </div>

                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-auto p-6 space-y-4">
                                {supplierDebts.map(debt => {
                                    const paid = (debt.detailedPayments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
                                    const balance = debt.total - paid;
                                    const isExpanded = showHistoryForTicket === debt.id;

                                    return (
                                        <div key={debt.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-md transition-all">
                                            <div className="p-4 bg-white dark:bg-slate-900 flex justify-between items-center">
                                                <div className="flex gap-4 items-center">
                                                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                                                        <FileText size={20}/>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-sm text-slate-800 dark:text-white uppercase">{debt.docType}</span>
                                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Ref: {debt.id.substring(0,8)}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{debt.date} • {debt.time}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                                        <p className="font-bold text-slate-700 dark:text-white">S/ {debt.total.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pagado</p>
                                                        <p className="font-bold text-emerald-600">S/ {paid.toFixed(2)}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                                                        <p className="font-black text-lg text-red-500">S/ {balance.toFixed(2)}</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => setShowHistoryForTicket(isExpanded ? null : debt.id)} 
                                                        className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                                        title="Ver Historial de Pagos"
                                                    >
                                                        <History size={18}/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* EXPANDED HISTORY VIEW */}
                                            {isExpanded && (
                                                <div className="bg-slate-50 dark:bg-slate-950/50 p-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={12}/> Historial de Pagos</h4>
                                                    
                                                    {(!debt.detailedPayments || debt.detailedPayments.length === 0) ? (
                                                        <p className="text-xs text-slate-400 italic">No hay pagos registrados.</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {debt.detailedPayments.map((p: any, i: number) => (
                                                                <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={14}/></div>
                                                                        <div>
                                                                            <p className="text-[10px] font-black text-slate-700 dark:text-white uppercase">{p.method} {p.bankName ? `(${p.bankName})` : ''}</p>
                                                                            <p className="text-[9px] text-slate-400">{p.date} {p.time}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="font-black text-xs text-emerald-600">+ S/ {p.amount.toFixed(2)}</span>
                                                                        {p.reference && <p className="text-[8px] font-mono text-slate-400">REF: {p.reference}</p>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                        <FileText size={64} strokeWidth={1} className="mb-4 opacity-50"/>
                        <p className="font-black uppercase text-xs tracking-widest">Seleccione un proveedor para ver su cuenta corriente</p>
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedSupplier && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-4xl h-[90vh] rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Wallet size={24} className="text-orange-500"/> Realizar Pago Detallado
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Proveedor: {selectedSupplier.name}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: Input & Method */}
                            <div className="w-[340px] bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-700 p-8 flex flex-col gap-6 overflow-y-auto">
                                
                                {paymentMethod === 'Efectivo' && !isCashBoxOpen && (
                                    <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-2xl text-[10px] font-bold uppercase border border-red-200 dark:border-red-800 flex items-center gap-2">
                                        <Lock size={20}/>
                                        Caja Cerrada. No se puede pagar en efectivo.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Método de Pago</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'Efectivo', icon: Banknote },
                                            { id: 'Yape', icon: QrCode },
                                            { id: 'Tarjeta', icon: CreditCard },
                                            { id: 'Transferencia', icon: Landmark }
                                        ].map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === m.id ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-slate-200 text-slate-500 hover:border-orange-200'}`}
                                            >
                                                <m.icon size={18}/>
                                                <span className="text-[9px] font-black uppercase">{m.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {paymentMethod !== 'Efectivo' && (
                                    <div className="space-y-4 animate-in slide-in-from-top-2">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cuenta Origen</label>
                                            <select className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold outline-none" value={paymentAccountId} onChange={e => setPaymentAccountId(e.target.value)}>
                                                <option value="">-- Seleccionar --</option>
                                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nro. Operación</label>
                                            <input type="text" className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold outline-none" value={paymentReference} onChange={e => setPaymentReference(e.target.value)} placeholder="Ref..." />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monto Pagado</label>
                                     <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">S/</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-2xl font-black text-slate-800 dark:text-white outline-none focus:border-orange-500 transition-colors"
                                            value={receivedAmountInput}
                                            onChange={e => setReceivedAmountInput(e.target.value)}
                                            placeholder="0.00"
                                        />
                                     </div>
                                </div>

                                <div className="mt-auto bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-bold text-slate-500 uppercase">Asignado a Deuda:</span>
                                        <span className="font-black text-slate-800 dark:text-white">S/ {totalAllocated.toFixed(2)}</span>
                                    </div>
                                    {walletExcess > 0 && (
                                        <div className="flex justify-between items-center text-xs text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                                            <span className="uppercase flex items-center gap-1"><ArrowDownLeft size={12}/> A Saldo Favor:</span>
                                            <span>S/ {walletExcess.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={totalAllocated <= 0 || (paymentMethod === 'Efectivo' && !isCashBoxOpen)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Pago
                                </button>
                            </div>

                            {/* Right: Detailed List */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                                <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> Seleccione Items a Pagar</h4>
                                </div>
                                <div className="flex-1 overflow-auto p-6 space-y-4">
                                    {supplierDebts.map(debt => {
                                        const paid = (debt.detailedPayments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
                                        const balance = debt.total - paid;
                                        const isExpanded = expandedTickets[debt.id];

                                        return (
                                            <div key={debt.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all shadow-sm hover:shadow-md">
                                                <div 
                                                    className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900'}`}
                                                    onClick={() => toggleTicketExpand(debt.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                                                            {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-xs text-slate-800 dark:text-white uppercase">{debt.docType} #{debt.id.substring(0,8)}</p>
                                                            <p className="text-[10px] font-bold text-slate-400">{debt.date} • Total: S/ {debt.total.toFixed(2)}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Saldo Pendiente</p>
                                                        <p className="text-sm font-black text-red-500">S/ {balance.toFixed(2)}</p>
                                                    </div>
                                                </div>

                                                {isExpanded && (
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 space-y-2 animate-in slide-in-from-top-2">
                                                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px_100px] gap-4 px-2 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                                            <span>Producto</span>
                                                            <span className="text-center">Cant.</span>
                                                            <span className="text-right">Total</span>
                                                            <span className="text-right text-emerald-600">Pagado</span>
                                                            <span className="text-right text-red-500">Pendiente</span>
                                                            <span className="text-right">Pagar Ahora</span>
                                                        </div>
                                                        {debt.items.map((item, idx) => {
                                                            const allocationKey = `${debt.id}_${item.id}`;
                                                            const currentAlloc = itemAllocations[allocationKey] || '';
                                                            
                                                            // Calculate item status
                                                            const itemPaid = getItemPaidAmount(debt, item.id);
                                                            const itemBalance = item.total - itemPaid;

                                                            return (
                                                                <div key={idx} className="grid grid-cols-[1fr_50px_70px_70px_80px_100px] gap-4 items-center px-2 py-1">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <ShoppingCart size={12} className="text-slate-400 shrink-0"/>
                                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate uppercase" title={item.name}>{item.name}</span>
                                                                    </div>
                                                                    <div className="text-center text-xs font-medium text-slate-600">{item.quantity}</div>
                                                                    <div className="text-right text-xs font-bold text-slate-600">S/ {item.total.toFixed(2)}</div>
                                                                    <div className="text-right text-xs font-bold text-emerald-600">S/ {itemPaid.toFixed(2)}</div>
                                                                    <div className="text-right text-xs font-bold text-red-500">S/ {itemBalance.toFixed(2)}</div>
                                                                    <div>
                                                                        {itemBalance > 0.01 ? (
                                                                            <input 
                                                                                type="number" 
                                                                                className={`w-full p-2 rounded-lg text-right font-black text-xs outline-none border transition-all ${currentAlloc ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white'}`}
                                                                                placeholder={itemBalance.toFixed(2)}
                                                                                value={currentAlloc}
                                                                                onChange={(e) => handleAllocateItem(debt.id, item, e.target.value)}
                                                                                onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                            />
                                                                        ) : (
                                                                            <div className="text-right text-[10px] font-black text-slate-300 uppercase">Pagado</div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountsPayableModule;
