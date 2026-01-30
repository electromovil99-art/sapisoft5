
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database, CloudUpload, CloudDownload, CheckCircle, AlertTriangle, Save, Server, Loader2, Zap, FileCode, Copy, Play, X, CloudOff } from 'lucide-react';
import { Product, Client, CashMovement, SaleRecord, ServiceOrder, Supplier, Brand, Category, BankAccount } from '../types';

interface DatabaseModuleProps {
    isSyncEnabled: boolean; // NEW
    data: {
        products: Product[];
        clients: Client[];
        movements: CashMovement[];
        sales: SaleRecord[];
        services: ServiceOrder[];
        suppliers: Supplier[];
        brands: Brand[];
        categories: Category[];
        bankAccounts: BankAccount[];
    };
    onSyncDownload: (data: any) => void;
}

const DatabaseModule: React.FC<DatabaseModuleProps> = ({ isSyncEnabled, data, onSyncDownload }) => {
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    
    // New state for manual SQL sync
    const [showSqlModal, setShowSqlModal] = useState(false);
    const [generatedSql, setGeneratedSql] = useState('');
    const [copyButtonText, setCopyButtonText] = useState('Copiar SQL');

    useEffect(() => {
        const storedUrl = localStorage.getItem('supabase_url');
        const storedKey = localStorage.getItem('supabase_key');
        if (storedUrl) setSupabaseUrl(storedUrl);
        if (storedKey) setSupabaseKey(storedKey);
        if (storedUrl && storedKey) checkConnection(storedUrl, storedKey);
    }, []);

    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const checkConnection = async (url: string, key: string) => {
        try {
            const supabase = createClient(url, key);
            const { error } = await supabase.from('products').select('id', { count: 'exact', head: true });
            if (error && error.code !== '42P01' && error.code !== 'PGRST116') throw error;
            setStatus('CONNECTED');
            addLog("✅ Conexión exitosa con Supabase.");
        } catch (e: any) {
            setStatus('ERROR');
            addLog(`❌ Error de conexión: ${e.message || 'Verifique URL/Key'}`);
        }
    };
    
    const handleSaveConfig = () => {
        localStorage.setItem('supabase_url', supabaseUrl);
        localStorage.setItem('supabase_key', supabaseKey);
        addLog("Configuración guardada. Probando conexión...");
        checkConnection(supabaseUrl, supabaseKey);
    };

    const handleCreateTableSchema = async () => {
        if (status !== 'CONNECTED' || !isSyncEnabled) return alert("Sin conexión o sincronización desactivada.");
        setLoading(true);
        addLog("⚙️ Iniciando creación de esquema de tablas...");
        
        const supabase = createClient(supabaseUrl, supabaseKey);

        const schemaSQL = `
            CREATE TABLE IF NOT EXISTS public.tenants ( id TEXT PRIMARY KEY, company_name TEXT, industry TEXT, status TEXT, subscription_end TEXT, owner_name TEXT, phone TEXT, plan_type TEXT );
            CREATE TABLE IF NOT EXISTS public.system_users ( id TEXT PRIMARY KEY, username TEXT UNIQUE, full_name TEXT, email TEXT, "password" TEXT, "role" TEXT, active BOOLEAN, permissions TEXT[], company_name TEXT );
            CREATE TABLE IF NOT EXISTS public.products ( id TEXT PRIMARY KEY, code TEXT, name TEXT, category TEXT, price NUMERIC, stock INTEGER, location TEXT, brand TEXT );
            CREATE TABLE IF NOT EXISTS public.clients ( id TEXT PRIMARY KEY, name TEXT, dni TEXT, phone TEXT, email TEXT, address TEXT, district TEXT, province TEXT, department TEXT, credit_line NUMERIC, credit_used NUMERIC, total_purchases NUMERIC, last_purchase_date TEXT, payment_score INTEGER, tags TEXT[], digital_balance NUMERIC );
            CREATE TABLE IF NOT EXISTS public.sales ( id TEXT PRIMARY KEY, date TEXT, "time" TEXT, client_name TEXT, doc_type TEXT, total NUMERIC, items JSONB, payment_breakdown JSONB, user_name TEXT );
            CREATE TABLE IF NOT EXISTS public.purchases ( id TEXT PRIMARY KEY, date TEXT, "time" TEXT, supplier_name TEXT, doc_type TEXT, total NUMERIC, items JSONB, payment_condition TEXT, user_name TEXT );
            CREATE TABLE IF NOT EXISTS public.cash_movements ( id TEXT PRIMARY KEY, date TEXT, "time" TEXT, type TEXT, payment_method TEXT, concept TEXT, reference_id TEXT, amount NUMERIC, user_name TEXT, related_items JSONB, financial_type TEXT, category TEXT );
            CREATE TABLE IF NOT EXISTS public.service_orders ( id TEXT PRIMARY KEY, entry_date TEXT, entry_time TEXT, client TEXT, client_phone TEXT, device_model TEXT, issue TEXT, status TEXT, technician TEXT, receptionist TEXT, cost NUMERIC, used_products JSONB, exit_date TEXT, exit_time TEXT, color TEXT );
            CREATE TABLE IF NOT EXISTS public.suppliers ( id TEXT PRIMARY KEY, name TEXT, ruc TEXT, phone TEXT, email TEXT, address TEXT, contact_name TEXT );
            CREATE TABLE IF NOT EXISTS public.brands ( id TEXT PRIMARY KEY, name TEXT UNIQUE );
            CREATE TABLE IF NOT EXISTS public.categories ( id TEXT PRIMARY KEY, name TEXT UNIQUE );
            CREATE TABLE IF NOT EXISTS public.bank_accounts ( id TEXT PRIMARY KEY, bank_name TEXT, account_number TEXT, currency TEXT, alias TEXT );
        `;
        
        try {
            addLog("Intentando ejecutar script SQL vía RPC...");
            const { error } = await supabase.rpc('execute_sql', { sql: schemaSQL });
            if (error) throw error;
            
            addLog("✅ ¡Éxito! Todas las 12 tablas fueron creadas/verificadas.");
            addLog("🎉 ¡Listo para sincronizar datos!");
        } catch (e: any) {
            addLog(`❌ Error al crear esquema: ${e.message}`);
            addLog("💡 SOLUCIÓN: Copie y ejecute el siguiente script en el 'SQL Editor' de Supabase y luego intente de nuevo:");
            addLog(`create or replace function execute_sql(sql text) returns void as $$ begin execute sql; end; $$ language plpgsql;`);
        } finally {
            setLoading(false);
        }
    };
    
    // --- Manual Sync Logic ---
    const handleGenerateAndShowSql = () => {
        if (status !== 'CONNECTED' || !isSyncEnabled) return alert("Sin conexión o sincronización desactivada.");
        setLoading(true);
        addLog("... Generando script SQL para subida manual ...");

        const escapeSqlValue = (val: any) => {
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (typeof val === 'number') return val;
            if (Array.isArray(val)) {
                if (val.every(item => typeof item === 'string')) {
                    return `ARRAY[${val.map(item => `'${String(item).replace(/'/g, "''")}'`).join(', ')}]`;
                }
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            if (typeof val === 'object') {
                return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
            }
            return `'${String(val).replace(/'/g, "''")}'`;
        };

        const generateUpsertSql = (tableName: string, dataArray: any[], columnsMap: { key: string, name: string }[]) => {
            if (!dataArray || dataArray.length === 0) return `-- No data for ${tableName}\n`;
            
            const primaryKeyName = columnsMap[0].name;
            const columnNames = columnsMap.map(c => `"${c.name}"`).join(', ');

            const values = dataArray.map(row => 
                `  (${columnsMap.map(col => escapeSqlValue(row[col.key])).join(', ')})`
            ).join(',\n');

            const updateSet = columnsMap.slice(1).map(col => `"${col.name}" = EXCLUDED."${col.name}"`).join(',\n    ');

            return `
-- Upserting ${dataArray.length} rows into ${tableName}
INSERT INTO public.${tableName} (${columnNames}) VALUES
${values}
ON CONFLICT (${primaryKeyName}) DO UPDATE SET
    ${updateSet};
`;
        };
        
        const sqlParts = [
            generateUpsertSql('products', data.products, [ {key: 'id', name: 'id'}, {key: 'code', name: 'code'}, {key: 'name', name: 'name'}, {key: 'category', name: 'category'}, {key: 'price', name: 'price'}, {key: 'stock', name: 'stock'}, {key: 'location', name: 'location'}, {key: 'brand', name: 'brand'} ]),
            generateUpsertSql('clients', data.clients, [ {key: 'id', name: 'id'}, {key: 'name', name: 'name'}, {key: 'dni', name: 'dni'}, {key: 'phone', name: 'phone'}, {key: 'email', name: 'email'}, {key: 'address', name: 'address'}, {key: 'district', name: 'district'}, {key: 'province', name: 'province'}, {key: 'department', name: 'department'}, {key: 'creditLine', name: 'credit_line'}, {key: 'creditUsed', name: 'credit_used'}, {key: 'totalPurchases', name: 'total_purchases'}, {key: 'lastPurchaseDate', name: 'last_purchase_date'}, {key: 'paymentScore', name: 'payment_score'}, {key: 'tags', name: 'tags'}, {key: 'digitalBalance', name: 'digital_balance'} ]),
            generateUpsertSql('sales', data.sales, [ {key: 'id', name: 'id'}, {key: 'date', name: 'date'}, {key: 'time', name: 'time'}, {key: 'clientName', name: 'client_name'}, {key: 'docType', name: 'doc_type'}, {key: 'total', name: 'total'}, {key: 'items', name: 'items'}, {key: 'paymentBreakdown', name: 'payment_breakdown'}, {key: 'user', name: 'user_name'} ]),
            // FIX: Added 'date' property to cash_movements columns map
            generateUpsertSql('cash_movements', data.movements, [ {key: 'id', name: 'id'}, {key: 'date', name: 'date'}, {key: 'time', name: 'time'}, {key: 'type', name: 'type'}, {key: 'paymentMethod', name: 'payment_method'}, {key: 'concept', name: 'concept'}, {key: 'referenceId', name: 'reference_id'}, {key: 'amount', name: 'amount'}, {key: 'user', name: 'user_name'}, {key: 'relatedItems', name: 'related_items'}, {key: 'financialType', name: 'financial_type'}, {key: 'category', name: 'category'} ]),
            generateUpsertSql('service_orders', data.services, [ {key: 'id', name: 'id'}, {key: 'entryDate', name: 'entry_date'}, {key: 'entryTime', name: 'entry_time'}, {key: 'client', name: 'client'}, {key: 'clientPhone', name: 'client_phone'}, {key: 'deviceModel', name: 'device_model'}, {key: 'issue', name: 'issue'}, {key: 'status', name: 'status'}, {key: 'technician', name: 'technician'}, {key: 'receptionist', name: 'receptionist'}, {key: 'cost', name: 'cost'}, {key: 'usedProducts', name: 'used_products'}, {key: 'exitDate', name: 'exit_date'}, {key: 'exitTime', name: 'exit_time'}, {key: 'color', name: 'color'} ]),
            generateUpsertSql('suppliers', data.suppliers, [ {key: 'id', name: 'id'}, {key: 'name', name: 'name'}, {key: 'ruc', name: 'ruc'}, {key: 'phone', name: 'phone'}, {key: 'email', name: 'email'}, {key: 'address', name: 'address'}, {key: 'contactName', name: 'contact_name'} ]),
            generateUpsertSql('brands', data.brands, [ {key: 'id', name: 'id'}, {key: 'name', name: 'name'} ]),
            generateUpsertSql('categories', data.categories, [ {key: 'id', name: 'id'}, {key: 'name', name: 'name'} ]),
            generateUpsertSql('bank_accounts', data.bankAccounts, [ {key: 'id', name: 'id'}, {key: 'bankName', name: 'bank_name'}, {key: 'accountNumber', name: 'account_number'}, {key: 'currency', name: 'currency'}, {key: 'alias', name: 'alias'} ]),
        ];

        setGeneratedSql(sqlParts.join('\n'));
        addLog("✅ Script SQL generado. Mostrando vista manual.");
        setLoading(false);
        setShowSqlModal(true);
    };

    const handleCopySql = () => {
        navigator.clipboard.writeText(generatedSql);
        setCopyButtonText('¡Copiado!');
        setTimeout(() => setCopyButtonText('Copiar SQL'), 2000);
    };

    const handleUpload = async () => {
        if (status !== 'CONNECTED' || !isSyncEnabled) return alert("Sin conexión o sincronización desactivada.");
        setShowSqlModal(false); // Close modal before starting
        setLoading(true);
        addLog("Iniciando subida de datos automática...");
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
            const { error: pErr } = await supabase.from('products').upsert(data.products); if (pErr) throw pErr; addLog(`✅ Productos: ${data.products.length} registros.`);
            const { error: cErr } = await supabase.from('clients').upsert(data.clients.map(c => ({...c, credit_line: c.creditLine, credit_used: c.creditUsed, total_purchases: c.totalPurchases, payment_score: c.paymentScore, digital_balance: c.digitalBalance, last_purchase_date: c.lastPurchaseDate }))); if (cErr) throw cErr; addLog(`✅ Clientes: ${data.clients.length} registros.`);
            const { error: sErr } = await supabase.from('sales').upsert(data.sales.map(s=>({...s, client_name: s.clientName, doc_type: s.docType, user_name: s.user, payment_breakdown: s.paymentBreakdown}))); if (sErr) throw sErr; addLog(`✅ Ventas: ${data.sales.length} registros.`);
            // FIX: Map CashMovement properties correctly for upsert
            const { error: mErr } = await supabase.from('cash_movements').upsert(data.movements.map(m=>({...m, date: m.date, payment_method: m.paymentMethod, reference_id: m.referenceId, user_name: m.user, financial_type: m.financialType, related_items: m.relatedItems}))); if (mErr) throw mErr; addLog(`✅ Mov. Caja: ${data.movements.length} registros.`);
            const { error: svErr } = await supabase.from('service_orders').upsert(data.services.map(s=>({...s, entry_date:s.entryDate, entry_time:s.entryTime, client_phone: s.clientPhone, device_model: s.deviceModel, used_products: s.usedProducts, exit_date: s.exitDate, exit_time: s.exitTime}))); if (svErr) throw svErr; addLog(`✅ Serv. Técnico: ${data.services.length} registros.`);
            const { error: supErr } = await supabase.from('suppliers').upsert(data.suppliers.map(s => ({...s, contact_name: s.contactName}))); if (supErr) throw supErr; addLog(`✅ Proveedores: ${data.suppliers.length} registros.`);
            const { error: brandErr } = await supabase.from('brands').upsert(data.brands); if (brandErr) throw brandErr; addLog(`✅ Marcas: ${data.brands.length} registros.`);
            const { error: catErr } = await supabase.from('categories').upsert(data.categories); if (catErr) throw catErr; addLog(`✅ Categorías: ${data.categories.length} registros.`);
            const { error: bankErr } = await supabase.from('bank_accounts').upsert(data.bankAccounts.map(b => ({...b, bank_name: b.bankName, account_number: b.accountNumber}))); if (bankErr) throw bankErr; addLog(`✅ Cuentas Bancarias: ${data.bankAccounts.length} registros.`);
            addLog("🚀 Sincronización completada.");
        } catch (e: any) { addLog(`❌ Error al subir: ${e.message}`); } 
        finally { setLoading(false); }
    };

    const handleDownload = async () => {
        if (status !== 'CONNECTED' || !isSyncEnabled) return alert("Sin conexión o sincronización desactivada.");
        setLoading(true);
        addLog("Descargando datos de la nube...");
        const supabase = createClient(supabaseUrl, supabaseKey);
        try {
            const { data: products } = await supabase.from('products').select('*');
            const { data: clients } = await supabase.from('clients').select('*');
            const { data: sales } = await supabase.from('sales').select('*');
            const { data: movements } = await supabase.from('cash_movements').select('*');
            const { data: services } = await supabase.from('service_orders').select('*');
            const { data: suppliers } = await supabase.from('suppliers').select('*');
            const { data: brands } = await supabase.from('brands').select('*');
            const { data: categories } = await supabase.from('categories').select('*');
            const { data: bankAccounts } = await supabase.from('bank_accounts').select('*');
            
            const mappedData = {
                products: products || [],
                clients: clients?.map(c => ({...c, creditLine: c.credit_line, creditUsed: c.credit_used, totalPurchases: c.total_purchases, paymentScore: c.payment_score, digitalBalance: c.digital_balance, lastPurchaseDate: c.last_purchase_date})) || [],
                sales: sales?.map(s => ({...s, clientName: s.client_name, docType: s.doc_type, user: s.user_name, paymentBreakdown: s.payment_breakdown})) || [],
                // FIX: Map CashMovement properties correctly on download
                movements: movements?.map(m => ({...m, date: m.date, paymentMethod: m.payment_method, user: m.user_name, financialType: m.financial_type, referenceId: m.reference_id, relatedItems: m.related_items})) || [],
                services: services?.map(s => ({...s, deviceModel: s.device_model, entryDate: s.entry_date, entryTime: s.entry_time, clientPhone: s.client_phone, usedProducts: s.used_products, exitDate: s.exit_date, exitTime: s.exit_time})) || [],
                suppliers: suppliers?.map(s => ({...s, contactName: s.contact_name })) || [],
                brands: brands || [],
                categories: categories || [],
                bankAccounts: bankAccounts?.map(b => ({...b, bankName: b.bank_name, accountNumber: b.account_number })) || []
            };
            onSyncDownload(mappedData);
            addLog("📥 Datos descargados y aplicados.");
        } catch (e: any) { addLog(`❌ Error al descargar: ${e.message}`); } 
        finally { setLoading(false); }
    };

    return (
        <div className="flex h-full gap-6">
            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6"><Database className="text-blue-500"/> Configuración</h2>
                <div className="space-y-4 flex-1">
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Supabase Project URL</label><input type="text" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm" placeholder="https://xyz.supabase.co" value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)}/></div>
                    <div><label className="text-xs font-bold text-slate-500 uppercase">Supabase Anon Key</label><input type="password" className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white text-sm" placeholder="eyJhbGciOiJIUzI1NiIsInR5..." value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)}/></div>
                    <div className={`p-4 rounded-xl border flex items-center gap-3 ${status === 'CONNECTED' ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-900/30 dark:border-emerald-800' : status === 'ERROR' ? 'bg-red-50 border-red-200 text-red-700 dark:text-red-300 dark:bg-red-900/30 dark:border-red-800' : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400'}`}>{status === 'CONNECTED' ? <CheckCircle/> : status === 'ERROR' ? <AlertTriangle/> : <Server/>}<div><p className="font-bold text-sm">{status === 'CONNECTED' ? 'Conectado' : status === 'ERROR' ? 'Error de Conexión' : 'Desconectado'}</p><p className="text-xs opacity-80">{status === 'CONNECTED' ? 'Listo para sincronizar' : 'Configure URL y Key'}</p></div></div>
                </div>
                <button onClick={handleSaveConfig} className="w-full py-3 bg-slate-800 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl mt-4 hover:opacity-90 flex justify-center gap-2"><Save size={18}/> Guardar y Probar</button>
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Zap className="text-yellow-500"/> Paso 1: Configurar Esquema</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Este botón creará la estructura de tablas necesaria en tu base de datos Supabase para que la aplicación funcione. Solo necesitas ejecutarlo una vez.</p>
                    <button onClick={handleCreateTableSchema} disabled={loading || status !== 'CONNECTED' || !isSyncEnabled} className="w-full py-3 bg-yellow-500 text-white font-bold rounded-xl hover:bg-yellow-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><Zap size={18}/> Crear Estructura de Tablas</button>
                </div>
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-6"><CloudUpload className="text-purple-500"/> Paso 2: Sincronización</h2>
                    <div className="relative">
                        {!isSyncEnabled && (
                            <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center rounded-2xl">
                                <CloudOff size={32} className="text-red-500 mb-2"/>
                                <p className="font-bold text-slate-700 dark:text-white">Sincronización Desactivada</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Active el interruptor en la barra superior.</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={handleGenerateAndShowSql} disabled={loading || status !== 'CONNECTED' || !isSyncEnabled} className="p-6 rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/10 dark:border-purple-800 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"><div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">{loading ? <Loader2 className="animate-spin"/> : <CloudUpload size={24}/>}</div><div className="text-center"><p className="font-bold text-purple-800 dark:text-purple-300">Subir Datos Locales</p><p className="text-xs text-purple-600 dark:text-purple-400">Genera SQL o ejecuta</p></div></button>
                            <button onClick={handleDownload} disabled={loading || status !== 'CONNECTED' || !isSyncEnabled} className="p-6 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/10 dark:border-blue-800 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"><div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">{loading ? <Loader2 className="animate-spin"/> : <CloudDownload size={24}/>}</div><div className="text-center"><p className="font-bold text-blue-800 dark:text-blue-300">Descargar de Nube</p><p className="text-xs text-blue-600 dark:text-blue-400">Reemplaza datos locales</p></div></button>
                        </div>
                    </div>
                    <div className="flex-1 bg-slate-900 rounded-xl p-4 overflow-y-auto font-mono text-xs text-green-400 shadow-inner mt-6">
                        {logs.length === 0 ? <span className="opacity-50">// Esperando acciones...</span> : logs.map((l, i) => <div key={i} className="mb-1 whitespace-pre-wrap">{l}</div>)}
                    </div>
                </div>
            </div>

            {/* Manual SQL Modal */}
            {showSqlModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-3xl h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><FileCode size={20} className="text-purple-500"/> Script de Sincronización Manual</h3>
                            <button onClick={() => setShowSqlModal(false)}><X className="text-slate-400 hover:text-slate-600"/></button>
                        </div>
                        <div className="flex-1 p-4 overflow-hidden">
                            <textarea
                                readOnly
                                className="w-full h-full bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-lg resize-none border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                value={generatedSql}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
                            <button onClick={handleCopySql} className="px-4 py-2 bg-slate-600 text-white font-bold rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2">
                                <Copy size={16}/> {copyButtonText}
                            </button>
                            <button onClick={handleUpload} className="px-6 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                                <Play size={16}/> Ejecutar Sincronización
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatabaseModule;