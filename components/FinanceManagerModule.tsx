
import React, { useState } from 'react';
import { Landmark, Receipt, Plus, ArrowRight, TrendingUp, TrendingDown, X, Trash2, Search, List, Tag, Settings2 } from 'lucide-react';

interface FinanceManagerProps {
    activeTab: 'EXPENSES' | 'INCOME';
    categories: string[];
    onAddCategory: (category: string) => void;
    onDeleteCategory: (category: string) => void;
}

export const FinanceManagerModule: React.FC<FinanceManagerProps> = ({ activeTab, categories, onAddCategory, onDeleteCategory }) => {
    
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryName, setCategoryName] = useState('');

    const config = activeTab === 'EXPENSES' 
        ? { color: 'red', icon: TrendingDown, title: 'Maestro de Gastos Fijos', label: 'Gasto' }
        : { color: 'emerald', icon: TrendingUp, title: 'Maestro de Ingresos Fijos', label: 'Ingreso' };

    const filteredCategories = categories.filter(c => 
        c.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveCategory = () => {
        if (!categoryName.trim()) {
            alert("Ingrese un nombre para la categoría.");
            return;
        }
        
        if (categories.some(c => c.toUpperCase() === categoryName.trim().toUpperCase())) {
            alert("Esta categoría ya existe.");
            return;
        }

        onAddCategory(categoryName.trim());
        setCategoryName('');
        setShowAddModal(false);
    };
    
    const handleDelete = (cat: string) => {
        if (confirm(`¿Está seguro de eliminar la categoría "${cat}"? Esto no afectará movimientos ya registrados.`)) {
            onDeleteCategory(cat);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in overflow-hidden">
            {/* Header Informativo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
                <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600 dark:text-${config.color}-400 rounded-xl`}>
                            <config.icon size={28}/>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{config.title}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina conceptos recurrentes para su uso en Caja Chica</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Categorías Totales</p>
                        <p className={`text-2xl font-black text-${config.color}-600 dark:text-${config.color}-400`}>{categories.length}</p>
                    </div>
                </div>

                <button onClick={() => setShowAddModal(true)} className={`w-full py-4 bg-${config.color}-600 text-white rounded-3xl font-black shadow-lg shadow-${config.color}-200 dark:shadow-none hover:brightness-110 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase text-[11px] tracking-widest`}>
                    <Plus size={18}/> AGREGAR NUEVA CATEGORÍA
                </button>
            </div>

            {/* Listado de Categorías */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4 px-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                        <Tag size={14}/> Catálogo de Conceptos Predeterminados
                    </h4>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-[10px] outline-none font-bold"
                            placeholder="BUSCAR CATEGORÍA..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredCategories.length === 0 ? (
                            <div className="col-span-full py-20 text-center text-slate-300 font-black uppercase tracking-widest italic opacity-50">Sin registros encontrados</div>
                        ) : filteredCategories.map((cat, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-primary-300 transition-all flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs border border-slate-100 dark:border-slate-700">
                                        {idx + 1}
                                    </div>
                                    <span className="font-black text-slate-700 dark:text-slate-200 uppercase text-xs tracking-tight">{cat}</span>
                                </div>
                                <button onClick={() => handleDelete(cat)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3 px-8 shrink-0">
                    <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-400">
                        <Settings2 size={16}/>
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-tighter max-w-2xl">
                        Estas categorías estarán disponibles en el módulo de Caja Chica al registrar un {config.label} de tipo "Fijo", permitiendo una clasificación más precisa de sus gastos e ingresos recurrentes.
                    </p>
                </div>
            </div>

            {/* Modal para Nueva Categoría */}
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-[400px] shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className={`px-8 py-5 flex justify-between items-center text-white bg-${config.color}-600`}>
                            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Plus size={18}/> Nueva Categoría
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="hover:bg-white/20 p-1 rounded transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Nombre de la Categoría</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 border-2 border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white font-black text-xs uppercase outline-none focus:border-primary-500 transition-colors" 
                                    value={categoryName} 
                                    onChange={e => setCategoryName(e.target.value)} 
                                    placeholder="EJ. LUZ, AGUA, ALQUILER..." 
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveCategory()}
                                />
                            </div>
                            <button onClick={handleSaveCategory} className={`w-full py-4 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-[11px] tracking-widest bg-${config.color}-600 hover:brightness-110`}>
                                Registrar Categoría
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceManagerModule;
