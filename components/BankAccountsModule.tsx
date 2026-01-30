
import React, { useState } from 'react';
import { Landmark, Plus, Trash2, Search, Building2, CreditCard, ArrowRightLeft, X, ArrowRight, Edit3, Lock, Check, ShoppingCart, ShoppingBag, Hash } from 'lucide-react';
import { BankAccount } from '../types';

interface BankAccountsModuleProps {
    bankAccounts: BankAccount[];
    onAddBankAccount: (b: BankAccount) => void;
    onUpdateBankAccount: (account: BankAccount) => void;
    onDeleteBankAccount: (id: string) => void;
    // Updated to expect 6 arguments to match App.tsx
    onUniversalTransfer: (from: string, to: string, amount: number, exchangeRate: number, reference: string, opNumber: string) => void;
}

export const BankAccountsModule: React.FC<BankAccountsModuleProps> = ({ bankAccounts, onAddBankAccount, onUpdateBankAccount, onDeleteBankAccount, onUniversalTransfer }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', currency: 'PEN', alias: '', useInSales: true, useInPurchases: true });
    
    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
    const [adminPassword, setAdminPassword] = useState('');
    
    // Transfer Modal State
    // Updated transferData to include opNumber
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferData, setTransferData] = useState({ from: '', to: '', amount: '', rate: '', reference: '', opNumber: '' });

    const filteredBanks = bankAccounts.filter(item => 
        (item.bankName && item.bankName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.alias && item.alias.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAdd = () => {
        if (newBank.bankName && newBank.accountNumber) {
            onAddBankAccount({ id: Math.random().toString(), ...newBank } as BankAccount);
            setNewBank({ bankName: '', accountNumber: '', currency: 'PEN', alias: '', useInSales: true, useInPurchases: true });
        } else {
             alert("Banco y Nro de Cuenta son obligatorios");
        }
    };
    
    const handleDeleteWithAuth = (id: string, name: string) => {
        const password = prompt(`Para eliminar la cuenta "${name}", ingrese la contraseña de administrador:`);
        if (password === '1234') { // Mock admin password
            onDeleteBankAccount(id);
            alert(`Cuenta "${name}" eliminada.`);
        } else if (password !== null) { // User didn't click cancel
            alert("Contraseña incorrecta. Acción cancelada.");
        }
    };
    
    const handleOpenEditModal = (bank: BankAccount) => {
        setEditingBank({ ...bank }); // Create a copy to edit
        setAdminPassword('');
        setShowEditModal(true);
    };

    const handleSaveChanges = () => {
        if (adminPassword !== '1234') {
            alert('Contraseña de administrador incorrecta.');
            return;
        }
        if (editingBank) {
            onUpdateBankAccount(editingBank);
        }
        setShowEditModal(false);
        setEditingBank(null);
    };

    const handleOpenTransferModal = () => {
        setTransferData({ from: '', to: '', amount: '', rate: '', reference: '', opNumber: '' });
        setShowTransferModal(true);
    };

    const fromAccount = bankAccounts.find(b => b.id === transferData.from);
    const toAccount = bankAccounts.find(b => b.id === transferData.to);
    const showExchangeRate = fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

    const handleExecuteTransfer = () => {
        const amountNum = parseFloat(transferData.amount);
        const rateNum = parseFloat(transferData.rate || '1');
        
        if (!transferData.from || !transferData.to) return alert("Debe seleccionar cuenta de origen y destino.");
        if (isNaN(amountNum) || amountNum <= 0) return alert("Monto inválido.");
        if (showExchangeRate && (isNaN(rateNum) || rateNum <= 0)) return alert("Tipo de cambio inválido.");
        if (!transferData.opNumber) return alert("Ingrese el Nro de Operación.");

        // Call with 6 arguments as expected by App.tsx
        onUniversalTransfer(transferData.from, transferData.to, amountNum, rateNum, transferData.reference, transferData.opNumber);
        setShowTransferModal(false);
    };

    return (
        <div className="flex h-full gap-6">
            
            {/* Left: Form */}
            <div className="w-96 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col shrink-0">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <Plus size={20} className="text-emerald-500 dark:text-emerald-400"/> Nueva Cuenta
                </h3>
                
                <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Entidad Bancaria</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:border-emerald-500 transition-colors" value={newBank.bankName} onChange={e => setNewBank({...newBank, bankName: e.target.value})} placeholder="Ej. BCP, INTERBANK"/></div>
                    <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nro. Cuenta / CCI</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:border-emerald-500 transition-colors" value={newBank.accountNumber} onChange={e => setNewBank({...newBank, accountNumber: e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Moneda</label><select className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:border-emerald-500 transition-colors" value={newBank.currency} onChange={e => setNewBank({...newBank, currency: e.target.value as any})}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></div>
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Titular / Alias</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none focus:border-emerald-500 transition-colors" value={newBank.alias} onChange={e => setNewBank({...newBank, alias: e.target.value})} placeholder="Ej. Cuenta Principal"/></div>
                    </div>
                    
                    <div className="pt-2 space-y-3">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Habilitar Uso en:</label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${newBank.useInSales ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <input type="checkbox" className="hidden" checked={newBank.useInSales} onChange={e => setNewBank({...newBank, useInSales: e.target.checked})} />
                                <ShoppingCart size={16}/> <span className="text-[10px] font-black uppercase">Ventas</span>
                            </label>
                            <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${newBank.useInPurchases ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <input type="checkbox" className="hidden" checked={newBank.useInPurchases} onChange={e => setNewBank({...newBank, useInPurchases: e.target.checked})} />
                                <ShoppingBag size={16}/> <span className="text-[10px] font-black uppercase">Compras</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <div className="mt-6 space-y-3">
                    <button onClick={handleAdd} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 dark:shadow-none uppercase text-xs tracking-widest font-black">
                        Guardar Cuenta
                    </button>
                    <button onClick={handleOpenTransferModal} className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-bold rounded-xl hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
                        <ArrowRightLeft size={16}/> Transferir entre Cuentas
                    </button>
                </div>
            </div>

            {/* Right: List */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 bg-slate-50/50 dark:bg-slate-700/30">
                     <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><Landmark size={20}/></div>
                     <div className="flex-1"><h2 className="font-bold text-slate-700 dark:text-white uppercase tracking-tight text-sm">Catálogo de Cuentas Bancarias</h2><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredBanks.length} cuentas registradas</p></div>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/><input type="text" className="pl-9 pr-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm w-64 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/30 outline-none text-slate-800 dark:text-white placeholder-slate-400 transition-colors" placeholder="Buscar banco..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
                </div>
                <div className="flex-1 overflow-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
                    {filteredBanks.map((b) => (
                        <div key={b.id} className="relative overflow-hidden border border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 hover:border-emerald-200 dark:hover:border-emerald-900 transition-colors group bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900/50 shadow-sm">
                            <div className="absolute right-0 top-0 p-4 opacity-10 dark:opacity-5"><Building2 size={64} className="dark:text-white"/></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <div className="font-black text-slate-800 dark:text-slate-200 text-lg flex items-center gap-2 uppercase tracking-tighter">{b.bankName}<span className={`px-2 py-0.5 rounded text-[10px] font-black ${b.currency === 'PEN' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>{b.currency}</span></div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest mt-1">{b.alias}</div>
                                    <div className="flex gap-1.5 mt-3">
                                        {b.useInSales && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-[8px] font-black rounded uppercase flex items-center gap-1"><ShoppingCart size={8}/> Ventas</span>}
                                        {b.useInPurchases && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[8px] font-black rounded uppercase flex items-center gap-1"><ShoppingBag size={8}/> Compras</span>}
                                        {!b.useInSales && !b.useInPurchases && <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black rounded uppercase">Interno</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenEditModal(b)} className="p-2 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600"><Edit3 size={16}/></button>
                                    <button onClick={() => handleDeleteWithAuth(b.id, b.alias || b.bankName)} className="p-2 bg-white dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600"><Trash2 size={16}/></button>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 p-3 rounded-xl flex items-center gap-3 relative z-10 shadow-inner"><CreditCard size={20} className="text-slate-400 dark:text-slate-500"/><span className="font-mono text-base font-black text-slate-600 dark:text-slate-200 tracking-wider">{b.accountNumber}</span></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* EDIT MODAL */}
            {showEditModal && editingBank && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2"><Edit3 size={20} className="text-blue-500"/> Editar Cuenta</h3>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Entidad Bancaria</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none font-bold" value={editingBank.bankName} onChange={e => setEditingBank({...editingBank, bankName: e.target.value})}/></div>
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Nro. Cuenta / CCI</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none font-bold" value={editingBank.accountNumber} onChange={e => setEditingBank({...editingBank, accountNumber: e.target.value})}/></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Moneda</label><select className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none font-bold" value={editingBank.currency} onChange={e => setEditingBank({...editingBank, currency: e.target.value as any})}><option value="PEN">Soles (PEN)</option><option value="USD">Dólares (USD)</option></select></div>
                                <div><label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block mb-1">Alias</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-lg outline-none font-bold" value={editingBank.alias} onChange={e => setEditingBank({...editingBank, alias: e.target.value})}/></div>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Configuración de Uso</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${editingBank.useInSales ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <input type="checkbox" className="hidden" checked={editingBank.useInSales} onChange={e => setEditingBank({...editingBank, useInSales: e.target.checked})} />
                                        <ShoppingCart size={20}/> <span className="text-[11px] font-black uppercase">Ventas</span>
                                    </label>
                                    <label className={`flex items-center gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-all ${editingBank.useInPurchases ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                        <input type="checkbox" className="hidden" checked={editingBank.useInPurchases} onChange={e => setEditingBank({...editingBank, useInPurchases: e.target.checked})} />
                                        <ShoppingBag size={20}/> <span className="text-[11px] font-black uppercase">Compras</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                                <label className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] block mb-2">Seguridad: Clave Admin</label>
                                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/><input type="password" placeholder="****" className="w-full pl-12 p-4 border border-slate-200 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-950 text-slate-800 dark:text-white text-2xl tracking-[0.5em] text-center" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} /></div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setShowEditModal(false)} className="flex-1 py-4 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all">Cancelar</button>
                                <button onClick={handleSaveChanges} className="flex-1 py-4 bg-primary-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-primary-700 shadow-xl active:scale-95 transition-all">Guardar Cambios</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TRANSFER MODAL */}
            {showTransferModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-[500px] animate-in fade-in zoom-in-95 border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 uppercase tracking-tighter"><ArrowRightLeft size={20} className="text-blue-500"/> Transferencia Bancaria</h3>
                            <button onClick={() => setShowTransferModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Origen</label>
                                    <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" value={transferData.from} onChange={e => setTransferData({...transferData, from: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({b.currency})</option>)}
                                    </select>
                                </div>
                                <div className="text-center pb-4"><ArrowRight size={24} className="text-slate-400"/></div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Destino</label>
                                    <select className="w-full p-3 border rounded-lg bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" value={transferData.to} onChange={e => setTransferData({...transferData, to: e.target.value})}>
                                        <option value="">-- Seleccionar --</option>
                                        {bankAccounts.filter(b => b.id !== transferData.from).map(b => <option key={b.id} value={b.id}>{b.alias || b.bankName} ({b.currency})</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className={`grid gap-4 ${showExchangeRate ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Monto a Enviar ({fromAccount?.currency})</label>
                                    <input type="number" className="w-full p-3 border rounded-lg text-lg font-bold bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" value={transferData.amount} onChange={e => setTransferData({...transferData, amount: e.target.value})} placeholder="0.00"/>
                                </div>
                                {showExchangeRate && (
                                    <div className="animate-in fade-in">
                                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Tipo de Cambio</label>
                                        <input type="number" step="0.01" className="w-full p-3 border rounded-lg text-lg font-bold bg-yellow-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" value={transferData.rate} onChange={e => setTransferData({...transferData, rate: e.target.value})} placeholder="Ej. 3.75"/>
                                        <p className="text-[10px] text-slate-400 mt-1">1 {fromAccount?.currency === 'USD' ? 'USD' : 'PEN'} = {transferData.rate || '?'} {fromAccount?.currency === 'USD' ? 'PEN' : 'USD'}</p>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nro. Operación / CCI</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                                        <input type="text" className="w-full pl-9 p-3 border rounded-lg text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white uppercase font-bold outline-none focus:border-blue-500" value={transferData.opNumber} onChange={e => setTransferData({...transferData, opNumber: e.target.value})} placeholder="Ej. 123456"/>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Referencia / Glosa (Opcional)</label>
                                    <input type="text" className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white" value={transferData.reference} onChange={e => setTransferData({...transferData, reference: e.target.value})} placeholder="Ej. Capital de trabajo"/>
                                </div>
                            </div>
                            <button onClick={handleExecuteTransfer} className="w-full mt-2 py-3 bg-blue-600 text-white font-bold rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg hover:bg-blue-700">Confirmar Transferencia</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankAccountsModule;
