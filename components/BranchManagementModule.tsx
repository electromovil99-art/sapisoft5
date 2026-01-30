
import React, { useState } from 'react';
import { Store, Plus, MapPin, Phone, Trash2, Edit3, Save, X, ArrowRightLeft, ShieldCheck, Info, Copy, LogIn } from 'lucide-react';
import { Branch } from '../types';

interface BranchManagementProps {
    branches: Branch[];
    onAddBranch: (name: string, address: string, phone: string) => void;
    onUpdateBranch: (branch: Branch) => void;
    onDeleteBranch: (id: string) => void;
    onCloneBranch: (sourceBranchId: string, newName: string) => void;
    onSwitchBranch: (id: string) => void;
    currentBranchId: string;
}

const BranchManagementModule: React.FC<BranchManagementProps> = ({ 
    branches, onAddBranch, onUpdateBranch, onDeleteBranch, onCloneBranch, onSwitchBranch, currentBranchId 
}) => {
    const [showModal, setShowModal] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [formData, setFormData] = useState({ name: '', address: '', phone: '' });

    const openCreateModal = () => {
        setEditingBranch(null);
        setFormData({ name: '', address: '', phone: '' });
        setShowModal(true);
    };

    const openEditModal = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({ name: branch.name, address: branch.address || '', phone: branch.phone || '' });
        setShowModal(true);
    };

    const handleClone = (branch: Branch) => {
        const newName = prompt(`Ingrese el nombre para la copia de "${branch.name}":`, `${branch.name} (Copia)`);
        if (newName && newName.trim()) {
            onCloneBranch(branch.id, newName.trim());
        }
    };

    const handleSave = () => {
        if (!formData.name.trim()) return alert("El nombre de la sucursal es obligatorio.");

        if (editingBranch) {
            onUpdateBranch({ ...editingBranch, ...formData });
        } else {
            onAddBranch(formData.name, formData.address, formData.phone);
        }
        setShowModal(false);
    };

    const handleDelete = (id: string) => {
        if (confirm("¿Está seguro de eliminar esta sucursal? Se perderá el acceso a su historial local si no se ha respaldado.")) {
            onDeleteBranch(id);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                        <Store size={24}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Gestión de Sucursales</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Administra tus puntos de venta y almacenes</p>
                    </div>
                </div>
                <button 
                    onClick={openCreateModal}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={16}/> Nueva Sucursal
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
                {/* Branch List */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto content-start pb-4 pr-1 custom-scrollbar">
                    {branches.map(branch => {
                        const isActive = currentBranchId === branch.id;
                        return (
                            <div key={branch.id} className={`p-6 rounded-[2rem] border shadow-sm relative group transition-all flex flex-col ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${branch.isMain ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                        <Store size={24}/>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        {branch.isMain && (
                                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] font-black uppercase rounded-lg border border-amber-200 dark:border-amber-800">
                                                Principal
                                            </span>
                                        )}
                                        {isActive && (
                                            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-lg shadow-md animate-pulse">
                                                Activa
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 truncate">{branch.name}</h3>
                                
                                <div className="space-y-2 mb-6 flex-1">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <MapPin size={14}/>
                                        <span className="text-xs font-bold uppercase truncate">{branch.address || 'Sin dirección'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                        <Phone size={14}/>
                                        <span className="text-xs font-bold uppercase truncate">{branch.phone || 'Sin teléfono'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {/* Botón de Ingreso Directo */}
                                    <button 
                                        onClick={() => onSwitchBranch(branch.id)}
                                        disabled={isActive}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-2 transition-all ${isActive ? 'bg-emerald-100 text-emerald-700 cursor-default opacity-80' : 'bg-slate-900 text-white hover:bg-indigo-600 shadow-lg active:scale-95'}`}
                                    >
                                        {isActive ? <><ShieldCheck size={14}/> Trabajando Aquí</> : <><LogIn size={14}/> Ingresar a Sede</>}
                                    </button>

                                    <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                                        <button onClick={() => openEditModal(branch)} className="flex-1 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-[10px] uppercase hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                            <Edit3 size={14}/> Editar
                                        </button>
                                        
                                        <button onClick={() => handleClone(branch)} className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all border border-transparent hover:border-indigo-100" title="Crear Copia Exacta">
                                            <Copy size={16}/>
                                        </button>

                                        {!branch.isMain && (
                                            <button onClick={() => handleDelete(branch.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-100" title="Eliminar">
                                                <Trash2 size={16}/>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Info Panel */}
                <div className="w-full md:w-80 flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                            <Info size={20}/>
                            <h4 className="font-black text-xs uppercase tracking-widest">Modelo Operativo</h4>
                        </div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                            El sistema opera bajo un modelo de <strong>Inventario y Caja Independientes</strong>.
                        </p>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <div className="min-w-[4px] h-4 bg-emerald-500 rounded-full mt-0.5"></div>
                                <p>Al crear una sede, el <strong>Stock inicia en 0</strong> y la <strong>Caja cerrada</strong>.</p>
                            </li>
                            <li className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <div className="min-w-[4px] h-4 bg-indigo-500 rounded-full mt-0.5"></div>
                                <p>Al <strong>Clonar</strong> (<Copy size={10} className="inline"/>), se copiará todo el inventario actual a la nueva sede.</p>
                            </li>
                            <li className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                                <div className="min-w-[4px] h-4 bg-blue-500 rounded-full mt-0.5"></div>
                                <p>Para mover fondos, use <strong>Transferencias</strong> en el módulo de Caja/Bancos.</p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center text-center gap-3">
                        <ShieldCheck size={32} className="text-emerald-500"/>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seguridad de Datos</p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">Cada sucursal mantiene su propio historial de operaciones aislado para auditoría.</p>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                                {editingBranch ? <Edit3 size={16} className="text-indigo-500"/> : <Plus size={16} className="text-indigo-500"/>}
                                {editingBranch ? 'Editar Sucursal' : 'Nueva Sucursal'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nombre Comercial</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-black uppercase outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                                    placeholder="EJ. SEDE NORTE"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dirección Física</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold uppercase text-xs outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                                    placeholder="AV. PRINCIPAL 123"
                                    value={formData.address}
                                    onChange={e => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Teléfono / Contacto</label>
                                <input 
                                    type="text" 
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold uppercase text-xs outline-none focus:border-indigo-500 transition-all text-slate-800 dark:text-white"
                                    placeholder="+51 999 999 999"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            
                            {!editingBranch && (
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex gap-3 items-start">
                                    <Info size={16} className="text-indigo-500 mt-0.5 shrink-0"/>
                                    <p className="text-[10px] font-medium text-indigo-800 dark:text-indigo-300 leading-relaxed">
                                        Al crear la sucursal, se inicializará un inventario vacío y una caja chica cerrada. Podrás transferir recursos inmediatamente.
                                    </p>
                                </div>
                            )}

                            <button onClick={handleSave} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                                <Save size={16}/> {editingBranch ? 'Guardar Cambios' : 'Registrar Sede'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagementModule;
