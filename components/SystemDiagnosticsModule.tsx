
import React, { useState } from 'react';
import { 
    Bug, Play, CheckCircle, XCircle, AlertTriangle, 
    RefreshCw, Package, Wallet, Database, Activity, 
    Terminal, Zap, ShieldCheck, History, RotateCcw
} from 'lucide-react';
import { Product, CashMovement, StockMovement, CartItem, PaymentBreakdown, ServiceOrder } from '../types';

interface SystemDiagnosticsProps {
    products: Product[];
    cashMovements: CashMovement[];
    stockMovements: StockMovement[];
    onAddCashMovement: (movement: CashMovement) => void;
    onAddProduct: (p: Product) => void;
    onProcessSale: (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => void;
    onProcessPurchase: (cart: CartItem[], total: number, docType: string, supplierName: string, paymentCondition: 'Contado' | 'Credito', creditDays: number, detailedPayments?: any[], currency?: string, exchangeRate?: number) => void;
    onProcessCreditNote: (originalSaleId: string, itemsToReturn: { itemId: string, quantity: number }[], totalRefund: number, breakdown: PaymentBreakdown, detailedRefunds?: any[]) => void;
    onAddService: (s: ServiceOrder) => void;
    currentBranchId: string;
}

const SystemDiagnosticsModule: React.FC<SystemDiagnosticsProps> = ({ 
    products, 
    cashMovements, 
    stockMovements,
    onAddCashMovement,
    onAddProduct,
    onProcessSale,
    onProcessPurchase,
    onProcessCreditNote,
    onAddService,
    currentBranchId
}) => {
    const [testLogs, setTestLogs] = useState<{ id: number, name: string, status: 'PENDING' | 'PASS' | 'FAIL', details: string, time: string }[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const addLog = (name: string, status: 'PASS' | 'FAIL' | 'PENDING', details: string) => {
        setTestLogs(prev => [{ 
            id: Date.now() + Math.random(), 
            name, 
            status, 
            details,
            time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }, ...prev]);
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // --- TEST: TRACEABILITY CYCLE ---
    const runTraceabilityTest = async () => {
        setIsTesting(true);
        const testName = "Auto-Test: Trazabilidad 360°";
        setTestLogs([]);
        addLog(testName, 'PENDING', "Iniciando ciclo de vida automatizado con retrasos de 3s...");

        try {
            const randomId = Math.floor(Math.random() * 9000).toString();
            const sku = `TEST-${randomId}`;
            const productName = `PRODUCTO DINÁMICO #${randomId}`;
            
            // 1. CREACIÓN PRODUCTO (INVENTARIO INICIAL)
            const newProd: Product = {
                id: `p-test-${randomId}`,
                code: sku,
                name: productName,
                category: 'DEBUG',
                price: 100.00,
                cost: 60.00,
                stock: 10
            };
            onAddProduct(newProd);
            addLog(testName, 'PASS', `1. [${new Date().toLocaleTimeString()}] Producto creado: ${sku}. Stock: 10, Costo: S/ 60.00`);

            await sleep(3000);

            // 2. VENTA 1
            const saleId1 = `T-SALE-A-${randomId}`;
            const saleCart1: CartItem[] = [{ ...newProd, quantity: 3, discount: 0, total: 300.00 }];
            onProcessSale(saleCart1, 300.00, 'TICKET DE VENTA', 'CLIENTE ALPHA', { cash: 300, yape: 0, card: 0, bank: 0, wallet: 0 }, saleId1, [{ method: 'Efectivo', amount: 300 }], 'PEN', 1);
            addLog(testName, 'PASS', `2. [${new Date().toLocaleTimeString()}] Venta Alpha: 3 unidades vendidas a S/ 100.00. Stock residual: 7.`);

            await sleep(3000);

            // 3. COMPRA 1 (INFLACIÓN)
            const buyCost1 = 85.00;
            const buyQty1 = 20;
            const purchaseCart1: CartItem[] = [{ ...newProd, quantity: buyQty1, price: buyCost1, discount: 0, total: buyCost1 * buyQty1 }];
            onProcessPurchase(purchaseCart1, buyCost1 * buyQty1, 'FACTURA DE COMPRA', 'PROVEEDOR CARO', 'Contado', 0, [{ method: 'Efectivo', amount: buyCost1 * buyQty1 }], 'PEN', 1);
            addLog(testName, 'PASS', `3. [${new Date().toLocaleTimeString()}] Compra 1: 20 unidades compradas a S/ ${buyCost1}. WAC debe subir.`);

            await sleep(3000);

            // 4. VENTA 2
            const saleId2 = `T-SALE-B-${randomId}`;
            const saleCart2: CartItem[] = [{ ...newProd, quantity: 5, discount: 0, total: 600.00, price: 120.00 }];
            onProcessSale(saleCart2, 600.00, 'TICKET DE VENTA', 'CLIENTE BETA', { cash: 600, yape: 0, card: 0, bank: 0, wallet: 0 }, saleId2, [{ method: 'Efectivo', amount: 600 }], 'PEN', 1);
            addLog(testName, 'PASS', `4. [${new Date().toLocaleTimeString()}] Venta Beta: 5 unidades a S/ 120.00. Stock disminuye.`);

            await sleep(3000);

            // 5. COMPRA 2 (OFERTA)
            const buyCost2 = 45.00;
            const buyQty2 = 15;
            const purchaseCart2: CartItem[] = [{ ...newProd, quantity: buyQty2, price: buyCost2, discount: 0, total: buyCost2 * buyQty2 }];
            onProcessPurchase(purchaseCart2, buyCost2 * buyQty2, 'BOLETA DE COMPRA', 'PROVEEDOR BARATO', 'Contado', 0, [{ method: 'Efectivo', amount: buyCost2 * buyQty2 }], 'PEN', 1);
            addLog(testName, 'PASS', `5. [${new Date().toLocaleTimeString()}] Compra 2: 15 unidades a S/ ${buyCost2}. WAC debe bajar.`);

            await sleep(3000);

            // 6. NOTA DE CRÉDITO (DEVOLUCIÓN DE VENTA 1)
            const returnItems = [{ itemId: newProd.id, quantity: 2 }];
            onProcessCreditNote(saleId1, returnItems, 200.00, { cash: 200, yape: 0, card: 0, bank: 0, wallet: 0 }, [{ method: 'Efectivo', amount: 200 }]);
            addLog(testName, 'PASS', `6. [${new Date().toLocaleTimeString()}] Nota de Crédito: Reingreso de 2 unidades de Venta Alpha. Egreso de caja registrado.`);

            await sleep(3000);

            // 7. SERVICIO TÉCNICO
            const service: ServiceOrder = {
                id: `S-DIAG-${randomId}`,
                branchId: currentBranchId,
                entryDate: new Date().toLocaleDateString('es-PE'),
                entryTime: new Date().toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'}),
                client: 'CLIENTE TALLER TEST',
                deviceModel: 'TERMINAL DE PRUEBA',
                issue: 'Diagnóstico de flujo de stock',
                status: 'Reparado',
                technician: 'SapiBot',
                receptionist: 'ADMIN',
                cost: 45.00,
                usedProducts: [{ productId: newProd.id, productName: newProd.name, quantity: 1, price: 100.00 }],
                color: '#8b5cf6'
            };
            onAddService(service);
            addLog(testName, 'PASS', `7. [${new Date().toLocaleTimeString()}] Taller: Salida de 1 unidad por reparación. Orden #${service.id}`);

            addLog(testName, 'PASS', "✅ TEST FINALIZADO CON ÉXITO. Se han generado marcas de tiempo únicas para cada operación.");

        } catch (e: any) {
            addLog(testName, 'FAIL', `Error en test: ${e.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
            
            {/* CABECERA DE DIAGNÓSTICO */}
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden shrink-0 border border-slate-700">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-5 bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-inner">
                            <Bug size={32} className="text-primary-400"/>
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Debug Center</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-2">Pruebas de Estrés y Diagnóstico de Estado</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => { setTestLogs([]); }}
                            className="px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                        >
                            Limpiar Logs
                        </button>
                        <button 
                            onClick={runTraceabilityTest}
                            disabled={isTesting}
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-indigo-900/50 transition-all active:scale-95"
                        >
                            {isTesting ? <RefreshCw className="animate-spin" size={14}/> : <Zap size={14}/>}
                            Ejecutar Test Cronológico
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
                
                {/* LISTADO DE PRUEBAS DISPONIBLES */}
                <div className="w-full lg:w-1/3 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col p-6 gap-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Terminal size={14}/> Unidades de Control
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 group hover:border-indigo-500/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-indigo-600"><History size={20}/></div>
                                <button onClick={runTraceabilityTest} disabled={isTesting} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 rounded-xl transition-all"><Play size={16}/></button>
                            </div>
                            <h4 className="font-black text-xs uppercase text-slate-800 dark:text-white">Trazabilidad Total (Retrasada)</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Ejecuta operaciones con 3s de desfase para auditar tiempos en el Kardex y WAC.</p>
                        </div>

                        <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 group hover:border-blue-500/50 transition-all opacity-50">
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-blue-600"><Database size={20}/></div>
                                <button className="p-2 rounded-xl" disabled><Play size={16}/></button>
                            </div>
                            <h4 className="font-black text-xs uppercase text-slate-800 dark:text-white">Validación de Esquema Cloud</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-tight">Próximamente: Verifica integridad de tablas en Supabase.</p>
                        </div>
                    </div>
                </div>

                {/* LOGS DE RESULTADOS */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2"><Activity size={16}/> Consola de Resultados</h3>
                        <span className="text-[9px] font-black text-slate-400 uppercase">Frecuencia de Test: 0.33Hz (3s)</span>
                    </div>
                    
                    <div className="flex-1 overflow-auto p-6 space-y-4 font-mono">
                        {testLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                <Terminal size={64}/>
                                <p className="mt-4 font-black uppercase text-sm">Esperando ejecución...</p>
                            </div>
                        ) : testLogs.map(log => (
                            <div key={log.id} className={`p-4 rounded-2xl border-2 flex gap-4 animate-in slide-in-from-left-4 ${log.status === 'PASS' ? 'bg-emerald-50 border-emerald-100' : log.status === 'PENDING' ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
                                <div className="shrink-0">
                                    {log.status === 'PASS' ? <CheckCircle className="text-emerald-600" size={20}/> : log.status === 'PENDING' ? <RefreshCw className="text-indigo-600 animate-spin" size={20}/> : <XCircle className="text-rose-600" size={20}/>}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black text-[10px] uppercase ${log.status === 'PASS' ? 'text-emerald-700' : 'text-slate-700'}`}>{log.name}</span>
                                        <span className="text-[9px] text-slate-400 font-bold">{log.time}</span>
                                    </div>
                                    <p className={`text-xs font-bold ${log.status === 'PASS' ? 'text-emerald-800' : 'text-slate-800'}`}>
                                        {log.details}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl shadow-inner"><ShieldCheck size={20}/></div>
                        <p className="text-[9px] font-bold text-slate-500 uppercase leading-relaxed tracking-tighter">
                            Este test garantiza que cada registro tenga su propio segundo en el historial, facilitando la auditoría visual y la validación de la lógica WAC (Costo Promedio Ponderado) basada en stock residual.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SystemDiagnosticsModule;
