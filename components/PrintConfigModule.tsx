
import React, { useState } from 'react';
import { Printer, Save, RefreshCw, FileText, ShoppingBag, Wrench, Image as ImageIcon } from 'lucide-react';

type ModuleType = 'VENTAS' | 'COMPRAS' | 'SERVICIOS';
interface PrintConfig { companyName: string; ruc: string; address: string; phone: string; email: string; footerMessage: string; logoUrl: string; paperSize: '80mm' | 'A4'; autoPrint: boolean; }

const PrintConfigModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ModuleType>('VENTAS');
    const [configs, setConfigs] = useState<Record<ModuleType, PrintConfig>>({
        VENTAS: { companyName: 'SAPISOFT ERP', ruc: '20601234567', address: 'Av. La Cultura 123, Cusco', phone: '987 654 321', email: 'ventas@sapisoft.com', footerMessage: '¡Gracias por su preferencia!\nConserve este ticket para cualquier reclamo.', logoUrl: '', paperSize: '80mm', autoPrint: true },
        COMPRAS: { companyName: 'SAPISOFT LOGISTICA', ruc: '20601234567', address: 'Av. La Cultura 123, Almacén 2', phone: '', email: 'logistica@sapisoft.com', footerMessage: 'Documento de Control Interno.\nVerificar mercadería al recibir.', logoUrl: '', paperSize: 'A4', autoPrint: false },
        SERVICIOS: { companyName: 'SAPISOFT TECNICO', ruc: '20601234567', address: 'Av. La Cultura 123, Taller 5', phone: '987 654 321', email: 'soporte@sapisoft.com', footerMessage: 'Garantía de 30 días por mano de obra.\nNo cubre repuestos ni daños por humedad.', logoUrl: '', paperSize: '80mm', autoPrint: true }
    });
    const currentConfig = configs[activeTab];
    const updateConfig = (key: keyof PrintConfig, value: any) => { setConfigs({ ...configs, [activeTab]: { ...currentConfig, [key]: value } }); };
    const handleSave = () => { alert("Configuración guardada exitosamente para " + activeTab); };

    return (
        <div className="flex h-full gap-6">
            <div className="w-1/2 flex flex-col gap-6">
                <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                    <button onClick={() => setActiveTab('VENTAS')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'VENTAS' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><ShoppingBag size={16}/> Ventas</button>
                    <button onClick={() => setActiveTab('COMPRAS')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'COMPRAS' ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><FileText size={16}/> Compras</button>
                    <button onClick={() => setActiveTab('SERVICIOS')} className={`flex-1 py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'SERVICIOS' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}><Wrench size={16}/> Servicio Técnico</button>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-y-auto">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Printer size={20} className="text-slate-400"/> Parámetros del Ticket ({activeTab})</h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Empresa / Cabecera</label><input type="text" className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.companyName} onChange={e => updateConfig('companyName', e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">RUC</label><input type="text" className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.ruc} onChange={e => updateConfig('ruc', e.target.value)} /></div>
                        </div>
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Dirección</label><input type="text" className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.address} onChange={e => updateConfig('address', e.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Teléfono</label><input type="text" className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.phone} onChange={e => updateConfig('phone', e.target.value)} /></div>
                            <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Email</label><input type="email" className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.email} onChange={e => updateConfig('email', e.target.value)} /></div>
                        </div>
                        <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Mensaje Pie de Página (Respeta espaciado)</label><textarea className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm h-32 resize-none outline-none focus:border-indigo-500 font-sans" value={currentConfig.footerMessage} onChange={e => updateConfig('footerMessage', e.target.value)} placeholder="Escriba su mensaje aquí... Use ENTER para separar párrafos." /></div>
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-white mb-3">Configuración Técnica</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Formato Papel</label><select className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-indigo-500" value={currentConfig.paperSize} onChange={e => updateConfig('paperSize', e.target.value)}><option value="80mm">Ticket 80mm</option><option value="A4">Hoja A4</option></select></div>
                                <div className="flex items-center gap-3"><input type="checkbox" id="autoprint" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" checked={currentConfig.autoPrint} onChange={e => updateConfig('autoPrint', e.target.checked)} /><label htmlFor="autoprint" className="text-sm font-medium text-slate-700 dark:text-slate-300">Imprimir Automáticamente al guardar</label></div>
                            </div>
                        </div>
                    </div>
                    <button onClick={handleSave} className="w-full mt-6 bg-slate-800 dark:bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-900 dark:hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Save size={18}/> Guardar Cambios</button>
                </div>
            </div>
            <div className="w-1/2 bg-slate-100 dark:bg-slate-900 rounded-2xl p-8 flex items-start justify-center overflow-y-auto border border-slate-200 dark:border-slate-800 relative">
                <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2"><RefreshCw size={12}/> Vista Previa en Vivo</div>
                <div className={`bg-white text-slate-800 shadow-2xl p-6 transition-all duration-300 ${currentConfig.paperSize === '80mm' ? 'w-[320px] min-h-[500px]' : 'w-[500px] min-h-[700px]'}`}>
                    <div className="font-mono text-center space-y-1">
                        {currentConfig.logoUrl ? (<img src={currentConfig.logoUrl} alt="Logo" className="h-16 mx-auto mb-2 grayscale" />) : (<div className="flex justify-center mb-2 text-slate-300"><ImageIcon size={32}/></div>)}
                        <h2 className="font-bold text-lg uppercase leading-tight">{currentConfig.companyName || 'NOMBRE EMPRESA'}</h2>
                        <p className="text-xs">RUC: {currentConfig.ruc || '00000000000'}</p>
                        <p className="text-xs">{currentConfig.address || 'Dirección de la empresa'}</p>
                        {currentConfig.phone && <p className="text-xs">Telf: {currentConfig.phone}</p>}
                        {currentConfig.email && <p className="text-xs">{currentConfig.email}</p>}
                    </div>
                    <div className="my-4 border-t-2 border-dashed border-slate-300"></div>
                    <div className="font-mono text-xs space-y-1"><div className="flex justify-between"><span>TICKET:</span><span className="font-bold">#001-000458</span></div><div className="flex justify-between"><span>FECHA:</span><span>{new Date().toLocaleDateString()} 14:30</span></div><div className="flex justify-between"><span>CLIENTE:</span><span>JUAN PEREZ</span></div></div>
                    <div className="my-4 border-t border-dashed border-slate-300"></div>
                    <div className="font-mono text-xs">
                        <div className="flex font-bold mb-2"><span className="flex-1">DESCRIPCION</span><span className="w-12 text-right">TOTAL</span></div>
                        {activeTab === 'VENTAS' && (<><div className="flex mb-1"><span className="flex-1">1 x PANTALLA SAMSUNG A50</span><span className="w-12 text-right">150.00</span></div><div className="flex mb-1"><span className="flex-1">1 x MICA DE VIDRIO 9D</span><span className="w-12 text-right">20.00</span></div></>)}
                        {activeTab === 'SERVICIOS' && (<div className="flex mb-1"><span className="flex-1">SERVICIO TECNICO IPHONE 11 (CAMBIO DISPLAY)</span><span className="w-12 text-right">250.00</span></div>)}
                        {activeTab === 'COMPRAS' && (<div className="flex mb-1"><span className="flex-1">10 x BATERIAS GENERICA</span><span className="w-12 text-right">300.00</span></div>)}
                    </div>
                    <div className="my-4 border-t border-slate-800"></div>
                    <div className="font-mono flex justify-between text-sm font-bold"><span>TOTAL A PAGAR</span><span>S/ {activeTab === 'VENTAS' ? '170.00' : activeTab === 'SERVICIOS' ? '250.00' : '300.00'}</span></div>
                    <div className="my-4 border-t border-dashed border-slate-300"></div>
                    
                    {/* Mensaje de pie con espaciado */}
                    <div className="font-mono text-[10px] text-slate-700 whitespace-pre-wrap leading-tight mb-8">
                        {currentConfig.footerMessage}
                    </div>

                    {/* Sección de firmas rediseñada - SOLO PARA SERVICIOS */}
                    {activeTab === 'SERVICIOS' && (
                        <div className="mt-12 flex flex-col items-center gap-4">
                            <div className="w-full flex flex-col items-center">
                                <div className="w-40 border-b-2 border-slate-800 mb-1"></div>
                                <p className="font-mono text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Firma Autorizada</p>
                            </div>
                            
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                                <p className="font-mono text-[10px] font-black uppercase text-slate-800 tracking-tight leading-none">JUAN PEREZ</p>
                                <div className="flex items-center justify-center gap-1.5 pt-1 border-t border-slate-100 mt-1">
                                    <span className="font-mono text-[7px] font-black text-slate-400 uppercase tracking-widest">DNI / RUC</span>
                                    <span className="font-mono text-[9px] font-black text-slate-700">00000000</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 text-center"><div className="inline-block bg-slate-100 p-1"><div className="h-8 w-32 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png')] bg-contain bg-no-repeat bg-center opacity-50 mx-auto"></div></div></div>
                    <div className="text-center font-mono text-[8px] text-slate-400 mt-2 uppercase">SapiSoft Cloud v4.0</div>
                </div>
            </div>
        </div>
    );
};
export default PrintConfigModule;
