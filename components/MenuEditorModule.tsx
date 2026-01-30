
import React, { useState, useRef } from 'react';
import { Menu, Save, GripVertical, Edit3 } from 'lucide-react';

interface MenuEditorProps {
    navStructure: any[];
    onUpdateStructure: (newStructure: any[]) => void;
}

const MenuEditorModule: React.FC<MenuEditorProps> = ({ navStructure, onUpdateStructure }) => {
    const [structure, setStructure] = useState([...navStructure]);
    const [activeModuleId, setActiveModuleId] = useState<string | null>(structure[0]?.id || null);

    // State for inline editing
    const [editingId, setEditingId] = useState<string | null>(null); // Format: "type-id", e.g., "module-comercial"
    const [editingLabel, setEditingLabel] = useState('');

    const draggedItem = useRef<any>(null);
    const draggedOverItem = useRef<any>(null);

    const activeModule = structure.find(m => m.id === activeModuleId);

    const handleToggle = (id: string, type: 'module' | 'submodule') => {
        const newStructure = structure.map(mod => {
            if (type === 'module' && mod.id === id) {
                return { ...mod, enabled: !mod.enabled };
            }
            if (type === 'submodule' && mod.id === activeModuleId) {
                return {
                    ...mod,
                    items: mod.items.map((item: any) => 
                        item.view === id ? { ...item, enabled: !item.enabled } : item
                    )
                };
            }
            return mod;
        });
        setStructure(newStructure);
    };

    const handleDragEnd = (type: 'module' | 'submodule') => {
        if (draggedItem.current === null || draggedOverItem.current === null) return;

        if (type === 'module') {
            const newStructure = [...structure];
            const [reorderedItem] = newStructure.splice(draggedItem.current, 1);
            newStructure.splice(draggedOverItem.current, 0, reorderedItem);
            setStructure(newStructure);
        } else if (type === 'submodule' && activeModule) {
            const newItems = [...activeModule.items];
            const [reorderedItem] = newItems.splice(draggedItem.current, 1);
            newItems.splice(draggedOverItem.current, 0, reorderedItem);
            
            const newStructure = structure.map(mod => 
                mod.id === activeModuleId ? { ...mod, items: newItems } : mod
            );
            setStructure(newStructure);
        }
        draggedItem.current = null;
        draggedOverItem.current = null;
    };
    
    const handleStartEdit = (id: string, label: string, type: 'module' | 'submodule') => {
        setEditingId(`${type}-${id}`);
        setEditingLabel(label);
    };

    const handleSaveLabel = () => {
        if (!editingId) return;
        const [type, id] = editingId.split('-');

        const newStructure = structure.map(mod => {
            if (type === 'module' && mod.id === id) {
                return { ...mod, label: editingLabel };
            }
            if (type === 'submodule' && mod.id === activeModuleId) {
                 return {
                    ...mod,
                    items: mod.items.map((item: any) => 
                        item.view === id ? { ...item, label: editingLabel } : item
                    )
                };
            }
            return mod;
        });
        setStructure(newStructure);
        setEditingId(null);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Menu className="text-primary-500"/> Editor de Menú de Navegación
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Activa, desactiva, reordena y renombra los módulos y submódulos de la aplicación.
                    </p>
                </div>
                <button 
                    onClick={() => onUpdateStructure(structure)}
                    className="bg-primary-600 text-white px-6 py-3 rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-colors"
                >
                    <Save size={16}/> Aplicar Cambios
                </button>
            </div>

            <div className="flex-1 grid grid-cols-3 gap-6">
                <div className="col-span-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <h3 className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-white">Módulos Principales</h3>
                    <div className="p-2 space-y-1 overflow-y-auto">
                        {structure.map((mod, index) => (
                            <div 
                                key={mod.id}
                                draggable
                                onDragStart={() => draggedItem.current = index}
                                onDragEnter={() => draggedOverItem.current = index}
                                onDragEnd={() => handleDragEnd('module')}
                                onDragOver={(e) => e.preventDefault()}
                                onClick={() => setActiveModuleId(mod.id)}
                                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all group ${activeModuleId === mod.id ? 'bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-200 dark:ring-primary-800' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                                <GripVertical className="text-slate-300 dark:text-slate-600 cursor-grab" size={20}/>
                                <mod.icon size={18} className={`mx-3 ${mod.enabled ? 'text-slate-600 dark:text-slate-300' : 'text-slate-300 dark:text-slate-600'}`}/>
                                <div className="flex-1 flex items-center">
                                    <span className={`font-bold text-sm ${mod.enabled ? 'text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                                        <span className="font-normal text-slate-400">Módulo: </span>
                                        {editingId === `module-${mod.id}` ? (
                                            <input 
                                                type="text"
                                                value={editingLabel}
                                                onChange={(e) => setEditingLabel(e.target.value)}
                                                onBlur={handleSaveLabel}
                                                onKeyDown={e => { if(e.key === 'Enter') handleSaveLabel() }}
                                                onClick={e => e.stopPropagation()}
                                                className="bg-white dark:bg-slate-700 border border-primary-500 rounded-md px-1 text-sm font-bold"
                                                autoFocus
                                            />
                                        ) : (
                                            mod.label
                                        )}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(mod.id, mod.label, 'module'); }} className="ml-2 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size={12}/>
                                    </button>
                                </div>
                                <div className="ml-auto" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleToggle(mod.id, 'module')} className={`w-10 h-6 rounded-full relative transition-colors ${mod.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${mod.enabled ? 'translate-x-4' : ''}`}></div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                    <h3 className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-white">Submódulos de "{activeModule?.label}"</h3>
                    <div className="p-2 space-y-1 overflow-y-auto">
                        {activeModule?.items.map((item: any, index: number) => (
                             <div 
                                key={item.view}
                                draggable
                                onDragStart={() => draggedItem.current = index}
                                onDragEnter={() => draggedOverItem.current = index}
                                onDragEnd={() => handleDragEnd('submodule')}
                                onDragOver={(e) => e.preventDefault()}
                                className="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                            >
                                <GripVertical className="text-slate-300 dark:text-slate-600 cursor-grab" size={20}/>
                                <item.icon size={16} className={`mx-3 ${item.enabled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-300 dark:text-slate-600'}`}/>
                                <div className="flex-1 flex items-center">
                                    <span className={`font-medium text-sm ${item.enabled ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500 line-through'}`}>
                                        <span className="font-normal text-slate-400">Submódulo: </span>
                                        {editingId === `submodule-${item.view}` ? (
                                            <input 
                                                type="text"
                                                value={editingLabel}
                                                onChange={(e) => setEditingLabel(e.target.value)}
                                                onBlur={handleSaveLabel}
                                                onKeyDown={e => { if(e.key === 'Enter') handleSaveLabel() }}
                                                onClick={e => e.stopPropagation()}
                                                className="bg-white dark:bg-slate-700 border border-primary-500 rounded-md px-1 text-sm font-medium"
                                                autoFocus
                                            />
                                        ) : (
                                            item.label
                                        )}
                                    </span>
                                    <button onClick={(e) => { e.stopPropagation(); handleStartEdit(item.view, item.label, 'submodule'); }} className="ml-2 text-slate-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size={12}/>
                                    </button>
                                </div>
                                <div className="ml-auto" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => handleToggle(item.view, 'submodule')} className={`w-10 h-6 rounded-full relative transition-colors ${item.enabled ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${item.enabled ? 'translate-x-4' : ''}`}></div>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MenuEditorModule;
