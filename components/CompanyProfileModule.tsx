
import React, { useState, useRef } from 'react';
import { Building2, Save, Image as ImageIcon, Upload, Edit3, Globe, Landmark } from 'lucide-react';

interface CompanyProfileProps {
    companyName: string;
    onUpdateCompanyName: (name: string) => void;
    companyLogo: string | null;
    onUpdateLogo: (logo: string | null) => void;
    baseCurrency: string;
    onUpdateBaseCurrency: (currency: string) => void;
}

const COMMON_CURRENCIES = [
    { code: 'PEN', name: 'Sol Peruano (S/)', flag: '🇵🇪' },
    { code: 'USD', name: 'Dólar Estadounidense ($)', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro (€)', flag: '🇪🇺' },
    { code: 'MXN', name: 'Peso Mexicano ($)', flag: '🇲🇽' },
    { code: 'COP', name: 'Peso Colombiano ($)', flag: '🇨🇴' },
    { code: 'ARS', name: 'Peso Argentino ($)', flag: '🇦🇷' },
    { code: 'CLP', name: 'Peso Chileno ($)', flag: '🇨🇱' },
    { code: 'BRL', name: 'Real Brasileño (R$)', flag: '🇧🇷' },
];

const CompanyProfileModule: React.FC<CompanyProfileProps> = ({ 
    companyName, onUpdateCompanyName, companyLogo, onUpdateLogo, baseCurrency, onUpdateBaseCurrency 
}) => {
    const [name, setName] = useState(companyName);
    const [isEditingName, setIsEditingName] = useState(false);
    const [selectedCurrency, setSelectedCurrency] = useState(baseCurrency);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                onUpdateLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveChanges = () => {
        onUpdateCompanyName(name);
        onUpdateBaseCurrency(selectedCurrency);
        setIsEditingName(false);
        alert("Configuración de empresa actualizada correctamente.");
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl">
                        <Building2 size={24}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Perfil Corporativo</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identidad visual y regional del sistema</p>
                    </div>
                </div>
                <button 
                    onClick={handleSaveChanges}
                    className="bg-slate-900 dark:bg-primary-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-xl"
                >
                    <Save size={16}/> Guardar Cambios
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Branding Section */}
                <div className="md:col-span-1 bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-8 w-full">Logo de Empresa</h3>
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-48 h-48 bg-slate-50 dark:bg-slate-700 rounded-[3rem] flex items-center justify-center border-4 border-white dark:border-slate-600 shadow-xl cursor-pointer group relative mb-6 overflow-hidden transition-all hover:scale-105"
                    >
                        {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="w-full h-full object-contain p-6"/>
                        ) : (
                            <ImageIcon size={64} className="text-slate-200 dark:text-slate-500"/>
                        )}
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Upload size={32} className="text-white mb-2"/>
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Subir Imagen</span>
                        </div>
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight text-center leading-relaxed">
                        Se recomienda una imagen cuadrada con fondo transparente (PNG).
                    </p>
                </div>

                {/* Information Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2"><Edit3 size={16} className="text-primary-500"/> Datos del Negocio</h3>
                        <div className="space-y-6">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                <div className="flex items-center gap-4">
                                    {isEditingName ? (
                                        <input 
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            onBlur={() => setIsEditingName(false)}
                                            className="flex-1 p-4 border-2 border-primary-500 rounded-2xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-lg font-black outline-none shadow-inner"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{name}</p>
                                        </div>
                                    )}
                                    <button onClick={() => setIsEditingName(!isEditingName)} className="p-4 bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-primary-600 rounded-2xl transition-all">
                                        <Edit3 size={20}/>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">RUC / Identificación Fiscal</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 uppercase outline-none focus:border-primary-500" defaultValue="20601234567" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Teléfono Central</label>
                                    <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500" defaultValue="+51 987 654 321" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONFIGURACIÓN REGIONAL / MONEDA */}
                    <div className="bg-slate-900 dark:bg-slate-800/50 p-8 rounded-[2.5rem] shadow-xl border border-slate-700 dark:border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10"><Globe size={120} className="text-white"/></div>
                        <div className="relative z-10">
                            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-primary-400 mb-6 flex items-center gap-2">Configuración Regional</h3>
                            <div className="max-w-md space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Moneda Base del Sistema (Default)</label>
                                    <div className="relative">
                                        <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" size={18}/>
                                        <select 
                                            value={selectedCurrency}
                                            onChange={e => setSelectedCurrency(e.target.value)}
                                            className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-sm appearance-none outline-none focus:ring-2 focus:ring-primary-500 transition-all uppercase cursor-pointer"
                                        >
                                            {COMMON_CURRENCIES.map(curr => (
                                                <option key={curr.code} value={curr.code} className="bg-slate-900 text-white font-bold">
                                                    {curr.flag} {curr.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight leading-relaxed px-1">
                                        Esta moneda se utilizará por defecto en el Punto de Venta y Almacén. Todas las valorizaciones se calcularán en esta divisa.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfileModule;
