
import React, { useState, useMemo } from 'react';
import { Truck, Plus, Trash2, Search, MapPin, Phone, FileText, X, User, DollarSign, ArrowRight, TrendingUp, History, Info, Building2, ExternalLink, ChevronRight } from 'lucide-react';
import { Supplier, PurchaseRecord } from '../types';

interface SuppliersModuleProps {
    suppliers: Supplier[];
    onAddSupplier: (s: Supplier) => void;
    onDeleteSupplier: (id: string) => void;
    purchasesHistory: PurchaseRecord[];
}

export const SuppliersModule: React.FC<SuppliersModuleProps> = ({ suppliers, onAddSupplier, onDeleteSupplier, purchasesHistory }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
    const [newSupplier, setNewSupplier] = useState({ name: '', ruc: '', phone: '', address: '', contactName: '', email: '' });

    // Helper de normalización para búsqueda inteligente
    const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    // --- CÁLCULO DE ESTADÍSTICAS POR PROVEEDOR ---
    const supplierStats = useMemo(() => {
        const stats: Record<string, { total: number, pending: number, count: number }> = {};
        
        suppliers.forEach(s => {
            const history = purchasesHistory.filter(p => p.supplierName === s.name);
            stats[s.id] = {
                total: history.reduce((acc, p) => acc + p.total, 0),
                pending: history.filter(p => p.paymentCondition === 'Credito').reduce((acc, p) => acc + p.total, 0),
                count: history.length
            };
        });
        return stats;
    }, [suppliers, purchasesHistory]);

    const filteredSuppliers = suppliers.filter(item => {
        const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
        const targetString = normalize(`${item.name} ${item.ruc} ${item.contactName || ""}`);
        
        return searchTerm === '' || searchWords.every(word => targetString.includes(word));
    });

    const handleAdd = () => {
        if (newSupplier.name) {
            onAddSupplier({ id: Math.random().toString(), ...newSupplier });
            setNewSupplier({ name: '', ruc: '', phone: '', address: '', contactName: '', email: '' });
            setShowModal(false);
        } else { 
            alert("La Razón Social es obligatoria"); 
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl">
                        <Truck size={24}/>
                    </div>
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                        <input 
                            type="text" 
                            placeholder="Buscar por Razón Social o RUC..." 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 text-slate-900 dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-orange-600 text-white px-6 py-2.5 rounded-2xl text-xs font-black hover:bg-orange-700 shadow-lg shadow-orange-200 dark:shadow-none flex items-center gap-2 transition-all active:scale-95 uppercase tracking-widest"
                >
                    <Plus size={16}/> Registrar Proveedor
                </button>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                <div className="w-full lg:w-2/5 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredSuppliers.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700 text-slate-300 p-10">
                            <Truck size={64} strokeWidth={1} className="mb-4 opacity-20"/>
                            <p className="font-black uppercase text-[10px] tracking-widest">No se encontraron proveedores</p>
                        </div>
                    ) : filteredSuppliers.map(s => (
                        <div 
                            key={s.id} 
                            onClick={() => setSelectedSupplier(s)}
                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative group ${
                                selectedSupplier?.id === s.id 
                                ? 'bg-white dark:bg-slate-800 border-orange-500 shadow-lg ring-4 ring-orange-500/5' 
                                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-slate-800 dark:text-white text-sm uppercase truncate mb-1">{s.name}</div>
                                    <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                        <span className="flex items-center gap-1"><FileText size={12}/> {s.ruc}</span>
                                        {supplierStats[s.id]?.pending > 0 && (
                                            <span className="text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                DEUDA: S/ {supplierStats[s.id].pending.toFixed(2)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total Compras</div>
                                    <div className="text-sm font-black text-slate-700 dark:text-slate-200">S/ {supplierStats[s.id]?.total.toFixed(2)}</div>
                                </div>
                            </div>
                            <ChevronRight size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all ${selectedSupplier?.id === s.id ? 'opacity-100 text-orange-500' : 'opacity-0'}`}/>
                        </div>
                    ))}
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-colors">
                    {selectedSupplier ? (
                        <div className="flex flex-col h-full">
                            <div className="p-8 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-start">
                                <div className="flex gap-5">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/20">
                                        <Building2 size={32}/>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase leading-none tracking-tighter">{selectedSupplier.name}</h2>
                                        <p className="text-slate-400 font-bold text-xs mt-2 flex items-center gap-2">
                                            RUC {selectedSupplier.ruc} <span className="w-1 h-1 rounded-full bg-slate-300"></span> 
                                            {selectedSupplier.contactName && `Contacto: ${selectedSupplier.contactName}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onDeleteSupplier(selectedSupplier.id)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all" title="Eliminar Proveedor"><Trash2 size={20}/></button>
                                </div>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-700">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><History size={14}/> Frecuencia</p>
                                        <div className="text-2xl font-black text-slate-800 dark:text-white">{supplierStats[selectedSupplier.id]?.count} <span className="text-xs font-bold text-slate-400">Ordenes</span></div>
                                    </div>
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 rounded-3xl border border-emerald-100 dark:border-emerald-900/50">
                                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14}/> Total Surtido</p>
                                        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">S/ {supplierStats[selectedSupplier.id]?.total.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-950/20 p-5 rounded-3xl border border-rose-100 dark:border-rose-900/50">
                                        <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2"><DollarSign size={14}/> Deuda Pendiente</p>
                                        <div className="text-2xl font-black text-rose-600 dark:text-rose-400">S/ {supplierStats[selectedSupplier.id]?.pending.toFixed(2)}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700 pb-2">Datos de Ubicación y Comunicación</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><MapPin size={18}/></div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Dirección Fiscal</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase leading-relaxed">{selectedSupplier.address || 'NO REGISTRADA'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><Phone size={18}/></div>
                                            <div>
                                                <p className="text-[9px] font-black text-slate-400 uppercase">Teléfono / WhatsApp</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{selectedSupplier.phone || 'SIN TELÉFONO'}</p>
                                            </div>
                                        </div>
                                        {selectedSupplier.email && (
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><ExternalLink size={18}/></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase">Correo Electrónico</p>
                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 lowercase">{selectedSupplier.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 p-10 text-center">
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-[2rem] flex items-center justify-center mb-6">
                                <Info size={48} className="opacity-20"/>
                            </div>
                            <h3 className="font-black text-slate-400 uppercase tracking-widest mb-2">Información del Proveedor</h3>
                            <p className="text-xs font-bold text-slate-400 max-w-xs leading-relaxed uppercase tracking-tighter">
                                Seleccione un proveedor de la lista para ver su estado de cuenta, historial de compras y datos de contacto.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-black text-base text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                                <Truck className="text-orange-600" size={24}/> Registrar Nuevo Proveedor
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Razón Social / Nombre Comercial</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold uppercase outline-none focus:border-orange-500 shadow-sm text-sm" value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value.toUpperCase()})} placeholder="EJ. IMPORTACIONES TECNO S.A.C." autoFocus />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">RUC / Identificación Fiscal</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold outline-none focus:border-orange-500 text-sm" value={newSupplier.ruc} onChange={e => setNewSupplier({...newSupplier, ruc: e.target.value})} placeholder="2060..." />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Teléfono de Contacto</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold outline-none focus:border-orange-500 text-sm" value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})} placeholder="999..." />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección Legal</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold uppercase outline-none focus:border-orange-500 text-sm" value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="AV. LAS MALVINAS 123" />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre del Contacto (Vendedor)</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold uppercase outline-none focus:border-orange-500 text-sm" value={newSupplier.contactName} onChange={e => setNewSupplier({...newSupplier, contactName: e.target.value})} placeholder="EJ. CARLOS RODRIGUEZ" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Email</label>
                                    <input type="email" className="w-full p-4 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold outline-none focus:border-orange-500 text-sm" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="proveedor@gmail.com" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-6">
                                <button onClick={() => setShowModal(false)} className="px-10 py-4 text-slate-500 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[1.5rem] transition-all uppercase tracking-widest text-xs">Cancelar</button>
                                <button onClick={handleAdd} className="px-12 py-4 bg-orange-600 text-white font-black rounded-[1.5rem] hover:bg-orange-700 shadow-xl shadow-orange-200 dark:shadow-none transition-all text-xs uppercase tracking-widest">Guardar Proveedor</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersModule;
