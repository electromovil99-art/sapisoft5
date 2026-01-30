
import React, { useState, useMemo } from 'react';
import { History, DollarSign, TrendingUp, TrendingDown, Filter, Calendar, Banknote, Landmark, CreditCard, QrCode, Eye, X, Search, CalendarDays } from 'lucide-react';
import { CashMovement, BankAccount, PaymentMethodType } from '../types';

// --- HELPERS ---
const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const [day, month, year] = parts.map(Number);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    // Create date at UTC midnight to avoid timezone issues during comparison
    return new Date(Date.UTC(year, month - 1, day));
};

const DetailRow: React.FC<{ label: string; value: string | React.ReactNode; color?: string }> = ({ label, value, color }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">{label}</span>
        <div className={`font-bold text-sm text-right ${color || 'text-slate-700 dark:text-slate-200'}`}>{value}</div>
    </div>
);

const FilterButton: React.FC<{ label: string, isActive: boolean, onClick: () => void }> = ({ label, isActive, onClick }) => (
     <button 
        onClick={onClick} 
        className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all border ${
            isActive 
            ? 'bg-primary-600 text-white border-primary-600 shadow-md' 
            : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
        }`}
    >
        {label}
    </button>
);

interface BankHistoryProps {
    cashMovements: CashMovement[];
    bankAccounts: BankAccount[];
}

const BankHistoryModule: React.FC<BankHistoryProps> = ({ cashMovements, bankAccounts }) => {
    
    const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [filterType, setFilterType] = useState<'ALL' | 'Ingreso' | 'Egreso'>('ALL');
    const [filterAccount, setFilterAccount] = useState('ALL');
    const [selectedMovement, setSelectedMovement] = useState<CashMovement | null>(null);

    const filteredMovements = useMemo(() => {
        let items = cashMovements ? [...cashMovements] : [];
        
        // Date Filter logic
        if(filterDate !== 'all') {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const todayTime = today.getTime();

            items = items.filter(m => {
                const moveDate = parseDateString(m.date);
                if (!moveDate) return false;
                const moveTime = moveDate.getTime();
                
                if (filterDate === 'today') return moveTime === todayTime;
                
                if (filterDate === 'week') {
                    const startOfWeek = new Date(today);
                    startOfWeek.setUTCDate(today.getUTCDate() - today.getUTCDay());
                    return moveTime >= startOfWeek.getTime();
                }

                if (filterDate === 'month') {
                    const currentMonth = today.getUTCMonth();
                    const currentYear = today.getUTCFullYear();
                    return moveDate.getUTCMonth() === currentMonth && moveDate.getUTCFullYear() === currentYear;
                }

                if (filterDate === 'custom') {
                    // FIX: Evitamos el desfase de zona horaria parseando el string directamente
                    const [sYear, sMonth, sDay] = startDate.split('-').map(Number);
                    const [eYear, eMonth, eDay] = endDate.split('-').map(Number);
                    
                    const startUtc = Date.UTC(sYear, sMonth - 1, sDay);
                    const endUtc = Date.UTC(eYear, eMonth - 1, eDay);
                    
                    // Comparamos milisegundos UTC exactos
                    return moveTime >= startUtc && moveTime <= endUtc;
                }
                return true;
            });
        }

        // Type Filter
        if (filterType !== 'ALL') items = items.filter(m => m.type === filterType);
        
        // Account Filter
        if (filterAccount !== 'ALL') {
            items = items.filter(m => {
                if(filterAccount === 'CASH') return m.paymentMethod === 'Efectivo';
                return m.accountId === filterAccount;
            });
        }
        
        // Sort by Fecha (desc) and Hora (desc)
        return items.sort((a, b) => {
            const dateA = (a.date || "").split('/').reverse().join('');
            const dateB = (b.date || "").split('/').reverse().join('');
            const timeA = a.time || "00:00:00";
            const timeB = b.time || "00:00:00";
            return (dateB + timeB).localeCompare(dateA + timeA);
        });
    }, [cashMovements, filterDate, startDate, endDate, filterType, filterAccount]);

    const kpis = useMemo(() => {
        const totalIncome = filteredMovements.filter(m => m.type === 'Ingreso').reduce((sum, m) => sum + m.amount, 0);
        const totalExpenses = filteredMovements.filter(m => m.type === 'Egreso').reduce((sum, m) => sum + m.amount, 0);
        return { totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses };
    }, [filteredMovements]);
    
    const getMethodIcon = (method?: PaymentMethodType) => {
      switch(method) {
          case 'Efectivo': return <Banknote size={14} className="text-emerald-600"/>;
          case 'Yape': case 'Plin': case 'Yape/Plin': return <QrCode size={14} className="text-purple-600"/>;
          case 'Tarjeta': return <CreditCard size={14} className="text-blue-600"/>;
          case 'Deposito': case 'Transferencia': return <Landmark size={14} className="text-slate-600"/>;
          default: return <DollarSign size={14}/>;
      }
    };
    
    return(
        <div className="flex flex-col lg:flex-row h-full gap-4 overflow-hidden">
            
            {/* LADO IZQUIERDO: FILTROS Y TABLA */}
            <div className="flex-1 flex flex-col gap-4 min-h-0 min-w-0">
                {/* FILTROS INTEGRADOS */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-3 shrink-0 shadow-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <Filter size={14} className="text-slate-400 shrink-0 ml-1"/>
                            <FilterButton label="Todo" isActive={filterDate === 'all'} onClick={() => setFilterDate('all')} />
                            <FilterButton label="Hoy" isActive={filterDate === 'today'} onClick={() => setFilterDate('today')} />
                            <FilterButton label="Semana" isActive={filterDate === 'week'} onClick={() => setFilterDate('week')} />
                            <FilterButton label="Mes" isActive={filterDate === 'month'} onClick={() => setFilterDate('month')} />
                            <FilterButton label="Rango" isActive={filterDate === 'custom'} onClick={() => setFilterDate('custom')} />
                        </div>
                        
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-600 hidden md:block mx-1"></div>
                        
                        <div className="flex items-center gap-1.5">
                            <FilterButton label="Todos" isActive={filterType === 'ALL'} onClick={() => setFilterType('ALL')} />
                            <FilterButton label="Ingresos" isActive={filterType === 'Ingreso'} onClick={() => setFilterType('Ingreso')} />
                            <FilterButton label="Egresos" isActive={filterType === 'Egreso'} onClick={() => setFilterType('Egreso')} />
                        </div>

                        <div className="relative flex-1 min-w-[150px]">
                            <Landmark size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
                            <select onChange={e => setFilterAccount(e.target.value)} value={filterAccount} className="w-full pl-8 pr-4 py-1.5 text-[10px] font-black bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl appearance-none outline-none cursor-pointer uppercase tracking-tight">
                                <option value="ALL">Todas las Cuentas</option>
                                <option value="CASH">Caja (Efectivo)</option>
                                {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* FILTRO DE FECHA PERSONALIZADO */}
                    {filterDate === 'custom' && (
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Desde:</span>
                                <input 
                                    type="date" 
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary-500" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hasta:</span>
                                <input 
                                    type="date" 
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold outline-none focus:ring-1 focus:ring-primary-500" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                            <div className="ml-auto flex items-center gap-2 text-[9px] font-black text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full border border-primary-100 dark:border-primary-800">
                                <CalendarDays size={12}/> Rango Activo
                            </div>
                        </div>
                    )}
                </div>

                {/* TABLA DE MOVIMIENTOS */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                    <div className="h-full overflow-auto">
                    <table className="w-full modern-table text-sm">
                        <thead>
                            <tr className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                                <th className="px-6 py-4">Momento</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Medio</th>
                                <th className="px-6 py-4">Cuenta</th>
                                <th className="px-6 py-4">Concepto</th>
                                <th className="px-6 py-4 text-right">Monto</th>
                                <th className="px-6 py-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {filteredMovements.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-12"><div className="text-slate-400 flex flex-col items-center gap-4"><Search size={48} strokeWidth={1}/> <span className="font-bold uppercase text-xs tracking-widest">Sin movimientos en este rango</span></div></td></tr>
                            ) : (
                                filteredMovements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 group transition-colors">
                                    <td className="px-6 py-3 font-mono text-[10px] text-slate-500">
                                        <div className="font-black text-slate-700 dark:text-slate-300">{m.date}</div>
                                        <div className="text-[9px] opacity-60">{m.time}</div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${m.type === 'Ingreso' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                            {m.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-2 font-bold uppercase text-[10px] text-slate-600 dark:text-slate-300">
                                            {getMethodIcon(m.paymentMethod)} {m.paymentMethod}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-bold uppercase text-[10px] text-slate-500">
                                        {m.accountId ? (bankAccounts.find(b=>b.id===m.accountId)?.alias || 'Banco') : 'Caja'}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="font-black text-slate-700 dark:text-white truncate max-w-[250px] uppercase leading-tight">{m.concept}</div>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{m.category}</div>
                                    </td>
                                    <td className={`px-6 py-3 font-black text-right text-sm ${m.type === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                                        {m.type === 'Ingreso' ? '+' : '-'} S/ {m.amount.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <button onClick={() => setSelectedMovement(m)} className="p-2 text-slate-300 hover:text-primary-600 transition-colors">
                                            <Eye size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            )))}
                        </tbody>
                    </table>
                    </div>
                </div>
            </div>

            {/* LADO DERECHO: COLUMNA DE RESUMEN (KPIs) - TAMAÑO MINIMIZADO */}
            <div className="w-full lg:w-56 flex flex-col gap-3 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center shadow-sm border-l-4 border-l-emerald-500">
                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-0.5 tracking-tight">
                        <TrendingUp size={10} className="text-emerald-500"/> Ingresos
                    </div>
                    <div className="text-base font-black text-emerald-600 leading-tight">S/ {kpis.totalIncome.toFixed(2)}</div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center shadow-sm border-l-4 border-l-red-500">
                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-0.5 tracking-tight">
                        <TrendingDown size={10} className="text-red-500"/> Egresos
                    </div>
                    <div className="text-base font-black text-red-500 leading-tight">S/ {kpis.totalExpenses.toFixed(2)}</div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-center shadow-sm border-l-4 border-l-primary-500">
                    <div className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-0.5 tracking-tight">
                        <DollarSign size={10} className="text-primary-500"/> Saldo Neto
                    </div>
                    <div className={`text-base font-black leading-tight ${kpis.netBalance >= 0 ? 'text-slate-800 dark:text-white' : 'text-red-500'}`}>
                        S/ {kpis.netBalance.toFixed(2)}
                    </div>
                </div>

                <div className="flex-1 bg-slate-50 dark:bg-slate-900/20 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-700 p-4 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm mb-3">
                        <History size={20} className="text-slate-300"/>
                    </div>
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-tight tracking-[0.1em]">Auditoría Activa</p>
                    <div className="mt-2 flex gap-1">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" style={{animationDelay: '0.4s'}}></div>
                    </div>
                </div>
            </div>

            {selectedMovement && (
             <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[999] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="px-8 py-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><History size={18} /> Detalle de Operación</h3>
                        <button onClick={() => setSelectedMovement(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-8 flex-1 space-y-1 overflow-y-auto">
                        <DetailRow label="ID Movimiento" value={<span className="font-mono">#{selectedMovement.id?.substring(0, 8)}</span>} />
                        <DetailRow label="Tipo" value={<span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${selectedMovement.type === 'Ingreso' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>{selectedMovement.type}</span>}/>
                        <DetailRow label="Monto" value={`S/ ${selectedMovement.amount.toFixed(2)}`} color={selectedMovement.type === 'Ingreso' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'} />
                        <DetailRow label="Concepto" value={selectedMovement.concept.toUpperCase()} />
                        <DetailRow label="Categoría" value={<>{selectedMovement.financialType && <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 rounded mr-1 uppercase">{selectedMovement.financialType}</span>} <span className="uppercase">{selectedMovement.category}</span></>} />
                        <DetailRow label="Método de Pago" value={<div className="flex items-center justify-end gap-2 uppercase">{getMethodIcon(selectedMovement.paymentMethod)} {selectedMovement.paymentMethod}</div>} />
                        {selectedMovement.referenceId && <DetailRow label="Referencia" value={<span className="font-mono font-black text-primary-600">#{selectedMovement.referenceId}</span>} />}
                        <DetailRow label="Fecha" value={selectedMovement.date} />
                        <DetailRow label="Hora" value={selectedMovement.time} />
                        <DetailRow label="Responsable" value={selectedMovement.user.toUpperCase()} />
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <button onClick={() => setSelectedMovement(null)} className="px-8 py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl text-[10px] uppercase hover:opacity-90 w-full transition-all tracking-widest">Cerrar Detalle</button>
                    </div>
                </div>
            </div>
            )}
        </div>
    )
};

export default BankHistoryModule;
