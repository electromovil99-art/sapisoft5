
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, PackageCheck, Trash2, Database, RotateCcw, ScanBarcode, Save, TrendingDown, Star, Sparkles, X, ChevronRight, ListRestart, FolderOpen, History, Camera, Loader2, AlertCircle } from 'lucide-react';
import { Product, InventoryHistorySession, InventoryCountItem, SaleRecord } from '../types';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface InventoryAdjustmentProps {
    products: Product[];
    salesHistory: SaleRecord[];
    onProcessInventorySession: (session: InventoryHistorySession) => void;
    sessionUser: string;
    history: InventoryHistorySession[];
}

const InventoryAdjustmentModule: React.FC<InventoryAdjustmentProps> = ({ 
    products, 
    salesHistory,
    onProcessInventorySession, 
    sessionUser,
    history
}) => {
    // Definición de borradores guardados para recuperación
    const savedDrafts = useMemo(() => history.filter(s => s.status === 'DRAFT'), [history]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [counts, setCounts] = useState<Record<string, string>>({}); 
    const [searchTerm, setSearchTerm] = useState('');
    const [scanMode, setScanMode] = useState(false);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [lastAddedId, setLastAddedId] = useState<string | null>(null);
    
    // Cámara y Scanner (Html5Qrcode)
    const [showCamera, setShowCamera] = useState(false);
    const [isCameraLoading, setIsCameraLoading] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const scannerMountedRef = useRef<boolean>(false);

    // UI Modals
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showRecoverModal, setShowRecoverModal] = useState(false);
    const [sessionName, setSessionName] = useState('');

    const scanInputRef = useRef<HTMLInputElement>(null);

    // Limpieza de cámara al desmontar
    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
                scannerRef.current.clear();
            }
        };
    }, []);

    // Auto-focus y selección inmediata del campo tras agregar producto
    useEffect(() => {
        if (lastAddedId) {
            const el = document.getElementById(`input-${lastAddedId}`) as HTMLInputElement;
            if (el) {
                setTimeout(() => {
                    el.focus();
                    el.select(); // Selecciona el texto para sobreescribir rápido
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                setLastAddedId(null);
            }
        }
    }, [lastAddedId, selectedIds]);

    // Auto-focus en escáner manual si está activo
    useEffect(() => {
        if (scanMode && scanInputRef.current) {
            scanInputRef.current.focus();
        }
    }, [scanMode]);

    // --- LÓGICA DE ESCÁNER MÓVIL (Html5Qrcode) ---
    const startCameraScanner = async () => {
        setShowCamera(true);
        setIsCameraLoading(true);
        
        // Esperar a que el DOM renderice el div 'reader'
        setTimeout(async () => {
            try {
                if (scannerRef.current) {
                    await scannerRef.current.stop().catch(() => {});
                    scannerRef.current.clear();
                }

                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [ 
                        Html5QrcodeSupportedFormats.QR_CODE,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.EAN_8,
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.CODE_39,
                        Html5QrcodeSupportedFormats.UPC_A
                    ]
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, // Preferir cámara trasera
                    config,
                    (decodedText) => {
                        handleDetectedCode(decodedText);
                    },
                    (errorMessage) => {
                        // Ignorar errores de frame vacíos
                    }
                );
                
                setIsCameraLoading(false);
                scannerMountedRef.current = true;

            } catch (err) {
                console.error("Error iniciando cámara", err);
                alert("No se pudo acceder a la cámara. Verifique permisos.");
                setIsCameraLoading(false);
                setShowCamera(false);
            }
        }, 300);
    };

    const stopCameraScanner = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (err) {
                console.error("Error al detener scanner", err);
            }
        }
        setShowCamera(false);
        setIsCameraLoading(false);
        scannerMountedRef.current = false;
    };

    const handleDetectedCode = (code: string) => {
        // Pausa breve para evitar lecturas múltiples del mismo código en milisegundos
        if (scannerRef.current?.isScanning) {
             scannerRef.current.pause(true);
        }

        const product = products.find(p => p.code === code);
        
        if (product) {
            // Beep de éxito
            const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Sonido corto
            beep.play().catch(() => {});
            
            addProduct(product);
            
            // Opcional: Cerrar cámara al encontrar uno, o reanudar para seguir escaneando
            // Si es inventario masivo, mejor reanudar:
            setTimeout(() => {
                if (scannerRef.current) scannerRef.current.resume();
            }, 1500); // 1.5s de pausa para que el usuario sepa que leyó
            
        } else {
            const errorBeep = new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3');
            errorBeep.play().catch(() => {});
            alert(`Código "${code}" no encontrado en el sistema.`);
            setTimeout(() => {
                if (scannerRef.current) scannerRef.current.resume();
            }, 1000);
        }
    };

    const searchResults = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return products.filter(p => 
            (p.name.toLowerCase().includes(term) || p.code.includes(term)) &&
            !selectedIds.includes(p.id)
        ).slice(0, 5);
    }, [products, searchTerm, selectedIds]);

    const addProduct = (p: Product) => {
        if (!selectedIds.includes(p.id)) {
            setSelectedIds(prev => [p.id, ...prev]); // Agregar al principio para visibilidad
            setCounts(prev => ({ ...prev, [p.id]: "" }));
        }
        setLastAddedId(p.id);
        setSearchTerm('');
    };

    const handleBarcodeScan = (e: React.FormEvent) => {
        e.preventDefault();
        const code = barcodeInput.trim();
        if (!code) return;

        const product = products.find(p => p.code === code);
        if (product) {
            addProduct(product);
            setBarcodeInput('');
        } else {
            alert(`Producto con código ${code} no encontrado.`);
            setBarcodeInput('');
        }
    };

    const loadDraft = (session: InventoryHistorySession) => {
        setSelectedIds(session.items.map(i => i.productId));
        const newCounts: Record<string, string> = {};
        session.items.forEach(i => {
            newCounts[i.productId] = i.physicalCount.toString();
        });
        setCounts(newCounts);
        setCurrentSessionId(session.id);
        setSessionName(session.id.split('-').pop() || ''); 
        setShowRecoverModal(false);
    };

    const handleAction = (nextStatus: 'DRAFT' | 'ADJUSTED') => {
        if (selectedIds.length === 0) return alert("Cargue productos antes de procesar.");
        
        const adjustItems: InventoryCountItem[] = selectedIds.map(id => {
            const product = products.find(p => p.id === id);
            if (!product) return null;

            const valStr = counts[id];
            // Si el campo está vacío, asumimos el stock del sistema para no crear descuadres accidentales
            const physical = (valStr === undefined || valStr === "") ? product.stock : Number(valStr);
            
            return {
                productId: product.id,
                productName: product.name,
                systemStock: product.stock,
                physicalCount: isNaN(physical) ? product.stock : physical,
                difference: isNaN(physical) ? 0 : physical - product.stock
            };
        }).filter((item): item is InventoryCountItem => item !== null);

        if (adjustItems.length === 0) return alert("Error al procesar la lista.");

        const session: InventoryHistorySession = {
            id: currentSessionId || (sessionName ? `DRAFT-${sessionName.toUpperCase()}` : 'ADJ-' + Math.random().toString(36).substr(2, 6).toUpperCase()),
            date: new Date().toLocaleDateString('es-PE'),
            time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
            user: sessionUser,
            status: nextStatus,
            items: adjustItems
        };

        onProcessInventorySession(session);

        // Limpieza del panel tras guardado exitoso
        setSelectedIds([]);
        setCounts({});
        setCurrentSessionId(null);
        setSessionName('');
        setShowSaveModal(false);

        if (nextStatus === 'ADJUSTED') {
            alert("Ajuste procesado. Stock actualizado en el inventario.");
        } else {
            alert(`Borrador "${session.id}" guardado con éxito.`);
        }
    };

    const loadNegatives = () => {
        const negativeProducts = products.filter(p => p.stock < 0);
        if (negativeProducts.length === 0) return alert("No hay productos con stock negativo.");
        const newIds = [...new Set([...selectedIds, ...negativeProducts.map(p => p.id)])];
        setSelectedIds(newIds);
        const newCounts = { ...counts };
        negativeProducts.forEach(p => {
            if (newCounts[p.id] === undefined) newCounts[p.id] = ""; 
        });
        setCounts(newCounts);
        if (negativeProducts.length > 0) setLastAddedId(negativeProducts[0].id);
    };

    const loadBestSellers = () => {
        const salesCount: Record<string, number> = {};
        salesHistory.forEach(sale => {
            sale.items.forEach(item => {
                salesCount[item.id] = (salesCount[item.id] || 0) + item.quantity;
            });
        });
        const topIds = Object.keys(salesCount).sort((a, b) => salesCount[b] - salesCount[a]).slice(0, 10);
        if (topIds.length === 0) return alert("No hay historial de ventas suficiente.");
        const newIds = [...new Set([...selectedIds, ...topIds])];
        setSelectedIds(newIds);
        const newCounts = { ...counts };
        topIds.forEach(id => {
            if (newCounts[id] === undefined) newCounts[id] = "";
        });
        setCounts(newCounts);
        if (topIds.length > 0) setLastAddedId(topIds[0]);
    };

    return (
        <div className="flex flex-col h-full gap-3 md:gap-4 animate-in fade-in duration-300 overflow-hidden">
            
            {/* CABECERA DE CONTROL */}
            <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3 md:gap-4 transition-colors shrink-0">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-xl">
                            <Database size={20}/>
                        </div>
                        <div>
                            <h2 className="text-xs md:text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Toma de Inventario</h2>
                            {currentSessionId && (
                                <div className="flex gap-2 mt-0.5">
                                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase border bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">EDITANDO: {currentSessionId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:flex gap-2 w-full md:w-auto">
                        <button onClick={() => setShowRecoverModal(true)} className="px-3 py-2 md:py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-all">
                            <FolderOpen size={14}/> Borradores ({savedDrafts.length}/15)
                        </button>
                        <button onClick={loadNegatives} className="px-3 py-2 md:py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-red-100 transition-all">
                            <TrendingDown size={14}/> Negativos
                        </button>
                        <button onClick={loadBestSellers} className="px-3 py-2 md:py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-all">
                            <Star size={14}/> Top Ventas
                        </button>
                        <button onClick={() => setScanMode(!scanMode)} className={`col-span-2 md:col-auto px-4 py-2 md:py-1.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all shadow-sm ${scanMode ? 'bg-emerald-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                            <ScanBarcode size={14}/> {scanMode ? 'Escáner USB' : 'Scanner USB'}
                        </button>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                    {scanMode ? (
                        <form onSubmit={handleBarcodeScan} className="flex-1 relative animate-in slide-in-from-top-2">
                            <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20}/>
                            <input 
                                ref={scanInputRef}
                                type="text"
                                className="w-full pl-12 pr-10 py-3 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl outline-none focus:border-emerald-500 font-black text-lg tracking-widest text-emerald-700 dark:text-emerald-400 placeholder-emerald-300 dark:placeholder-emerald-800"
                                placeholder="PISTOLEE EL CÓDIGO..."
                                value={barcodeInput}
                                onChange={e => setBarcodeInput(e.target.value)}
                                onBlur={() => scanMode && setTimeout(() => scanInputRef.current?.focus(), 100)}
                            />
                            <button type="button" onClick={() => setScanMode(false)} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"><X size={18}/></button>
                        </form>
                    ) : (
                        <div className="flex-1 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-2xl outline-none focus:border-primary-500 font-bold transition-colors"
                                    placeholder="BUSCAR PRODUCTO MANUALMENTE..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <button 
                                    onClick={startCameraScanner}
                                    disabled={isCameraLoading}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-all"
                                    title="Escanear con Cámara (Celular)"
                                >
                                    {isCameraLoading ? <Loader2 className="animate-spin" size={18}/> : <Camera size={18}/>}
                                </button>
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-[500] overflow-hidden">
                                        {searchResults.map(p => (
                                            <button key={p.id} onClick={() => addProduct(p)} className="w-full p-4 text-left hover:bg-primary-50 dark:hover:bg-slate-700 flex justify-between items-center border-b last:border-0 transition-colors border-slate-100 dark:border-slate-700">
                                                <div>
                                                    <div className="font-bold text-xs uppercase text-slate-700 dark:text-white">{p.name}</div>
                                                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">SKU: {p.code} | STOCK: {p.stock}</div>
                                                </div>
                                                <ChevronRight size={18} className="text-primary-600 dark:text-primary-400"/>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-2 md:flex gap-2">
                        <button onClick={() => setShowSaveModal(true)} disabled={selectedIds.length === 0} className="flex-1 px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 hover:bg-slate-50 flex flex-col md:flex-row items-center justify-center gap-1.5 disabled:opacity-30 transition-all active:scale-95">
                            <Save size={16} className="text-primary-500"/> <span>Borrador</span>
                        </button>
                        <button onClick={() => handleAction('ADJUSTED')} disabled={selectedIds.length === 0} className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-emerald-700 flex flex-col md:flex-row items-center justify-center gap-1.5 disabled:opacity-30 transition-all active:scale-95">
                            <PackageCheck size={18}/> <span>Ajustar Stock</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ÁREA DE TRABAJO */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
                <div className="p-3 md:p-4 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center font-black text-[9px] md:text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">
                    <span className="flex items-center gap-2"><Sparkles size={14} className="text-primary-500"/> Auditando: {selectedIds.length} ítems</span>
                    <button onClick={() => { setSelectedIds([]); setCounts({}); setCurrentSessionId(null); setSessionName(''); }} className="flex items-center gap-1 hover:text-red-500 transition-colors uppercase"><RotateCcw size={12}/> Limpiar Todo</button>
                </div>
                
                <div className="flex-1 overflow-auto p-2 md:p-0">
                    {selectedIds.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 opacity-50 italic py-20">
                            <Database size={64} strokeWidth={1} className="mb-4"/>
                            <p className="font-bold uppercase text-[10px] md:text-xs text-center px-6">Agregue productos para iniciar la auditoría</p>
                        </div>
                    ) : (
                        <>
                            {/* VISTA DESKTOP */}
                            <table className="hidden md:table w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase border-b dark:border-slate-700 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Artículo</th>
                                        <th className="px-6 py-4 text-center">Sistema</th>
                                        <th className="px-6 py-4 text-center w-48">Físico (Real)</th>
                                        <th className="px-6 py-4 text-center">Diferencia</th>
                                        <th className="px-6 py-4 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                    {selectedIds.map(id => {
                                        const p = products.find(prod => prod.id === id);
                                        if (!p) return null;
                                        const valStr = counts[id] ?? "";
                                        const val = Number(valStr);
                                        const diff = valStr === "" ? 0 : val - p.stock;

                                        return (
                                            <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-black uppercase text-slate-700 dark:text-white text-xs">{p.name}</div>
                                                    <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">SKU: {p.code}</div>
                                                </td>
                                                <td className="px-6 py-4 text-center font-black text-slate-400 text-sm">{p.stock}</td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        id={`input-${p.id}`}
                                                        type="number"
                                                        inputMode="decimal"
                                                        className={`w-full p-3 border-2 rounded-2xl text-center font-black text-xl outline-none transition-all shadow-inner bg-white text-slate-900 dark:bg-slate-950 dark:text-white ${
                                                            (valStr !== "" && diff !== 0) ? 'border-primary-500 dark:border-primary-600 ring-4 ring-primary-500/10' : 'border-slate-100 dark:border-slate-700 focus:border-primary-400'
                                                        }`}
                                                        value={valStr}
                                                        placeholder="0"
                                                        onChange={e => setCounts({...counts, [id]: e.target.value})}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {valStr !== "" && diff !== 0 ? (
                                                        <span className={`font-black text-xs px-2.5 py-1 rounded-xl border-2 ${diff > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                            {diff > 0 ? '+' : ''}{diff}
                                                        </span>
                                                    ) : valStr !== "" ? <span className="text-slate-300 dark:text-slate-600 font-bold uppercase text-[8px]">Ok</span> : null}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button onClick={() => setSelectedIds(selectedIds.filter(i => i !== id))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            {/* VISTA MÓVIL */}
                            <div className="md:hidden space-y-2 p-2 pb-10">
                                {selectedIds.map(id => {
                                    const p = products.find(prod => prod.id === id);
                                    if (!p) return null;
                                    const valStr = counts[id] ?? "";
                                    const val = Number(valStr);
                                    const diff = valStr === "" ? 0 : val - p.stock;

                                    return (
                                        <div key={p.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col gap-3 relative">
                                            <button onClick={() => setSelectedIds(selectedIds.filter(i => i !== id))} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-500">
                                                <Trash2 size={16}/>
                                            </button>
                                            <div className="pr-8">
                                                <div className="font-black uppercase text-slate-700 dark:text-white text-[10px] leading-tight mb-1">{p.name}</div>
                                                <div className="text-[8px] text-slate-400 font-bold uppercase flex items-center gap-1.5 flex-wrap">
                                                    <span>SKU: {p.code}</span>
                                                    <span className="text-slate-300">|</span>
                                                    <span className="flex items-center gap-1">
                                                        SISTEMA: 
                                                        <span className="text-primary-600 dark:text-primary-400 font-black text-[12px] bg-primary-100/50 dark:bg-primary-900/30 px-1.5 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                                                            {p.stock}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Conteo Físico</label>
                                                    <input 
                                                        id={`input-${p.id}`}
                                                        type="number"
                                                        inputMode="decimal"
                                                        className={`w-full p-2.5 bg-white dark:bg-slate-950 border-2 rounded-xl text-center font-black text-xl outline-none transition-all ${
                                                            (valStr !== "" && diff !== 0) ? 'border-primary-500 ring-2 ring-primary-500/10' : 'border-slate-200 dark:border-slate-700'
                                                        }`}
                                                        value={valStr}
                                                        placeholder="0"
                                                        onChange={e => setCounts({...counts, [id]: e.target.value})}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </div>
                                                <div className="w-20 text-center">
                                                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Diferencia</label>
                                                    <div className={`font-black text-xs h-[46px] flex items-center justify-center rounded-xl border-2 ${
                                                        valStr !== "" && diff > 0 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        valStr !== "" && diff < 0 ? 'bg-rose-50 text-red-600 border-red-100' : 
                                                        valStr !== "" && diff === 0 ? 'bg-slate-100 text-slate-400 border-slate-200' :
                                                        'bg-slate-100 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                                                    }`}>
                                                        {valStr !== "" ? (diff > 0 ? `+${diff}` : diff === 0 ? 'OK' : diff) : '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAL ESCÁNER CÁMARA (Html5Qrcode) */}
            {showCamera && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[2000] flex flex-col animate-in fade-in duration-300">
                    <div className="p-4 flex justify-between items-center bg-black/50 shrink-0 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <h3 className="text-white font-black text-xs uppercase tracking-widest">Escáner Móvil</h3>
                        </div>
                        <button onClick={stopCameraScanner} className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                            <X size={24}/>
                        </button>
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-black">
                        {isCameraLoading && (
                            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black">
                                <Loader2 className="animate-spin text-white" size={48}/>
                            </div>
                        )}
                        <div id="reader" className="w-full max-w-[500px]"></div>
                    </div>
                    
                    <div className="p-8 bg-black/50 text-center shrink-0">
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">Apunte al código de barras</p>
                    </div>
                </div>
            )}

            {/* MODAL GUARDAR BORRADOR */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl w-full max-w-sm border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter">Guardar Auditoría</h3>
                            <button onClick={() => setShowSaveModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Borrador</p>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-700 rounded-2xl text-center font-black text-xl outline-none focus:border-primary-500 uppercase"
                                    placeholder="EJ: ALMACÉN A"
                                    value={sessionName}
                                    onChange={e => setSessionName(e.target.value)}
                                />
                                <p className="text-[9px] text-slate-400 italic">Este inventario podrá ser retomado más tarde.</p>
                            </div>
                            <button onClick={() => handleAction('DRAFT')} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl shadow-xl hover:bg-primary-700 transition-all uppercase tracking-widest text-[10px]">Guardar Progreso</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RECUPERAR BORRADOR */}
            {showRecoverModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden border border-white/20 animate-in zoom-in-95">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                            <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2"><ListRestart size={18} className="text-primary-500"/> Borradores Disponibles</h3>
                            <button onClick={() => setShowRecoverModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={18}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {savedDrafts.length === 0 ? (
                                <div className="py-20 text-center text-slate-300 italic flex flex-col items-center">
                                    <FolderOpen size={48} strokeWidth={1} className="mb-3 opacity-20"/>
                                    <p className="text-xs font-bold uppercase">No hay borradores guardados</p>
                                </div>
                            ) : savedDrafts.map(s => (
                                <button key={s.id} onClick={() => loadDraft(s)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary-500 transition-all group flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-xs text-slate-800 dark:text-white uppercase">{s.id.replace('DRAFT-', '')}</p>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">{s.date} - {s.items.length} productos</p>
                                    </div>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-primary-500 transition-colors"/>
                                </button>
                            ))}
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-center">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Máximo 15 borradores almacenados</p>
                        </div>
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default InventoryAdjustmentModule;
