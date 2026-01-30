import React, { useState } from 'react';
import { MapPin, Plus, Trash2, ChevronRight, Map, RotateCcw, AlertTriangle } from 'lucide-react';
import { GeoLocation } from '../types';

interface LocationsModuleProps {
    locations: GeoLocation[];
    onAddLocation: (loc: GeoLocation) => void;
    onDeleteLocation: (id: string) => void;
    onResetLocations?: () => void;
}

const LocationsModule: React.FC<LocationsModuleProps> = ({ locations, onAddLocation, onDeleteLocation, onResetLocations }) => {
    const [selectedDep, setSelectedDep] = useState<string | null>(null);
    const [selectedProv, setSelectedProv] = useState<string | null>(null);
    const [newDep, setNewDep] = useState('');
    const [newProv, setNewProv] = useState('');
    const [newDist, setNewDist] = useState('');

    const departments = locations.filter(l => l.type === 'DEP');
    const provinces = locations.filter(l => l.type === 'PROV' && l.parentId === selectedDep);
    const districts = locations.filter(l => l.type === 'DIST' && l.parentId === selectedProv);

    const handleAdd = (type: 'DEP' | 'PROV' | 'DIST') => {
        let name = ''; let parentId: string | undefined = undefined;
        if (type === 'DEP') { name = newDep; }
        if (type === 'PROV') { name = newProv; parentId = selectedDep!; }
        if (type === 'DIST') { name = newDist; parentId = selectedProv!; }
        if (!name) return;
        onAddLocation({ id: Math.random().toString(), name: name.toUpperCase(), type, parentId });
        if (type === 'DEP') setNewDep(''); if (type === 'PROV') setNewProv(''); if (type === 'DIST') setNewDist('');
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex-1 flex gap-6 min-h-0">
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20"><h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 uppercase text-sm"><Map size={16}/> Departamentos</h3></div>
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-2"><input type="text" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs uppercase" placeholder="Nuevo Departamento" value={newDep} onChange={e => setNewDep(e.target.value)} /><button onClick={() => handleAdd('DEP')} className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"><Plus size={16}/></button></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">{departments.map(dep => (<div key={dep.id} onClick={() => { setSelectedDep(dep.id); setSelectedProv(null); }} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedDep === dep.id ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}><span className="font-bold text-xs">{dep.name}</span><div className="flex items-center gap-2">{selectedDep === dep.id && <ChevronRight size={16}/>}<button onClick={(e) => { e.stopPropagation(); onDeleteLocation(dep.id); }} className={`p-1 rounded hover:bg-white/20 ${selectedDep === dep.id ? 'text-white' : 'text-slate-300 hover:text-red-500'}`}><Trash2 size={14}/></button></div></div>))}</div>
                </div>
                <div className={`flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all ${!selectedDep ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-orange-50 dark:bg-orange-900/20"><h3 className="font-bold text-orange-900 dark:text-orange-200 flex items-center gap-2 uppercase text-sm"><MapPin size={16}/> Provincias</h3></div>
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-2"><input type="text" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs uppercase" placeholder="Nueva Provincia" value={newProv} onChange={e => setNewProv(e.target.value)} /><button onClick={() => handleAdd('PROV')} className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"><Plus size={16}/></button></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">{selectedDep ? provinces.map(prov => (<div key={prov.id} onClick={() => setSelectedProv(prov.id)} className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${selectedProv === prov.id ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}><span className="font-bold text-xs">{prov.name}</span><div className="flex items-center gap-2">{selectedProv === prov.id && <ChevronRight size={16}/>}<button onClick={(e) => { e.stopPropagation(); onDeleteLocation(prov.id); }} className={`p-1 rounded hover:bg-white/20 ${selectedProv === prov.id ? 'text-white' : 'text-slate-300 hover:text-red-500'}`}><Trash2 size={14}/></button></div></div>)) : (<div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-tighter">Seleccione un departamento</div>)}</div>
                </div>
                <div className={`flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden transition-all ${!selectedProv ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-emerald-50 dark:bg-emerald-900/20"><h3 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2 uppercase text-sm"><MapPin size={16}/> Distritos</h3></div>
                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex gap-2"><input type="text" className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs uppercase" placeholder="Nuevo Distrito" value={newDist} onChange={e => setNewDist(e.target.value)} /><button onClick={() => handleAdd('DIST')} className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"><Plus size={16}/></button></div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">{selectedProv ? districts.map(dist => (<div key={dist.id} className="flex justify-between items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 group"><span className="font-bold text-xs">{dist.name}</span><button onClick={() => onDeleteLocation(dist.id)} className="p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button></div>)) : (<div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-tighter">Seleccione una provincia</div>)}</div>
                </div>
            </div>
            {onResetLocations && (
                <div className="flex justify-between items-center px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2 shadow-inner">
                    <div className="flex items-center gap-2 text-slate-400">
                        <AlertTriangle size={16} className="text-orange-500"/>
                        <span className="text-[10px] font-bold uppercase tracking-widest">Zona Administrativa de Ubicaciones</span>
                    </div>
                    <button 
                        onClick={onResetLocations} 
                        className="px-6 py-2 bg-white dark:bg-slate-800 text-red-500 hover:text-white hover:bg-red-600 border border-red-200 dark:border-red-900/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-sm active:scale-95"
                    >
                        <RotateCcw size={14}/> Restablecer / Limpiar Catálogo
                    </button>
                </div>
            )}
        </div>
    );
};
export default LocationsModule;