
import React, { useState } from 'react';
import { Tag, Layers, Plus, Trash2, Search } from 'lucide-react';
import { Brand, Category } from '../types';

interface ResourceManagementProps {
    brands: Brand[];
    onAddBrand: (b: Brand) => void;
    onDeleteBrand: (id: string) => void;
    categories: Category[];
    onAddCategory: (c: Category) => void;
    onDeleteCategory: (id: string) => void;
}

export const ResourceManagement: React.FC<ResourceManagementProps> = ({
    brands, onAddBrand, onDeleteBrand,
    categories, onAddCategory, onDeleteCategory,
}) => {
    const [activeTab, setActiveTab] = useState<'marcas' | 'categorias'>('marcas');
    const [searchTerm, setSearchTerm] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newCategory, setNewCategory] = useState('');

    // Helper de normalización para búsqueda inteligente
    const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    const filteredList = (list: any[]) => {
        if (!searchTerm) return list;
        const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
        return list.filter(item => {
            const targetString = normalize(item.name || "");
            return searchWords.every(word => targetString.includes(word));
        });
    };

    const handleAdd = () => {
        if (activeTab === 'marcas' && newBrand) {
            onAddBrand({ id: Math.random().toString(), name: newBrand.toUpperCase() });
            setNewBrand('');
        } else if (activeTab === 'categorias' && newCategory) {
            onAddCategory({ id: Math.random().toString(), name: newCategory.toUpperCase() });
            setNewCategory('');
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm shrink-0 w-fit">
                <button onClick={() => setActiveTab('marcas')} className={`w-40 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'marcas' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><Tag size={18}/> Marcas</button>
                <button onClick={() => setActiveTab('categorias')} className={`w-40 py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${activeTab === 'categorias' ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><Layers size={18}/> Categorías</button>
            </div>
            <div className="flex flex-1 gap-6 min-h-0">
                <div className="w-80 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Plus size={20}/> Crear {activeTab === 'marcas' ? 'Marca' : 'Categoría'}</h3>
                    <div className="space-y-4 flex-1">
                        {activeTab === 'marcas' && (<div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre de Marca</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg" value={newBrand} onChange={e => setNewBrand(e.target.value)} placeholder="Ej. SAMSUNG"/></div>)}
                        {activeTab === 'categorias' && (<div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nombre de Categoría</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Ej. PANTALLAS"/></div>)}
                    </div>
                    <button onClick={handleAdd} className="w-full py-3 mt-6 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors">Guardar</button>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-4 bg-slate-50 dark:bg-slate-700/30">
                        <Search className="text-slate-400" size={20}/>
                        <input type="text" className="bg-transparent outline-none flex-1 text-sm font-medium text-slate-700 dark:text-white placeholder-slate-400" placeholder="Buscar en la lista..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                        <table className="w-full modern-table">
                            <thead><tr>{activeTab === 'marcas' && <><th>Marca</th><th>ID</th><th>Acción</th></>}{activeTab === 'categorias' && <><th>Categoría</th><th>ID</th><th>Acción</th></>}</tr></thead>
                            <tbody className="dark:divide-slate-700">
                                {activeTab === 'marcas' && filteredList(brands).map((b: Brand) => (<tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="font-bold text-slate-700 dark:text-slate-200">{b.name}</td><td className="font-mono text-slate-400 text-xs">{b.id}</td><td className="text-center"><button onClick={() => onDeleteBrand(b.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16}/></button></td></tr>))}
                                {activeTab === 'categorias' && filteredList(categories).map((c: Category) => (<tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50"><td className="font-bold text-slate-700 dark:text-slate-200">{c.name}</td><td className="font-mono text-slate-400 text-xs">{c.id}</td><td className="text-center"><button onClick={() => onDeleteCategory(c.id)} className="text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400"><Trash2 size={16}/></button></td></tr>))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ResourceManagement;
