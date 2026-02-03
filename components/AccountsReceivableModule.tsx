
import React, { useState, useMemo } from 'react';
import { Search, User, CheckCircle, ChevronDown, ChevronUp, X, DollarSign, Wallet, CreditCard, Banknote, QrCode, Landmark, Lock, ShoppingBag, ChevronRight, FileText, History, Clock, ArrowDownLeft } from 'lucide-react';
import { Client, SaleRecord, PaymentMethodType, BankAccount, CartItem } from '../types';

interface AccountsReceivableProps {
    clients: Client[];
    salesHistory: SaleRecord[];
    bankAccounts: BankAccount[];
    onRegisterPayment: (ticketId: string, amount: number, paymentDetails: any, allocations?: Record<string, number>) => void;
    isCashBoxOpen: boolean;
}

const AccountsReceivableModule: React.FC<AccountsReceivableProps> = ({ clients, salesHistory, bankAccounts, onRegisterPayment, isCashBoxOpen }) => {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    
    // Payment Logic State
    // Stores allocation per item per ticket. Key: `${ticketId}_${itemId}`, Value: amount
    const [itemAllocations, setItemAllocations] = useState<Record<string, number>>({});
    
    // UI State for Payment Form
    const [receivedAmountInput, setReceivedAmountInput] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentAccountId, setPaymentAccountId] = useState('');
    
    // UI State for expanding ticket details in modal
    const [expandedTickets, setExpandedTickets] = useState<Record<string, boolean>>({});

    // Toggle for History View in Main Screen
    const [showHistoryForTicket, setShowHistoryForTicket] = useState<string | null>(null);

    const pendingSales = useMemo(() => {
        return salesHistory.filter(s => {
             // Only Credit sales not fully paid
             if (s.docType === 'NOTA DE CRÉDITO') return false; 
             const paid = (s.detailedPayments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
             return (s.paymentBreakdown.cash === 0 && s.paymentBreakdown.card === 0 && s.paymentBreakdown.yape === 0 && s.paymentBreakdown.bank === 0 && s.paymentBreakdown.wallet === 0) 
                 && (s.total - paid) > 0.01;
        });
    }, [salesHistory]);

    const clientDebts = useMemo(() => {
        if (!selectedClient) return [];
        return pendingSales.filter(s => s.clientName === selectedClient.name);
    }, [selectedClient, pendingSales]);

    // Calculate total allocated to items (Debt Payment)
    const totalAllocated = useMemo(() => {
        return Object.values(itemAllocations).reduce((acc: number, val: number) => acc + val, 0);
    }, [itemAllocations]);

    // Calculate Wallet Excess
    const totalReceived = parseFloat(receivedAmountInput) || 0;
    const walletExcess = Math.max(0, totalReceived - totalAllocated);

    const filteredClients = useMemo(() => {
        const clientsWithDebt = new Set(pendingSales.map(s => s.clientName));
        return clients.filter(c => 
            clientsWithDebt.has(c.name) && 
            (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.dni.includes(searchTerm))
        );
    }, [clients, pendingSales, searchTerm]);

    const toggleTicketExpand = (ticketId: string) => {
        setExpandedTickets(prev => ({ ...prev, [ticketId]: !prev[ticketId] }));
    };

    // Calculate how much has been paid for a specific item across all payments
    const getItemPaidAmount = (ticket: SaleRecord, itemId: string) => {
        if (!ticket.detailedPayments) return 0;
        return ticket.detailedPayments.reduce((acc, pay: any) => {
            if (pay.allocations && pay.allocations[itemId]) {
                return acc + pay.allocations[itemId];
            }
            return acc;
        }, 0);
    };

    const handleAllocateItem = (ticketId: string, item: CartItem, amountStr: string) => {
        let amount = parseFloat(amountStr);
        if (isNaN(amount) || amount < 0) amount = 0;

        // 1. Calculate remaining balance for the whole ticket first to prevent overpayment on ticket level
        const ticket = clientDebts.find(t => t.id === ticketId);
        if (!ticket) return;

        // 2. Calculate item specific balance (STRICT LIMIT)
        const itemPaid = getItemPaidAmount(ticket, item.id);
        const itemBalance = item.total - itemPaid;

        // Force amount to not exceed item balance
        if (amount > itemBalance + 0.001) {
            amount = itemBalance;
        }

        setItemAllocations(prev => {
            if (amount <= 0) {
                const copy = { ...prev };
                delete copy[`${ticketId}_${item.id}`];
                return copy;
            }
            return { ...prev, [`${ticketId}_${item.id}`]: amount };
        });
    };

    const handleConfirmPayment = () => {
        if (totalAllocated <= 0) return alert("Debe asignar montos a los productos para reducir deuda.");
        if (totalReceived < totalAllocated) return alert("El monto recibido no cubre lo asignado a pagar.");
        
        if (paymentMethod !== 'Efectivo' && !paymentAccountId && paymentMethod !== 'Saldo Favor') return alert("Seleccione cuenta bancaria.");
        
        // Block Cash if Box Closed
        if (paymentMethod === 'Efectivo' && !isCashBoxOpen) {
            return alert("⛔ CAJA CERRADA: No puede recibir pagos en efectivo. Abra la caja primero.");
        }

        // Group allocations by Ticket
        const paymentsByTicket: Record<string, Record<string, number>> = {};
        const totalByTicket: Record<string, number> = {};

        Object.entries(itemAllocations).forEach(([key, amount]: [string, number]) => {
            const [ticketId, itemId] = key.split('_');
            if (!paymentsByTicket[ticketId]) paymentsByTicket[ticketId] = {};
            paymentsByTicket[ticketId][itemId] = amount;
            totalByTicket[ticketId] = (totalByTicket[ticketId] || 0) + amount;
        });
        
        const ticketsToPay = Object.entries(totalByTicket);

        ticketsToPay.forEach(([ticketId, allocatedAmt], index) => {
            if (allocatedAmt > 0) {
                
                const isLast = index === ticketsToPay.length - 1;
                const cashToRegisterForThisTicket = allocatedAmt + (isLast ? walletExcess : 0);

                const details = {
                    id: Math.random().toString(),
                    method: paymentMethod,
                    amount: cashToRegisterForThisTicket, // This is what goes into Cash Box
                    reference: paymentReference,
                    accountId: paymentAccountId,
                    date: new Date().toLocaleDateString('es-PE'),
                    time: new Date().toLocaleTimeString('es-PE'),
                    note: "Abono a items específicos" 
                };
                
                // Extract just the item allocations for this ticket
                const ticketAllocations = paymentsByTicket[ticketId];
                
                // The handler uses 'amount' argument as DEBT REDUCTION (allocatedAmt)
                // And 'details.amount' as CASH ENTRY. 
                // Excess = details.amount - amount.
                onRegisterPayment(ticketId, allocatedAmt, details, ticketAllocations);
            }
        });

        alert(`Abono registrado exitosamente para ${ticketsToPay.length} ticket(s).`);

        setShowPaymentModal(false);
        setItemAllocations({});
        setReceivedAmountInput('');
        setPaymentReference('');
    };

    return (
        <div className="flex h-full gap-6 animate-in fade-in duration-500">
            {/* Left: Client List */}
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50">
                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <User className="text-emerald-500"/> Clientes con Deuda
                    </h2>
                    <div className="mt-4 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                        <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-emerald-500"
                            placeholder="Buscar cliente..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredClients.map(c => {
                        const debt = pendingSales.filter(s => s.clientName === c.name).reduce((acc, s) => {
                            const paid = (s.detailedPayments || []).reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
                            return acc + (s.total - paid);
                        }, 0);
                        
                        return (
                            <div 
                                key={c.id} 
                                onClick={() => setSelectedClient(c)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedClient?.id === c.id ? 'bg-emerald-50 border-emerald-500 shadow-md ring-1 ring-emerald-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 hover:border-emerald-200'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="min-w-0">
                                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase truncate">{c.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{c.dni}</p>
                                    </div>
                                    <ChevronRight size={16} className={`text-slate-300 transition-transform ${selectedClient?.id === c.id ? 'rotate-90 text-emerald-500' : ''}`}/>
                                </div>
                                <div className="mt-3 flex justify-between items-end border-t border-slate-100 dark:border-slate-800 pt-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Saldo Pendiente</span>
                                    <span className="text-sm font-black text-red-500">S/ {debt.toFixed(2)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Debts & Payment */}
            <div className="flex-1 flex flex-col gap-4">
                {selectedClient ? (
                    <>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{selectedClient.name}</h3>
                                <p className="text-xs font-bold text-slate-400">Documentos Pendientes de Pago</p>
                            </div>
                            <button 
                                onClick={() => { setItemAllocations({}); setReceivedAmountInput(''); setShowPaymentModal(true); }}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center gap-2"
                            >
                                <DollarSign size={16}/> Registrar Abono
                            </button>
                        </div>

                        {/* List of Sales */}
                        <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-auto p-6 space-y-4">
                                {clientDebts.map(debt => {
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
                                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">#{debt.id.substring(0,8)}</span>
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
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Abonado</p>
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
                        <p className="font-black uppercase text-xs tracking-widest">Seleccione un cliente para ver su estado de cuenta</p>
                    </div>
                )}
            </div>

            {/* Payment Modal with Detailed Item List */}
            {showPaymentModal && selectedClient && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                    <Wallet size={24} className="text-emerald-500"/> Registrar Cobro Detallado
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cliente: {selectedClient.name}</p>
                            </div>
                            <button onClick={() => setShowPaymentModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left: Input & Method */}
                            <div className="w-[340px] bg-slate-50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-700 p-8 flex flex-col gap-6 overflow-y-auto">
                                
                                {paymentMethod === 'Efectivo' && !isCashBoxOpen && (
                                    <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-2xl text-[10px] font-bold uppercase border border-red-200 dark:border-red-800 flex items-center gap-2">
                                        <Lock size={20}/>
                                        Caja Cerrada. No se puede cobrar en efectivo.
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Método de Cobro</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'Efectivo', icon: Banknote },
                                            { id: 'Yape', icon: QrCode },
                                            { id: 'Tarjeta', icon: CreditCard },
                                            { id: 'Deposito', icon: Landmark }
                                        ].map(m => (
                                            <button 
                                                key={m.id}
                                                onClick={() => setPaymentMethod(m.id as PaymentMethodType)}
                                                className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${paymentMethod === m.id ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'}`}
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
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cuenta Destino</label>
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
                                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monto Recibido</label>
                                     <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">S/</span>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-2xl text-2xl font-black text-slate-800 dark:text-white outline-none focus:border-emerald-500 transition-colors"
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
                                        <div className="flex justify-between items-center text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                                            <span className="uppercase flex items-center gap-1"><ArrowDownLeft size={12}/> A Billetera:</span>
                                            <span>S/ {walletExcess.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                
                                <button 
                                    onClick={handleConfirmPayment}
                                    disabled={totalAllocated <= 0 || (paymentMethod === 'Efectivo' && !isCashBoxOpen)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Confirmar Cobro
                                </button>
                            </div>

                            {/* Right: Detailed List */}
                            <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
                                <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><CheckCircle size={14}/> Seleccione Items a Amortizar</h4>
                                </div>
                                <div className="flex-1 overflow-auto p-6 space-y-4">
                                    {clientDebts.map(debt => {
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
                                                        <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
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
                                                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px_100px] gap-2 px-2 pb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                                                            <span>Producto</span>
                                                            <span className="text-center">Cant.</span>
                                                            <span className="text-right">Total</span>
                                                            <span className="text-right text-emerald-600">Pagado</span>
                                                            <span className="text-right text-red-500">Pendiente</span>
                                                            <span className="text-right">Abonar Ahora</span>
                                                        </div>
                                                        {debt.items.map((item, idx) => {
                                                            const allocationKey = `${debt.id}_${item.id}`;
                                                            const currentAlloc = itemAllocations[allocationKey] || '';
                                                            
                                                            // Calculate specific item balance
                                                            const itemPaid = getItemPaidAmount(debt, item.id);
                                                            const itemBalance = item.total - itemPaid;

                                                            return (
                                                                <div key={idx} className="grid grid-cols-[1fr_50px_70px_70px_80px_100px] gap-2 items-center px-2 py-1">
                                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                                        <ShoppingBag size={12} className="text-slate-400 shrink-0"/>
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
                                                                                className={`w-full p-2 rounded-lg text-right font-black text-xs outline-none border transition-all ${currentAlloc ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}
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

export default AccountsReceivableModule;
