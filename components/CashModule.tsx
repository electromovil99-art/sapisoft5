
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Minus, Wallet, Banknote, QrCode, Landmark, CreditCard, Eye, X, Lock, Unlock, CheckCircle, Printer, RotateCcw, ArrowRightLeft, Calculator, FileText, AlertTriangle, ChevronRight, ArrowRight, Tag, Layers, Hash, Layout, FileText as FileIcon, Clock, ChevronDown, User, Info, Fingerprint, ShoppingCart, ShoppingBag } from 'lucide-react';
import { CashMovement, PaymentMethodType, BankAccount, SaleRecord, PurchaseRecord, CartItem, CashBoxSession } from '../types';

interface CashModuleProps {
    movements: CashMovement[];
    salesHistory: SaleRecord[];
    purchasesHistory: PurchaseRecord[];
    onAddMovement: (m: CashMovement) => void;
    bankAccounts: BankAccount[];
    onUniversalTransfer: (fromId: string, toId: string, amount: number, exchangeRate: number, reference: string, opNumber: string) => void;
    fixedExpenseCategories: string[];
    fixedIncomeCategories: string[];
    onAddFixedCategory: (category: string, type: 'Ingreso' | 'Egreso') => void;
    isCashBoxOpen: boolean;
    lastClosingCash: number;
    onOpenCashBox: (openingCash: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    onCloseCashBox: (countedCash: number, systemCash: number, systemDigital: number, notes: string, confirmedBankBalances: Record<string, string>) => void;
    systemBaseCurrency: string;
    currentSession?: CashBoxSession; 
    currentBranchId: string;
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

const DenominationRow: React.FC<{ 
    label: string, 
    value: number, 
    count: string, 
    onChange: (val: string) => void,
    onEnter: () => void,
    inputRef?: (el: HTMLInputElement | null) => void
}> = ({ label, value, count, onChange, onEnter, inputRef }) => (
    <div className="flex items-center justify-between py-0.5 px-2 hover:bg-white dark:hover:bg-slate-800 rounded border border-transparent hover:border-slate-100 dark:hover:border-slate-700 transition-all group">
        <span className="text-xs font-black text-slate-500 dark:text-slate-400 tabular-nums tracking-tight w-14">S/ {label}</span>
        <div className="flex items-center gap-1.5">
            <input 
                ref={inputRef}
                type="number" 
                className="w-12 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded py-0.5 px-1 text-center font-black text-xs text-slate-800 dark:text-white outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-100 transition-all shadow-sm placeholder-slate-300"
                value={count}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onEnter()}
                placeholder="-"
            />
            <span className="text-xs font-bold text-slate-400 w-14 text-right tabular-nums">{(Number(count) * value).toFixed(2)}</span>
        </div>
    </div>
);

const CashBoxManager: React.FC<{
    type: 'OPEN' | 'CLOSE',
    expectedCash: number,
    bankBalances: any[],
    onConfirm: (total: number, notes: string, confirmedBanks: any) => void,
    onCancel?: () => void
}> = ({ type, expectedCash, bankBalances, onConfirm, onCancel }) => {
    const [counts, setCounts] = useState<Record<string, string>>({
        '200': '', '100': '', '50': '', '20': '', '10': '',
        '5': '', '2': '', '1': '', '0.50': '', '0.20': '', '0.10': ''
    });
    const [manualBankBalances, setManualBankBalances] = useState<Record<string, string>>({});
    const [notes, setNotes] = useState('');
    const [showAuditWarning, setShowAuditWarning] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const bankInputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const submitBtnRef = useRef<HTMLButtonElement>(null); 

    const denominations = [
        { label: '200.00', val: 200 }, { label: '100.00', val: 100 }, { label: '50.00', val: 50 },
        { label: '20.00', val: 20 }, { label: '10.00', val: 10 }, { label: '5.00', val: 5 },
        { label: '2.00', val: 2 }, { label: '1.00', val: 1 }, { label: '0.50', val: 0.5 },
        { label: '0.20', val: 0.2 }, { label: '0.10', val: 0.1 }
    ];

    const physicalTotal = useMemo(() => {
        return Object.entries(counts).reduce((acc: number, [label, count]) => acc + (Number(label) * (Number(count) || 0)), 0);
    }, [counts]);

    const cashDifference = physicalTotal - expectedCash;

    const auditDiferencias = useMemo(() => {
        const diffs: { name: string, type: 'SOBRA' | 'FALTA', amount: number }[] = [];
        if (Math.abs(cashDifference) > 0.01) {
            diffs.push({ name: 'EFECTIVO EN CAJA', type: cashDifference > 0 ? 'SOBRA' : 'FALTA', amount: Math.abs(cashDifference) });
        }
        bankBalances.forEach(acc => {
            const real = parseFloat(manualBankBalances[acc.id] || '0');
            const diff = real - acc.currentBalance;
            if (Math.abs(diff) > 0.01) {
                diffs.push({ name: acc.alias || acc.bankName, type: diff > 0 ? 'SOBRA' : 'FALTA', amount: Math.abs(diff) });
            }
        });
        return diffs;
    }, [cashDifference, manualBankBalances, bankBalances]);

    const handleInitialConfirm = () => {
        if (type === 'OPEN') {
            const missing = bankBalances.some(acc => manualBankBalances[acc.id] === undefined || manualBankBalances[acc.id] === '');
            if (missing) {
                alert("ERROR: Debe ingresar el saldo real de todas sus cuentas para aperturar.");
                return;
            }
        }
        if (auditDiferencias.length > 0) setShowAuditWarning(true);
        else onConfirm(physicalTotal, notes, manualBankBalances);
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-[540px] overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 relative mx-auto my-2 flex flex-col max-h-[90vh]">
            
            {/* MODAL DE IMPRESIÓN DE CONTEO */}
            {showPrintPreview && (
                <div className="absolute inset-0 z-[150] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white p-4 rounded-xl shadow-2xl max-h-full overflow-y-auto no-scrollbar flex flex-col gap-4">
                        <div id="print-area-count" className="bg-white w-[280px] p-4 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums border border-slate-200">
                            <div className="text-center mb-3 pb-2 border-b-2 border-dashed border-black">
                                <h2 className="font-bold text-xs uppercase tracking-tighter">ARQUEO DE CAJA</h2>
                                <p className="text-[8px] font-bold uppercase">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
                            </div>
                            
                            <div className="mb-3">
                                <p className="font-bold uppercase border-b border-black mb-1">Efectivo Detallado</p>
                                {denominations.map(d => {
                                    const c = counts[d.val.toString()];
                                    if(!c || c === '0') return null;
                                    return (
                                        <div key={d.label} className="flex justify-between">
                                            <span>{c} x {d.label}</span>
                                            <span>{(Number(c) * d.val).toFixed(2)}</span>
                                        </div>
                                    )
                                })}
                                <div className="flex justify-between font-black border-t border-black mt-1 pt-1 text-xs">
                                    <span>TOTAL EFECTIVO</span>
                                    <span>{physicalTotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="mb-3">
                                <p className="font-bold uppercase border-b border-black mb-1">Saldos Bancarios</p>
                                {bankBalances.map(acc => {
                                    const val = manualBankBalances[acc.id];
                                    if(val === undefined || val === '') return null;
                                    return (
                                        <div key={acc.id} className="flex justify-between">
                                            <span className="truncate w-24">{acc.alias || acc.bankName}</span>
                                            <span>{acc.currency} {Number(val).toFixed(2)}</span>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="text-center text-[8px] font-bold mt-4 pt-2 border-t-2 border-dashed border-black">
                                FIRMA RESPONSABLE
                                <br/><br/><br/>
                                _______________________
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowPrintPreview(false)} className="flex-1 py-2 bg-slate-200 text-slate-600 font-bold rounded-lg uppercase text-[10px]">Cerrar</button>
                            <button onClick={() => { 
                                const content = document.getElementById('print-area-count')?.innerHTML;
                                const win = window.open('', '', 'width=350,height=600');
                                if(win && content) {
                                    win.document.write('<html><head><title>Print</title><style>body { font-family: monospace; font-size: 10px; }</style></head><body>' + content + '</body></html>');
                                    win.document.close();
                                    win.print();
                                    win.close();
                                }
                            }} className="flex-1 py-2 bg-slate-900 text-white font-bold rounded-lg uppercase text-[10px] flex items-center justify-center gap-2"><Printer size={14}/> Imprimir</button>
                        </div>
                    </div>
                </div>
            )}

            {showAuditWarning && (
                <div className="absolute inset-0 z-[100] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col p-6 animate-in fade-in">
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <AlertTriangle size={64} className="text-orange-500 mb-6 animate-bounce"/>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase mb-4 tracking-tighter">¡Diferencias Detectadas!</h3>
                        <div className="w-full max-w-lg space-y-3 mb-8 overflow-y-auto max-h-[40vh] p-1">
                            {auditDiferencias.map((diff, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="text-left">
                                        <span className="text-xs font-black text-slate-400 uppercase block leading-none mb-1">{diff.name}</span>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${diff.type === 'SOBRA' ? 'text-emerald-500' : 'text-rose-500'}`}>{diff.type}</span>
                                    </div>
                                    <span className={`text-lg font-black ${diff.type === 'SOBRA' ? 'text-emerald-600' : 'text-red-600'}`}>S/ {diff.amount.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-4 w-full max-w-md">
                            <button onClick={() => setShowAuditWarning(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Revisar Conteo</button>
                            <button ref={submitBtnRef} onClick={() => onConfirm(physicalTotal, notes, manualBankBalances)} className="flex-1 py-4 bg-orange-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">
                                {type === 'OPEN' ? 'Confirmar Apertura' : 'Forzar Cierre'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${type === 'OPEN' ? 'bg-primary-100 text-primary-600' : 'bg-red-100 text-red-600'}`}>
                        {type === 'OPEN' ? <Unlock size={18}/> : <Lock size={18}/>}
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
                            {type === 'OPEN' ? 'Apertura de Turno' : 'Cierre de Caja'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control de Efectivo y Bancos</p>
                    </div>
                </div>
                {onCancel && <button onClick={onCancel} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-full transition-colors"><X size={18}/></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                    
                    {/* COLUMNA IZQUIERDA: CONTEO FÍSICO */}
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1.5"><Banknote size={12}/> Billetes y Monedas</h4>
                        <div className="flex-1 space-y-0 overflow-y-auto pr-1 custom-scrollbar">
                            {denominations.map((d, idx) => (
                                <DenominationRow 
                                    key={d.label} label={d.label} value={d.val} count={counts[d.val.toString()] || ''} 
                                    onChange={(v) => setCounts({...counts, [d.val.toString()]: v})}
                                    onEnter={() => { 
                                        if (idx < denominations.length - 1) {
                                            inputRefs.current[idx + 1]?.focus();
                                            inputRefs.current[idx + 1]?.select();
                                        } else {
                                            if (bankBalances.length > 0 && bankInputRefs.current[0]) {
                                                bankInputRefs.current[0]?.focus();
                                                bankInputRefs.current[0]?.select();
                                            } else {
                                                submitBtnRef.current?.focus();
                                            }
                                        }
                                    }}
                                    inputRef={(el) => { inputRefs.current[idx] = el; }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: RESUMEN Y BANCOS */}
                    <div className="flex flex-col gap-3">
                        
                        {/* CARD TOTALES */}
                        <div className="bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 p-4 rounded-[1.5rem] relative overflow-hidden text-center group shadow-sm hover:border-primary-200 transition-all">
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Efectivo Contado</p>
                            <div className="text-3xl font-black text-slate-900 dark:text-white leading-none tracking-tighter tabular-nums">S/ {physicalTotal.toFixed(2)}</div>
                            <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 flex justify-between items-center px-2">
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Sistema: S/ {expectedCash.toFixed(2)}</span>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${cashDifference >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {cashDifference >= 0 ? 'SOBRA' : 'FALTA'}: S/ {Math.abs(cashDifference).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* INPUTS BANCOS */}
                        {bankBalances.length > 0 && (
                            <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col">
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1 flex items-center gap-1.5"><Landmark size={12}/> Arqueo de Cuentas</h4>
                                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                                    {bankBalances.map((acc, idx) => (
                                        <div key={acc.id} className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3 group hover:border-blue-300 transition-colors">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-black text-[10px] text-slate-700 dark:text-white uppercase truncate">{acc.alias || acc.bankName}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Sis: {formatSymbol(acc.currency)} {acc.currentBalance.toFixed(2)}</p>
                                            </div>
                                            <div className="relative">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">{formatSymbol(acc.currency)}</span>
                                                <input 
                                                    ref={(el) => { bankInputRefs.current[idx] = el; }}
                                                    type="number" 
                                                    className="w-16 pl-5 pr-1 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-black outline-none focus:border-blue-500 text-right tabular-nums transition-all"
                                                    value={manualBankBalances[acc.id] || ''}
                                                    onChange={e => setManualBankBalances({...manualBankBalances, [acc.id]: e.target.value})}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            if (idx < bankBalances.length - 1) {
                                                                bankInputRefs.current[idx + 1]?.focus();
                                                                bankInputRefs.current[idx + 1]?.select();
                                                            } else {
                                                                submitBtnRef.current?.focus();
                                                            }
                                                        }
                                                    }}
                                                    placeholder="Real"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex gap-3 justify-end shrink-0">
                <button
                    onClick={() => setShowPrintPreview(true)}
                    className="px-4 py-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                >
                    <Printer size={16}/> Imprimir
                </button>
                <button 
                    ref={submitBtnRef}
                    onClick={handleInitialConfirm}
                    className="flex-1 max-w-xs px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all focus:ring-4 focus:ring-slate-300 dark:focus:ring-slate-600 outline-none flex items-center justify-center gap-2"
                >
                    {type === 'OPEN' ? <Unlock size={14}/> : <Lock size={14}/>}
                    {type === 'OPEN' ? 'CONFIRMAR APERTURA' : 'FINALIZAR CIERRE'}
                </button>
            </div>
        </div>
    );
};

export const CashModule: React.FC<CashModuleProps> = ({ 
    movements, salesHistory, purchasesHistory, onAddMovement, bankAccounts, onUniversalTransfer, 
    fixedExpenseCategories, fixedIncomeCategories, onAddFixedCategory, 
    isCashBoxOpen, lastClosingCash, onOpenCashBox, onCloseCashBox,
    systemBaseCurrency, currentSession, currentBranchId
}) => {
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<any>(null);
  const [filter, setFilter] = useState<'ALL' | 'CASH' | 'DIGITAL'>('ALL');
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [category, setCategory] = useState('');
  const [financialType, setFinancialType] = useState<'Fijo' | 'Variable' | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('Efectivo');
  const [bankAccountId, setBankAccountId] = useState('');
  const [operationNumber, setOperationNumber] = useState('');
  const [transferData, setTransferData] = useState({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });

  const todayStr = new Date().toLocaleDateString('es-PE');

  const activeMovements = useMemo(() => {
      if (!currentSession) return [];
      const openingTimeStr = currentSession.openingDate.split(' ')[1];
      return movements.filter(m => m.date === todayStr && m.time >= openingTimeStr);
  }, [movements, todayStr, currentSession]);

  const displayedMovements = useMemo(() => {
      let filtered = [...activeMovements];
      if (filter === 'CASH') filtered = filtered.filter(m => m.paymentMethod === 'Efectivo');
      if (filter === 'DIGITAL') filtered = filtered.filter(m => m.paymentMethod !== 'Efectivo');
      
      const chronoSorted = [...filtered].sort((a, b) => a.time.localeCompare(b.time));
      const runningBalances: Record<string, number> = { 'CASH': currentSession?.countedOpening || 0 };
      
      bankAccounts.forEach(acc => {
          runningBalances[acc.id] = currentSession?.confirmedDigitalAtOpen[acc.id] || 0;
      });

      let ingresoCount = 0;
      let egresoCount = 0;
      
      return chronoSorted.map(m => {
          const targetId = m.accountId || 'CASH';
          let sequentialId = "";
          
          if (m.type === 'Ingreso') {
              ingresoCount++;
              sequentialId = `I-${ingresoCount}`;
          } else {
              egresoCount++;
              sequentialId = `E-${egresoCount}`;
          }

          if (m.category === 'AJUSTE APERTURA') return { ...m, sequentialId, accumulatedBalance: runningBalances[targetId] };
          
          if (m.type === 'Ingreso') runningBalances[targetId] += m.amount;
          else runningBalances[targetId] -= m.amount;
          
          return { ...m, sequentialId, accumulatedBalance: runningBalances[targetId] };
      });
  }, [activeMovements, filter, bankAccounts, currentSession]);

  const bankBalancesInfo = useMemo(() => {
    return bankAccounts.map(acc => {
      const currentBalance = movements
        .filter(m => m.accountId === acc.id)
        .reduce((sum, m) => m.type === 'Ingreso' ? sum + m.amount : sum - m.amount, 0);
      const openingBalance = currentSession?.confirmedDigitalAtOpen[acc.id] ?? currentBalance;
      return { ...acc, currentBalance, openingBalance };
    });
  }, [bankAccounts, movements, currentSession]);

  const currentCashActual = useMemo(() => {
      const diffSinceOpen = activeMovements
        .filter(m => m.paymentMethod === 'Efectivo' && m.category !== 'AJUSTE APERTURA')
        .reduce((acc, m) => m.type === 'Ingreso' ? acc + m.amount : acc - m.amount, 0);
      return (currentSession?.countedOpening || 0) + diffSinceOpen;
  }, [activeMovements, currentSession]);

  const handleSaveMovement = (type: 'Ingreso' | 'Egreso') => {
      if (!amount || !concept || !financialType) return alert("Complete los campos obligatorios.");
      const finalCategory = financialType === 'Fijo' ? category.toUpperCase() : 'VARIABLE';

      onAddMovement({ 
        id: 'M-' + Date.now(), date: todayStr, 
        time: new Date().toLocaleTimeString('es-PE', { hour12: false }), 
        type, paymentMethod, concept: concept.toUpperCase(), amount: parseFloat(amount), 
        user: 'ADMIN', category: finalCategory, financialType: financialType as any, 
        accountId: paymentMethod !== 'Efectivo' ? bankAccountId : undefined,
        referenceId: paymentMethod !== 'Efectivo' ? operationNumber.toUpperCase() : undefined,
        currency: paymentMethod === 'Efectivo' ? systemBaseCurrency : bankAccounts.find(b=>b.id===bankAccountId)?.currency || systemBaseCurrency
      });
      
      setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); 
      setAmount(''); setConcept(''); setCategory(''); setFinancialType(''); setPaymentMethod('Efectivo'); setOperationNumber('');
  };

  const handleExecuteTransfer = () => {
    const amt = parseFloat(transferData.amount);
    if (isNaN(amt) || amt <= 0) return alert("Monto inválido.");
    if (!transferData.operationNumber) return alert("Ingrese el Nro de Operación.");

    onUniversalTransfer(transferData.from, transferData.to, amt, parseFloat(transferData.rate), transferData.reference, transferData.operationNumber);
    setIsTransferModalOpen(false);
    setTransferData({ from: 'CASH', to: '', amount: '', rate: '1.0', reference: '', operationNumber: '' });
  };

  const getLinkedRecord = (m: any) => {
    const conceptUpper = (m.concept || "").toUpperCase();
    if (conceptUpper.includes("VENTA")) {
        const saleIdMatch = conceptUpper.match(/#([A-Z0-9-]+)/);
        if (saleIdMatch) {
            const sale = salesHistory.find(s => s.id === saleIdMatch[1]);
            if (sale) return { ...sale, type: 'SALE' };
        }
    }
    if (conceptUpper.includes("COMPRA")) {
        const purchaseIdMatch = conceptUpper.match(/#([A-Z0-9-]+)/);
        if (purchaseIdMatch) {
            const purchase = purchasesHistory.find(p => p.id === purchaseIdMatch[1]);
            if (purchase) return { ...purchase, type: 'PURCHASE' };
        }
    }
    return null;
  };

  const linkedRecord = useMemo(() => selectedMovement ? getLinkedRecord(selectedMovement) : null, [selectedMovement, salesHistory, purchasesHistory]);

  if (!isCashBoxOpen) {
      return (
          <div className="h-full flex items-center justify-center p-3 bg-slate-50/50 overflow-y-auto">
              <CashBoxManager type="OPEN" expectedCash={lastClosingCash} bankBalances={bankBalancesInfo} onConfirm={onOpenCashBox} />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full gap-3 p-1 animate-in fade-in duration-500 overflow-hidden relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between mb-2 border-b pb-1.5 border-slate-50 dark:border-slate-700">
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Efectivo / Caja</span>
                    <Clock size={14} className="text-primary-400"/>
                </div>
                <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold uppercase">Apertura:</span>
                        <span className="font-black text-slate-700 dark:text-slate-300">S/ {currentSession?.countedOpening.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-1.5">
                        <span className="text-[11px] font-black text-emerald-600 uppercase">Saldo Actual:</span>
                        <span className="text-lg font-black text-slate-800 dark:text-white">S/ {currentCashActual.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {bankBalancesInfo.map(acc => (
                <div key={acc.id} className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-100 shadow-sm border-l-2 border-l-blue-400">
                    <div className="flex items-center justify-between mb-2 border-b pb-1.5 border-slate-50 dark:border-slate-700">
                        <span className="text-[11px] font-black text-slate-500 uppercase truncate max-w-[130px]">{acc.alias || acc.bankName}</span>
                        <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-700 px-1.5 rounded uppercase">{acc.currency}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Apertura:</span>
                        <span className="text-[11px] font-black text-slate-500">{formatSymbol(acc.currency)} {acc.openingBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 dark:border-slate-700 pt-1.5">
                        <span className="text-[10px] text-primary-500 font-black uppercase tracking-tighter">Actual:</span>
                        <span className="text-sm font-black text-slate-800 dark:text-white">{formatSymbol(acc.currency)} {acc.currentBalance.toFixed(2)}</span>
                    </div>
                </div>
            ))}
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-h-0">
            <div className="px-4 py-2.5 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <h3 className="font-black text-xs text-slate-700 uppercase tracking-wider whitespace-nowrap">Flujo de Turno</h3>
                    <select value={filter} onChange={e => setFilter(e.target.value as any)} className="flex-1 md:flex-none bg-white border rounded text-[10px] py-1 font-bold uppercase px-2 outline-none">
                        <option value="ALL">Todo</option><option value="CASH">Efectivo</option><option value="DIGITAL">Digital</option>
                    </select>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                    <button onClick={() => setIsTransferModalOpen(true)} className="flex-1 md:flex-none px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm"><ArrowRightLeft size={12}/> Transferir</button>
                    <button onClick={() => setIsCloseModalOpen(true)} className="flex-1 md:flex-none px-3 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm"><Lock size={12}/> Cierre</button>
                    <button onClick={() => setIsIncomeModalOpen(true)} className="flex-1 md:flex-none px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm"><Plus size={12}/> Ingreso</button>
                    <button onClick={() => setIsExpenseModalOpen(true)} className="flex-1 md:flex-none px-3 py-1.5 bg-orange-600 text-white rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm"><Minus size={12}/> Gasto</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-auto">
                <div className="min-w-[800px] md:min-w-full">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-400 font-black uppercase border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 w-20">ID Trans.</th>
                                <th className="px-4 py-3 w-20">Hora</th>
                                <th className="px-4 py-3 flex-1 min-w-[200px]">Concepto</th>
                                <th className="px-4 py-3 w-28">Metodo</th>
                                <th className="px-4 py-3 w-28">Nro Operación</th>
                                <th className="px-4 py-3 text-right w-28">Importe</th>
                                <th className="px-4 py-3 text-right w-32 bg-slate-100">Saldo Acum.</th>
                                <th className="px-4 py-3 text-center w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {displayedMovements.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 font-black text-slate-400 tracking-tighter text-xs">{m.sequentialId}</td>
                                    <td className="px-4 py-3 font-bold text-slate-500 text-xs">{m.time}</td>
                                    <td className="px-4 py-3 font-black uppercase text-slate-800 dark:text-slate-200">
                                        <div className="truncate max-w-[450px] text-xs">{m.concept}</div>
                                    </td>
                                    <td className="px-4 py-3 font-bold uppercase text-slate-600 text-[11px]">{m.paymentMethod}</td>
                                    <td className="px-4 py-3 font-mono text-primary-600 uppercase text-xs">{m.referenceId || ''}</td>
                                    <td className={`px-4 py-3 text-right font-black text-sm ${m.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {m.type === 'Ingreso' ? '+' : '-'} {m.amount.toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-black bg-slate-50/50 text-sm">S/ {m.accumulatedBalance?.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button onClick={() => setSelectedMovement(m)} className="p-1.5 text-slate-300 hover:text-primary-600 transition-all"><Eye size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {selectedMovement && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-2 md:p-4">
                <div className={`bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden transition-all duration-300 ${linkedRecord ? 'w-full max-w-lg' : 'w-full max-w-sm'}`}>
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-black text-xs text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2"><Info size={18} className="text-primary-600"/> Detalle de Operación</h3>
                        <button onClick={() => setSelectedMovement(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                    </div>
                    
                    <div className="p-8 space-y-5 max-h-[80vh] overflow-y-auto no-scrollbar">
                        {linkedRecord ? (
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-inner tabular-nums font-mono text-xs text-black">
                                <div className="text-center mb-5 border-b-2 border-dashed border-slate-300 pb-3">
                                    <h4 className="font-black text-base text-slate-800 uppercase tracking-tighter leading-none mb-1">SapiSoft ERP</h4>
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{linkedRecord.type === 'SALE' ? 'Comprobante de Venta' : 'Orden de Compra'}</p>
                                </div>
                                <div className="space-y-1.5 mb-5">
                                    <div className="flex justify-between"><span>FECHA:</span> <span>{linkedRecord.date} {linkedRecord.time}</span></div>
                                    <div className="flex justify-between"><span>DOC:</span> <span className="font-black">#{linkedRecord.id}</span></div>
                                    <div className="flex justify-between uppercase"><span>{linkedRecord.type === 'SALE' ? 'CLIENTE:' : 'PROV:'}</span> <span className="font-black truncate max-w-[170px]">{linkedRecord.type === 'SALE' ? (linkedRecord as SaleRecord).clientName : (linkedRecord as PurchaseRecord).supplierName}</span></div>
                                </div>
                                <div className="border-y border-dashed border-slate-300 py-3 mb-5">
                                    <div className="grid grid-cols-[1fr_30px_55px_55px] font-black text-[10px] mb-3 border-b border-slate-200 pb-2 uppercase"><span>Articulo</span><span className="text-center">Cant</span><span className="text-right">Unit</span><span className="text-right">Total</span></div>
                                    {linkedRecord.items.map((item: any, i: number) => (
                                        <div key={i} className="grid grid-cols-[1fr_30px_55px_55px] mb-2 last:mb-0 leading-tight">
                                            <span className="uppercase truncate pr-1">{item.name}</span>
                                            <span className="text-center font-black">{item.quantity}</span>
                                            <span className="text-right">{item.price.toFixed(0)}</span>
                                            <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-lg font-black border-b-2 border-black pb-2 mb-5">
                                    <span>TOTAL {formatSymbol(linkedRecord.currency)}</span>
                                    <span>{linkedRecord.total.toFixed(2)}</span>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[10px] font-black uppercase mb-1 underline">Formas de Pago:</p>
                                    {linkedRecord.detailedPayments && linkedRecord.detailedPayments.length > 0 ? (
                                        linkedRecord.detailedPayments.map((p: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                                                <span>{p.method} {p.bankName ? `(${p.bankName})` : ''}</span>
                                                <span>{formatSymbol(linkedRecord.currency)} {p.amount.toFixed(2)}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase">
                                            <span>EFECTIVO</span>
                                            <span>{formatSymbol(linkedRecord.currency)} {linkedRecord.total.toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="text-center text-[10px] font-bold text-slate-400 uppercase mt-8 border-t border-dashed pt-4">Copia de Auditoría de Caja</div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col items-center text-center pb-6 border-b border-slate-50 dark:border-slate-700">
                                     <div className="flex items-center gap-2 mb-1.5">
                                        <Fingerprint size={14} className="text-slate-300"/>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ID: {selectedMovement.sequentialId}</span>
                                     </div>
                                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{selectedMovement.type === 'Ingreso' ? 'INGRESO RECIBIDO' : 'EGRESO REALIZADO'}</p>
                                     <div className={`text-5xl font-black ${selectedMovement.type === 'Ingreso' ? 'text-emerald-600' : 'text-red-600'}`}>S/ {selectedMovement.amount.toFixed(2)}</div>
                                     <div className="mt-3 text-[10px] font-black bg-slate-100 dark:bg-slate-700 text-slate-500 px-3 py-1 rounded-full uppercase">{selectedMovement.category || 'VARIOS'}</div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Concepto:</span><span className="text-xs font-black text-slate-800 dark:text-white uppercase text-right leading-tight max-w-[180px]">{selectedMovement.concept}</span></div>
                                    <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Método:</span><span className="text-xs font-black text-slate-800 dark:text-white uppercase">{selectedMovement.paymentMethod}</span></div>
                                    {selectedMovement.referenceId && <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Nro. Operación:</span><span className="text-xs font-black text-primary-600 font-mono">{selectedMovement.referenceId}</span></div>}
                                    {selectedMovement.accountId && <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Cuenta:</span><span className="text-xs font-black text-slate-800 dark:text-white uppercase text-right">{bankAccounts.find(b=>b.id===selectedMovement.accountId)?.alias || 'Banco'}</span></div>}
                                    <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Responsable:</span><span className="text-xs font-black text-slate-800 dark:text-white uppercase flex items-center gap-1.5"><User size={12}/> {selectedMovement.user}</span></div>
                                    <div className="flex justify-between"><span className="text-[11px] font-bold text-slate-400 uppercase">Momento:</span><span className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">{selectedMovement.date} {selectedMovement.time}</span></div>
                                </div>
                            </>
                        )}
                        <button onClick={() => setSelectedMovement(null)} className="w-full py-5 mt-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Cerrar</button>
                    </div>
                </div>
            </div>
        )}

        {isTransferModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[1000] flex items-center justify-center p-2 md:p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-sm shadow-2xl border border-white/20 animate-in zoom-in-95">
                    <div className="p-5 bg-blue-600 text-white flex justify-between items-center rounded-t-3xl">
                        <h3 className="font-black text-xs uppercase tracking-widest">TRANSFERIR FONDOS</h3>
                        <button onClick={() => setIsTransferModalOpen(false)}><X size={20}/></button>
                    </div>
                    <div className="p-7 space-y-5">
                        <div className="space-y-1.5">
                             <label className="text-[11px] font-black text-slate-500 uppercase text-center block">Monto a Enviar</label>
                             <input type="number" className="w-full p-4 bg-slate-50 border-2 rounded-2xl text-4xl font-black text-center text-blue-600 outline-none focus:border-blue-500" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00"/>
                        </div>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                            <div className="min-w-0">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block">Desde</label>
                                <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none uppercase truncate" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                                    <option value="CASH">Caja</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                                </select>
                            </div>
                            <ArrowRight size={18} className="text-slate-300 mt-5 shrink-0"/>
                            <div className="min-w-0">
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block">Hacia</label>
                                <select className="w-full p-2.5 bg-slate-50 border rounded-xl text-xs font-bold outline-none uppercase truncate" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                                    <option value="">Destino</option>
                                    <option value="CASH">Caja</option>
                                    {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3">
                             <input type="text" className="w-full p-3 bg-slate-50 border rounded-2xl text-sm font-black uppercase outline-none focus:border-blue-500" placeholder="Nro Operación / CCI" value={transferData.operationNumber} onChange={e => setTransferData({...transferData, operationNumber: e.target.value})} />
                             <input type="text" className="w-full p-3 bg-slate-50 border rounded-2xl text-xs uppercase outline-none focus:border-blue-500" placeholder="Referencia (Opcional)" value={transferData.reference} onChange={e => setTransferData({...transferData, reference: e.target.value})} />
                        </div>
                        <button onClick={handleExecuteTransfer} className="w-full py-5 bg-blue-600 text-white rounded-2xl uppercase text-[11px] font-black shadow-lg active:scale-95 transition-all">Confirmar Transferencia</button>
                    </div>
                </div>
            </div>
        )}

        {isCloseModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-2 md:p-4">
                <CashBoxManager type="CLOSE" expectedCash={currentCashActual} bankBalances={bankBalancesInfo} onCancel={() => setIsCloseModalOpen(false)} onConfirm={(c, n, b) => { onCloseCashBox(c, currentCashActual, 0, n, b); setIsCloseModalOpen(false); }} />
            </div>
        )}

        {(isIncomeModalOpen || isExpenseModalOpen) && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-2 md:p-4">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-white/10 animate-in zoom-in-95">
                    <div className={`p-5 flex justify-between items-center ${isIncomeModalOpen ? 'bg-emerald-600' : 'bg-orange-600'} text-white`}>
                        <h3 className="font-black text-xs uppercase tracking-widest">{isIncomeModalOpen ? 'REGISTRAR INGRESO' : 'REGISTRAR GASTO'}</h3>
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }}><X size={20}/></button>
                    </div>
                    <div className="p-7 space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <select className="p-3 bg-slate-50 border rounded-2xl text-[11px] font-black uppercase outline-none focus:border-primary-500" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                <option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="Yape">Yape</option><option value="Tarjeta">Tarjeta</option>
                            </select>
                            <select className="p-3 bg-slate-50 border rounded-2xl text-[11px] font-black uppercase outline-none focus:border-primary-500" value={financialType} onChange={e => { setFinancialType(e.target.value as any); setCategory(''); }}>
                                <option value="">-- TIPO --</option><option value="Variable">Variable</option><option value="Fijo">Fijo</option>
                            </select>
                        </div>

                        {financialType === 'Fijo' && (
                            <div className="space-y-1.5 animate-in slide-in-from-top-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 block">{isIncomeModalOpen ? 'Ingreso' : 'Gasto'} Fijo</label>
                                <div className="relative">
                                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <select 
                                        className="w-full pl-10 pr-10 p-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:border-primary-500 appearance-none cursor-pointer"
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                    >
                                        <option value="">-- SELECCIONAR --</option>
                                        {(isIncomeModalOpen ? fixedIncomeCategories : fixedExpenseCategories).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18}/>
                                </div>
                            </div>
                        )}

                        {paymentMethod !== 'Efectivo' && (
                            <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <select className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none focus:border-primary-500" value={bankAccountId} onChange={e => setBankAccountId(e.target.value)}><option value="">-- Banco --</option>{bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName}</option>)}</select>
                                <input type="text" className="w-full p-2.5 bg-white border rounded-xl text-xs font-bold outline-none uppercase focus:border-primary-500" value={operationNumber} onChange={e => setOperationNumber(e.target.value)} placeholder="Nro Operación" />
                            </div>
                        )}
                        <input type="text" className="w-full p-3.5 bg-slate-50 border rounded-2xl text-sm font-bold uppercase outline-none focus:border-primary-500" value={concept} onChange={e => setConcept(e.target.value)} placeholder="Concepto..." />
                        <div className="relative">
                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 italic">S/</span>
                            <input type="number" className="w-full pl-14 p-5 bg-slate-50 border-2 rounded-[2rem] text-5xl font-black text-slate-800 outline-none focus:border-primary-500 shadow-inner" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <div className="p-5 bg-slate-50 border-t flex gap-3">
                        <button onClick={() => { setIsIncomeModalOpen(false); setIsExpenseModalOpen(false); }} className="flex-1 py-4 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-100 rounded-2xl transition-all">Cancelar</button>
                        <button onClick={() => handleSaveMovement(isIncomeModalOpen ? 'Ingreso' : 'Egreso')} className={`flex-[2] py-4 text-white font-black uppercase text-[11px] rounded-2xl shadow-lg transition-all active:scale-95 ${isIncomeModalOpen ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-orange-600 hover:bg-orange-700'}`}>Guardar Movimiento</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CashModule;
