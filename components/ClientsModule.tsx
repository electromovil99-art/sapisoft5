
import React, { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, MessageCircle, Wallet, User, Phone, FileText, X, MapPin, CloudDownload, Loader2 } from 'lucide-react';
import { Client, GeoLocation } from '../types';

interface ClientsModuleProps {
    clients: Client[];
    onAddClient: (client: Client) => void;
    onOpenWhatsApp?: (name: string, phone: string, message?: string) => void;
    locations?: GeoLocation[];
    
    // New Props for Integration
    initialData?: { name: string, phone: string } | null;
    onClearInitialData?: () => void;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({ 
    clients, onAddClient, onOpenWhatsApp, locations = [], 
    initialData, onClearInitialData 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClientData, setNewClientData] = useState({ 
      name: '', dni: '', phone: '', address: '', email: '',
      department: 'CUSCO', province: 'CUSCO', district: '' 
  });
  const [isSearchingClient, setIsSearchingClient] = useState(false);

  // Effect to handle incoming data from other modules (like WhatsApp)
  useEffect(() => {
      if (initialData) {
          setNewClientData(prev => ({
              ...prev,
              name: initialData.name,
              phone: initialData.phone
          }));
          setShowModal(true);
      }
  }, [initialData]);

  const totalDebt = clients.reduce((acc, c) => acc + (c.creditUsed || 0), 0);

  const departments = locations.filter(l => l.type === 'DEP');
  const provinces = locations.filter(l => l.type === 'PROV' && l.parentId === (departments.find(d => d.name === newClientData.department)?.id));
  const districts = locations.filter(l => l.type === 'DIST' && l.parentId === (provinces.find(p => p.name === newClientData.province)?.id));

  // Helper de normalización para búsqueda inteligente
  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredClients = clients.filter(client => {
      const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
      const targetString = normalize(`${client.name} ${client.dni} ${client.phone || ""} ${client.email || ""}`);
      
      return searchTerm === '' || searchWords.every(word => targetString.includes(word));
  });

  const searchClientByDoc = async () => {
    if (!newClientData.dni) return;
    setIsSearchingClient(true);
    
    setTimeout(() => {
        const isRuc = newClientData.dni.length === 11;
        const isDni = newClientData.dni.length === 8;
        
        if (isDni) {
            setNewClientData(prev => ({
                ...prev,
                name: 'JUAN PEREZ (RENIEC)',
                address: 'AV. SIEMPRE VIVA 123',
                department: 'LIMA',
                province: 'LIMA',
                district: 'MIRAFLORES'
            }));
        } else if (isRuc) {
            setNewClientData(prev => ({
                ...prev,
                name: 'EMPRESA EJEMPLO S.A.C.',
                address: 'CALLE DE NEGOCIOS 456',
                department: 'AREQUIPA',
                province: 'AREQUIPA',
                district: 'YANAHUARA'
            }));
        } else {
            alert("Formato de documento no válido (8 u 11 dígitos)");
        }
        setIsSearchingClient(false);
    }, 1000);
  };

  const handleSave = () => {
      if (!newClientData.name || !newClientData.dni) return alert("Nombre y DNI son obligatorios.");
      const cl: Client = {
          id: Date.now().toString(), name: newClientData.name.toUpperCase(), dni: newClientData.dni, phone: newClientData.phone, email: newClientData.email, address: newClientData.address, department: newClientData.department, province: newClientData.province, district: newClientData.district, creditLine: 0, creditUsed: 0, totalPurchases: 0, paymentScore: 3, digitalBalance: 0
      };
      onAddClient(cl);
      setShowModal(false);
      setNewClientData({ name: '', dni: '', phone: '', address: '', email: '', department: 'CUSCO', province: 'CUSCO', district: '' });
      if (onClearInitialData) onClearInitialData();
  };

  const handleCloseModal = () => {
      setShowModal(false);
      if (onClearInitialData) onClearInitialData();
  };

  return (
    <div className="flex flex-col gap-4 h-full animate-in fade-in duration-500">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-4 flex-1">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                    <input 
                        type="text" 
                        placeholder="Nombre, DNI o Teléfono..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="hidden md:flex gap-4 border-l pl-4 border-slate-200 dark:border-slate-700">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Clientes</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-white">{clients.length}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Deuda Total</span>
                        <span className="text-sm font-bold text-red-500">S/ {totalDebt.toFixed(2)}</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={() => setShowModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center gap-2 transition-all active:scale-95"
            >
                <UserPlus size={16}/> NUEVO CLIENTE
            </button>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-auto flex-1">
                <table className="w-full text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-700 text-slate-400 font-black uppercase tracking-widest text-[10px] border-b">
                        <tr>
                            <th className="px-6 py-4">Cliente / Identificación</th>
                            <th className="px-6 py-4">Contacto</th>
                            <th className="px-6 py-4 text-right">Crédito / Deuda</th>
                            <th className="px-6 py-4 text-right">Total Compras</th>
                            <th className="px-6 py-4 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                        {filteredClients.map(client => (
                            <tr key={client.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-black text-xs">
                                            {client.name.substring(0,2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-white text-sm uppercase">{client.name}</div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-bold">
                                                <FileText size={10}/> DNI: {client.dni}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {client.phone ? (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold">
                                            <Phone size={12} className="text-slate-400"/> {client.phone}
                                        </div>
                                    ) : (
                                        <span className="text-[10px] italic text-slate-300">No registrado</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {client.creditUsed > 0 ? (
                                        <div className="inline-flex flex-col items-end">
                                            <span className="text-xs font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-lg border border-red-100 dark:border-red-800">
                                                DEBE: S/ {client.creditUsed.toFixed(2)}
                                            </span>
                                            <span className="text-[9px] text-slate-400 mt-0.5">Límite: S/ {client.creditLine}</span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase">Sin Deuda</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="font-black text-slate-700 dark:text-slate-200 text-sm">S/ {client.totalPurchases.toFixed(2)}</div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => onOpenWhatsApp && client.phone ? onOpenWhatsApp(client.name, client.phone) : alert('Sin teléfono')} 
                                        className="p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all active:scale-90 border border-transparent hover:border-emerald-200"
                                        title="WhatsApp"
                                    >
                                        <MessageCircle size={18}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {showModal && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-3xl border border-white/20 animate-in zoom-in-95 duration-300 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-black text-base text-slate-800 dark:text-white flex items-center gap-3 uppercase tracking-tighter"><UserPlus className="text-primary-600" size={20}/> Nuevo Cliente</h3>
                        <button onClick={handleCloseModal} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
                    </div>
                    <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh]">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Nombre Completo / Razón Social</label>
                            <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-primary-500 shadow-sm text-sm" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} placeholder="EJ. JUAN PÉREZ" autoFocus />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">DNI / RUC</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full p-3.5 pr-12 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" 
                                        value={newClientData.dni} 
                                        onChange={e => setNewClientData({...newClientData, dni: e.target.value})} 
                                        placeholder="00000000" 
                                    />
                                    <button 
                                        onClick={searchClientByDoc}
                                        disabled={isSearchingClient}
                                        className="absolute right-2 top-2 bottom-2 px-3 bg-white dark:bg-slate-600 rounded-lg text-primary-600 dark:text-white hover:bg-primary-50 dark:hover:bg-slate-500 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center"
                                        title="Buscar en RENIEC/SUNAT"
                                    >
                                        {isSearchingClient ? <Loader2 size={16} className="animate-spin"/> : <CloudDownload size={16}/>}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Teléfono / Celular</label>
                                <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold outline-none focus:border-primary-500 text-sm" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="999 999 999" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección</label>
                            <input type="text" className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold uppercase outline-none focus:border-primary-500 text-sm" value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} placeholder="AV. EL SOL 500" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Departamento</label>
                                <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.department} onChange={e => setNewClientData({...newClientData, department: e.target.value})}>
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Provincia</label>
                                <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.province} onChange={e => setNewClientData({...newClientData, province: e.target.value})}>
                                    {provinces.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Distrito</label>
                                <select className="w-full p-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-bold text-sm outline-none" value={newClientData.district} onChange={e => setNewClientData({...newClientData, district: e.target.value})}>
                                    <option value="">-- SELECCIONAR --</option>
                                    {districts.map(dist => <option key={dist.id} value={dist.name}>{dist.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 pt-4">
                            <button onClick={handleCloseModal} className="px-10 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all uppercase tracking-widest text-xs">Cancelar</button>
                            <button onClick={handleSave} className="px-12 py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 shadow-xl transition-all text-xs uppercase tracking-widest">Guardar Cliente</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default ClientsModule;
