
import React, { useState, useRef, useMemo } from 'react';
import { Search, Plus, Trash2, Edit, Save, X, Package, BarChart, RotateCcw, Filter, ArrowDown, FileScan, Download, ArrowUp, RefreshCw, AlertCircle, PackageCheck, ChevronRight, Tag, MapPin, Layers, Coins, Loader2, CheckCircle2, AlertTriangle, Clock, Info, ShieldCheck, Zap, Brain, Hash, Lock, EyeOff } from 'lucide-react';
import { Product, Brand, Category, ViewState, PriceTier, SaleRecord, PurchaseRecord, StockMovement } from '../types';

interface InventoryProps {
  products: Product[];
  brands: Brand[];
  categories: Category[];
  onUpdateProduct: (product: Product) => void;
  onAddProduct: (product: Product) => void;
  onAddProducts: (products: Product[]) => void;
  onDeleteProduct: (id: string) => void;
  onNavigate: (view: ViewState) => void;
  salesHistory?: SaleRecord[];
  purchasesHistory?: PurchaseRecord[];
  stockMovements?: StockMovement[];
}

interface ImportSummary {
    success: number;
    skipped: number;
    errors: number;
    total: number;
}

export const InventoryModule: React.FC<InventoryProps> = ({ 
    products, brands, categories, onUpdateProduct, onAddProduct, onAddProducts, onDeleteProduct, onNavigate,
    salesHistory = [], purchasesHistory = [], stockMovements = []
}) => {
  const [filterText, setFilterText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showDiscontinued, setShowDiscontinued] = useState(false); // Toggle to show deleted/discontinued items

  const [showModal, setShowModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  
  // Delete Logic States
  const [showDeleteAuth, setShowDeleteAuth] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewBrand, setIsNewBrand] = useState(false);

  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    code: '', name: '', category: '', brand: '', price: 0, cost: 0, stock: 0, location: '',
    minStock: 0, maxStock: 0, stockControlMode: 'MANUAL',
    status: 'ACTIVE',
    priceTiers: [
      { price: 0, minQuantity: 0 },
      { price: 0, minQuantity: 0 },
      { price: 0, minQuantity: 0 },
      { price: 0, minQuantity: 0 }
    ]
  });

  const normalizeForSearch = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredProducts = products.filter(p => {
    const searchWords = normalizeForSearch(filterText).split(" ").filter(w => w !== "");
    const targetString = normalizeForSearch(`${p.name} ${p.code} ${p.brand || ""} ${p.category || ""}`);
    const matchesText = filterText === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    
    // Status Filter: Only show active unless toggle is on
    const isDiscontinued = p.status === 'DISCONTINUED';
    if (!showDiscontinued && isDiscontinued) return false;
    
    return matchesText && matchesCategory;
  });

  const handleOpenModal = () => {
      setNewProduct({ 
        code: '', name: '', category: '', brand: '', price: 0, cost: 0, stock: 0, location: '',
        minStock: 0, maxStock: 0, stockControlMode: 'MANUAL', status: 'ACTIVE',
        priceTiers: [
          { price: 0, minQuantity: 0 },
          { price: 0, minQuantity: 0 },
          { price: 0, minQuantity: 0 },
          { price: 0, minQuantity: 0 }
        ]
      });
      setIsNewCategory(false);
      setIsNewBrand(false);
      setShowModal(true);
  };

  const handleSave = () => {
    if (!newProduct.code || !newProduct.name) {
        alert("El código y nombre son obligatorios.");
        return;
    }
    const validTiers = newProduct.priceTiers?.filter(t => t.price > 0 && t.minQuantity > 0) || [];
    onAddProduct({ 
      ...newProduct, 
      id: 'P-' + Date.now(), 
      category: (newProduct.category || 'GENERAL').toUpperCase(),
      priceTiers: validTiers
    } as Product);
    setShowModal(false);
  };

  const updateTier = (index: number, field: keyof PriceTier, value: number) => {
    const updatedTiers = [...(newProduct.priceTiers || [])];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setNewProduct({ ...newProduct, priceTiers: updatedTiers });
  };

  const handleRefreshStock = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 600);
  };

  // --- DELETE LOGIC ---
  const initiateDelete = (product: Product) => {
      setProductToDelete(product);
      setDeletePassword('');
      setShowDeleteAuth(true);
  };

  const confirmDelete = () => {
      if (deletePassword !== '1234') { // Simple simulation, usually from user context
          alert("Contraseña incorrecta.");
          return;
      }
      
      if (!productToDelete) return;

      // Check for history
      const hasSales = salesHistory.some(s => s.items.some(i => i.id === productToDelete.id));
      const hasPurchases = purchasesHistory.some(p => p.items.some(i => i.id === productToDelete.id));
      const hasMoves = stockMovements.some(m => m.productId === productToDelete.id);

      if (hasSales || hasPurchases || hasMoves) {
          // Soft Delete (Mark as Discontinued/Baja)
          onUpdateProduct({
              ...productToDelete,
              status: 'DISCONTINUED',
              stock: 0 // Reset stock to 0 as it's discontinued
          });
          alert(`El producto "${productToDelete.name}" tiene historial de movimientos. No se puede eliminar por completo para mantener la integridad de los datos. \n\nSe ha marcado como "DE BAJA" y su stock se ha ajustado a 0.`);
      } else {
          // Hard Delete
          onDeleteProduct(productToDelete.id);
          alert(`El producto "${productToDelete.name}" ha sido eliminado permanentemente del sistema.`);
      }

      setShowDeleteAuth(false);
      setProductToDelete(null);
  };

  const handleExcelImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... (Existing Excel Import Logic - Preserved)
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSummary(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            if (!arrayBuffer) throw new Error("No se pudo leer el archivo.");

            const utf8Decoder = new TextDecoder("utf-8");
            let text = utf8Decoder.decode(arrayBuffer);

            if (text.includes("")) {
                const ansiDecoder = new TextDecoder("iso-8859-1");
                text = ansiDecoder.decode(arrayBuffer);
            }

            const lines = text.split(/\r?\n/).filter(l => l.trim() !== "");
            if (lines.length < 2) throw new Error("El archivo no tiene datos suficientes.");

            let startIdx = 0;
            let delimiter = ";";
            
            if (lines[0].startsWith("sep=")) {
                delimiter = lines[0].split("=")[1].trim().charAt(0);
                startIdx = 1;
            } else {
                const firstRow = lines[0];
                const commas = (firstRow.match(/,/g) || []).length;
                const semiColons = (firstRow.match(/;/g) || []).length;
                delimiter = semiColons >= commas ? ";" : ",";
            }

            const importedItems: Product[] = [];
            let skippedCount = 0;
            let errorCount = 0;
            const existingCodes = new Set(products.map(p => p.code));

            const headerLine = lines[startIdx].toLowerCase();
            if (headerLine.includes("sku") || headerLine.includes("nombre") || headerLine.includes("ref_id")) {
                startIdx++;
            }

            for (let i = startIdx; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const columns = line.split(new RegExp(`${delimiter}(?=(?:(?:[^"]*"){2})*[^"]*$)`))
                    .map(c => c.replace(/^"|"$/g, '').trim());

                if (columns.length < 7) {
                    errorCount++;
                    continue;
                }

                const code = columns[1]; 
                const name = columns[2]; 
                if (!code || !name) { errorCount++; continue; }
                if (existingCodes.has(code)) { skippedCount++; continue; }

                const category = columns[3] || 'GENERAL';
                const brand = columns[4] || 'SIN MARCA';
                const stock = parseInt(columns[5]);
                const price = parseFloat(columns[6]?.replace(',', '.'));
                const location = columns[7] || '';

                const priceTiers: PriceTier[] = [];
                for (let j = 8; j <= 14; j += 2) {
                    const tPrice = parseFloat(columns[j]?.replace(',', '.') || '0');
                    const tMinQty = parseInt(columns[j+1] || '0');
                    if (tPrice > 0 && tMinQty > 0) priceTiers.push({ price: tPrice, minQuantity: tMinQty });
                }

                importedItems.push({
                    id: 'IMP-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '-' + Date.now(),
                    code,
                    name: name.toUpperCase(),
                    category: category.toUpperCase(),
                    brand: brand.toUpperCase(),
                    stock: isNaN(stock) ? 0 : stock,
                    price: isNaN(price) ? 0 : price,
                    location: location.toUpperCase(),
                    cost: isNaN(price) ? 0 : price * 0.7,
                    priceTiers: priceTiers.length > 0 ? priceTiers : undefined,
                    minStock: 0,
                    maxStock: 0,
                    stockControlMode: 'MANUAL',
                    status: 'ACTIVE'
                });
                existingCodes.add(code);
            }

            if (importedItems.length > 0) onAddProducts(importedItems);
            setImportSummary({ success: importedItems.length, skipped: skippedCount, errors: errorCount, total: lines.length - startIdx });
        } catch (err: any) {
            alert("Error crítico: " + err.message);
        } finally {
            setIsImporting(false);
            if (excelImportRef.current) excelImportRef.current.value = '';
        }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExportData = (type: 'PLANTILLA' | 'DATOS') => {
      // ... (Existing Export Logic - Preserved)
      const delimiter = ";";
      const bom = "\uFEFF"; 
      const excelHeader = "sep=;\n"; 
      
      const headers = [
          "REF_ID", "SKU", "NOMBRE_PRODUCTO", "CATEGORIA", "MARCA", "STOCK_ACTUAL", "PRECIO_BASE", "UBICACION",
          "PRECIO_MAY_2", "MIN_CANT_2", "PRECIO_MAY_3", "MIN_CANT_3", "PRECIO_MAY_4", "MIN_CANT_4", "PRECIO_MAY_5", "MIN_CANT_5"
      ].join(delimiter);

      let content = excelHeader + headers + "\n";

      if (type === 'DATOS') {
          const rows = products.map(p => {
            const tiers = p.priceTiers || [];
            const tierCols = [];
            for (let i = 0; i < 4; i++) {
                tierCols.push(tiers[i]?.price?.toFixed(2) || "");
                tierCols.push(tiers[i]?.minQuantity?.toString() || "");
            }
            return [
                p.id, p.code, p.name.replace(/;/g, ' '), p.category, p.brand || '', p.stock, 
                p.price.toFixed(2), p.location || '', ...tierCols
            ].join(delimiter);
          }).join("\n");
          content += rows;
      } else {
          content += [
              "AUTO", "000001", "PRODUCTO CON Ñ Y TILDÉ", "GENERAL", "MARCA", "10", "150.00", "A-01",
              "145.00", "3", "140.00", "6", "135.00", "12", "125.00", "24"
          ].join(delimiter);
      }
      
      const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const fileName = type === 'PLANTILLA' ? 'plantilla_excel_mayoreo.csv' : `inventario_exportado.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-3 md:space-y-4 animate-in fade-in duration-500 overflow-hidden relative">
      
      {isImporting && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center gap-4 border border-white/20 animate-in zoom-in-95">
                  <div className="relative">
                      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                      <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-600" size={24}/>
                  </div>
                  <div className="text-center">
                      <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter">Procesando Excel</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detectando Ñ y caracteres especiales...</p>
                  </div>
              </div>
          </div>
      )}

      {importSummary && (
          <div className="fixed inset-0 z-[2001] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/10 animate-in zoom-in-95">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                      <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <CheckCircle2 size={32}/>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Importación Finalizada</h3>
                  </div>
                  <div className="p-8 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center">
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">Nuevos</p>
                              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{importSummary.success}</p>
                          </div>
                          <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800 text-center">
                              <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Dúplices</p>
                              <p className="text-2xl font-black text-amber-700 dark:text-emerald-400">{importSummary.skipped}</p>
                          </div>
                          <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-800 text-center">
                              <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Errores</p>
                              <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{importSummary.errors}</p>
                          </div>
                      </div>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
                      <button onClick={() => setImportSummary(null)} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all">Ver Almacén</button>
                  </div>
              </div>
          </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteAuth && productToDelete && (
          <div className="fixed inset-0 z-[2500] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-white/10 animate-in zoom-in-95 overflow-hidden">
                  <div className="p-6 bg-rose-50 dark:bg-rose-900/20 border-b border-rose-100 dark:border-rose-900/30 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-rose-100 dark:bg-rose-800 text-rose-600 dark:text-rose-200 rounded-full flex items-center justify-center mb-4">
                          <Trash2 size={32}/>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Eliminar Producto</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2 uppercase">{productToDelete.name}</p>
                  </div>
                  <div className="p-8 space-y-4">
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
                          <AlertTriangle className="text-amber-500 shrink-0" size={20}/>
                          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-tight">
                              Si el producto tiene historial, se marcará como "DE BAJA" (Discontinued). Si no, se eliminará permanentemente.
                          </p>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 text-center">Contraseña de Administrador</label>
                          <div className="relative">
                              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                              <input 
                                  type="password" 
                                  autoFocus
                                  className="w-full pl-10 p-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xl font-black tracking-widest outline-none focus:border-rose-500 transition-colors"
                                  placeholder="****"
                                  value={deletePassword}
                                  onChange={e => setDeletePassword(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && confirmDelete()}
                              />
                          </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowDeleteAuth(false)} className="flex-1 py-3 text-slate-500 font-bold uppercase text-[10px] hover:bg-slate-100 rounded-xl transition-all">Cancelar</button>
                          <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-700 transition-all">Confirmar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 gap-3">
         <div className="flex flex-col md:flex-row items-center gap-3 w-full">
             <div className="relative w-full md:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                <input 
                   type="text" 
                   className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm w-full focus:bg-white dark:focus:bg-slate-600 focus:border-primary-500 outline-none transition-all font-bold"
                   placeholder="Buscar en almacén..."
                   value={filterText}
                   onChange={e => setFilterText(e.target.value)}
                />
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                    <select 
                        className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm appearance-none outline-none cursor-pointer text-slate-700 dark:text-white font-bold"
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                    >
                        <option value="">Categorías</option>
                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <button onClick={handleRefreshStock} disabled={isSyncing} className={`p-2.5 rounded-xl transition-all border shrink-0 ${isSyncing ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 active:scale-90 shadow-sm'}`}>
                    <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''}/>
                </button>
             </div>
         </div>
        <div className="flex flex-wrap items-center gap-2 w-full">
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-sm overflow-hidden">
                <button onClick={() => handleExportData('PLANTILLA')} className="flex-1 py-2.5 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors border-r dark:border-slate-600"><ArrowUp size={14} className="text-emerald-500"/> Plantilla Excel</button>
                <button 
                    onClick={() => excelImportRef.current?.click()} 
                    disabled={isImporting}
                    className="flex-1 py-2.5 text-slate-700 dark:text-slate-200 text-[10px] font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors border-r dark:border-slate-600 disabled:opacity-50"
                >
                    {isImporting ? <Loader2 size={14} className="animate-spin text-blue-500"/> : <ArrowDown size={14} className="text-blue-500"/>} 
                    {isImporting ? 'Cargando...' : 'Importar Excel'}
                </button>
                <button onClick={() => handleExportData('DATOS')} className="flex-1 py-2.5 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase hover:bg-blue-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1.5 transition-colors"><ArrowUp size={14}/> Respaldar</button>
            </div>
            <input type="file" ref={excelImportRef} onChange={handleExcelImport} className="hidden" accept=".csv, .txt"/>
            
            {/* Toggle Show Discontinued */}
            <button 
                onClick={() => setShowDiscontinued(!showDiscontinued)}
                className={`px-4 py-2.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${showDiscontinued ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'}`}
                title="Mostrar productos de baja"
            >
                {showDiscontinued ? <EyeOff size={16}/> : <Trash2 size={16}/>}
            </button>

             <button onClick={handleOpenModal} className="w-full md:w-auto bg-primary-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest shrink-0">
                <Plus size={16}/> Registrar Producto
             </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col transition-colors">
         <div className="hidden md:block overflow-auto flex-1">
            <table className="w-full text-left">
               <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest border-b">
                  <tr>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Artículo</th>
                      <th className="px-6 py-4">Categoría</th>
                      <th className="px-6 py-4">Marca</th>
                      <th className="px-6 py-4 text-center">Ubicación</th>
                      <th className="px-6 py-4 text-right">Stock</th>
                      <th className="px-6 py-4 text-right">Precio</th>
                      <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {filteredProducts.map(p => (
                     <tr key={p.id} className={`group transition-colors ${p.status === 'DISCONTINUED' ? 'bg-slate-100 dark:bg-slate-900 opacity-60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-700'}`}>
                        <td className="px-6 py-4 font-mono text-slate-400 text-[10px]">{p.code}</td>
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight flex items-center gap-2">
                                {p.name}
                                {p.status === 'DISCONTINUED' && <span className="bg-slate-200 text-slate-600 text-[8px] px-1.5 py-0.5 rounded font-black">BAJA</span>}
                            </div>
                        </td>
                        <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[9px] font-black rounded uppercase border border-slate-200 dark:border-slate-600">{p.category}</span></td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-[10px] font-bold">{p.brand || 'SIN MARCA'}</td>
                        <td className="px-6 py-4 text-center text-slate-400 text-[10px] font-medium">{p.location || '-'}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                                <span className={`font-black px-4 py-1.5 rounded-xl text-lg inline-block min-w-[4rem] text-center border shadow-sm transition-all ${
                                    p.stock < 0 ? 'bg-rose-600 text-white border-rose-700 animate-pulse' : 
                                    p.stock < 5 ? 'bg-red-50 text-red-700 border-red-200' : 
                                    p.stock < 15 ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                    'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                    {p.stock}
                                </span>
                                {p.stock < 0 && <span className="text-[8px] text-rose-500 font-black uppercase mt-1">Desbalance</span>}
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white text-sm">S/ {p.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-center">
                            <button 
                                onClick={() => initiateDelete(p)} 
                                className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                title="Eliminar Producto"
                            >
                                <Trash2 size={18}/>
                            </button>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[1000] flex items-center justify-center p-2 md:p-4">
            <div className="bg-white dark:bg-slate-800 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-[1000px] max-h-[92vh] flex flex-col overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200">
                {/* ... (Existing Modal Content - Preserved) ... */}
                
                {/* HEADER REDISEÑADO */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h3 className="font-black text-lg uppercase tracking-tighter text-slate-800 dark:text-white leading-none">Registrar Nuevo Producto</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Completa la ficha técnica del artículo</p>
                        </div>
                    </div>
                    <button onClick={() => setShowModal(false)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400 hover:text-slate-800"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
                    
                    {/* SECCIÓN 1: IDENTIFICACIÓN (FULL WIDTH) */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                            <Tag className="text-primary-500" size={18}/>
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Información de Identidad</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">SKU / Cód. Barras</label>
                                <div className="relative group">
                                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500" size={16}/>
                                    <input type="text" className="w-full pl-11 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-[1.2rem] uppercase text-sm font-black outline-none focus:border-primary-500 shadow-sm" value={newProduct.code} onChange={e => setNewProduct({...newProduct, code: e.target.value})} placeholder="000000" autoFocus/>
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descripción Comercial del Producto</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-[1.2rem] uppercase text-sm font-black outline-none focus:border-primary-500 shadow-sm" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ej: PANTALLA IPHONE 13 ORIGINAL"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoría</label>
                                <div className="flex gap-2">
                                    {isNewCategory ? (
                                        <input type="text" className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-[1.2rem] uppercase text-xs font-black outline-none focus:border-primary-500" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="NUEVA CAT." />
                                    ) : (
                                        <select className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-[1.2rem] uppercase text-xs font-black outline-none focus:border-primary-500 cursor-pointer" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                                            <option value="">SELECCIONAR</option>
                                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    )}
                                    <button onClick={() => setIsNewCategory(!isNewCategory)} className="w-14 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-[1.2rem] flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all shadow-sm">
                                        {isNewCategory ? <RotateCcw size={18}/> : <Plus size={18}/>}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                                <div className="flex gap-2">
                                    {isNewBrand ? (
                                        <input type="text" className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-[1.2rem] uppercase text-xs font-black outline-none focus:border-primary-500" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} placeholder="NUEVA MARCA" />
                                    ) : (
                                        <select className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-[1.2rem] uppercase text-xs font-black outline-none focus:border-primary-500 cursor-pointer" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})}>
                                            <option value="">SIN MARCA</option>
                                            {brands.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                        </select>
                                    )}
                                    <button onClick={() => setIsNewBrand(!isNewBrand)} className="w-14 bg-white dark:bg-slate-700 border-2 border-slate-100 dark:border-slate-600 rounded-[1.2rem] flex items-center justify-center text-slate-400 hover:text-primary-600 transition-all shadow-sm">
                                        {isNewBrand ? <RotateCcw size={18}/> : <Plus size={18}/>}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ubicación Física</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary-500" size={16}/>
                                    <input type="text" className="w-full pl-11 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-[1.2rem] uppercase text-xs font-black outline-none focus:border-primary-500" value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})} placeholder="PASILLO A - ESTANTE 2"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2: CONTROL DE EXISTENCIAS Y STOCK INTELIGENTE */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        
                        {/* COLUMNA 1: STOCK Y COSTOS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                                <Package className="text-emerald-500" size={18}/>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Existencias y Costos</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block text-center">Stock Actual</label>
                                    <input type="number" className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-3xl font-black text-center outline-none focus:border-emerald-500 shadow-inner" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})} placeholder="0"/>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase block text-center">Costo de Compra S/</label>
                                    <input type="number" className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-3xl text-3xl font-black text-center outline-none focus:border-emerald-500 shadow-inner" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: Number(e.target.value)})} placeholder="0.00"/>
                                </div>
                            </div>

                            {/* PANEL DE STOCK MÍNIMO/MÁXIMO (NUEVO) */}
                            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700 space-y-5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="text-primary-500" size={16}/>
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Umbrales de Alerta</h5>
                                    </div>
                                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <button 
                                            onClick={() => setNewProduct({...newProduct, stockControlMode: 'MANUAL'})}
                                            className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg transition-all ${newProduct.stockControlMode === 'MANUAL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}
                                        >
                                            Manual
                                        </button>
                                        <button 
                                            onClick={() => setNewProduct({...newProduct, stockControlMode: 'AUTOMATIC'})}
                                            className={`px-3 py-1 text-[8px] font-black uppercase rounded-lg transition-all flex items-center gap-1 ${newProduct.stockControlMode === 'AUTOMATIC' ? 'bg-primary-600 text-white shadow-md' : 'text-slate-400'}`}
                                        >
                                            <Zap size={10} className={newProduct.stockControlMode === 'AUTOMATIC' ? 'animate-pulse' : ''}/> Auto
                                        </button>
                                    </div>
                                </div>

                                {newProduct.stockControlMode === 'AUTOMATIC' ? (
                                    <div className="flex flex-col items-center justify-center py-4 px-2 text-center space-y-2 animate-in fade-in zoom-in-95">
                                        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600">
                                            <Brain size={20}/>
                                        </div>
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-tight">Algoritmo Predictivo Activado</p>
                                        <p className="text-[9px] font-medium text-slate-400 uppercase leading-relaxed max-w-[250px]">
                                            El sistema recalculará mensualmente el stock ideal basado en el promedio de ventas y estacionalidad detectada.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase block text-center">Stock Mínimo</label>
                                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black text-center outline-none focus:border-primary-500" value={newProduct.minStock} onChange={e => setNewProduct({...newProduct, minStock: Number(e.target.value)})} placeholder="0"/>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase block text-center">Stock Máximo</label>
                                            <input type="number" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xl font-black text-center outline-none focus:border-primary-500" value={newProduct.maxStock} onChange={e => setNewProduct({...newProduct, maxStock: Number(e.target.value)})} placeholder="0"/>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* COLUMNA 2: PRECIOS Y MAYOREO */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-3">
                                <Coins className="text-primary-500" size={18}/>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">Política de Precios</h4>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-primary-500 uppercase block text-center tracking-[0.1em]">Precio de Venta Base (Público)</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary-300">S/</div>
                                    <input type="number" className="w-full pl-16 p-5 bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-[2.5rem] text-5xl font-black text-center text-primary-600 outline-none focus:border-primary-500 shadow-xl shadow-primary-500/5" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} placeholder="0.00"/>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-700">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-4 flex items-center gap-2">
                                    <Layers size={14}/> Escalas de Mayoreo
                                </h5>
                                <div className="grid grid-cols-1 gap-2">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-orange-200 transition-all">
                                            <div className="flex-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-1 text-center">Precio Unit. S/</label>
                                                <input type="number" className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl text-center font-black text-sm outline-none focus:border-orange-500" value={newProduct.priceTiers?.[i]?.price || ""} onChange={e => updateTier(i, 'price', Number(e.target.value))} placeholder="0.00"/>
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[8px] font-black text-slate-400 uppercase block mb-1 ml-1 text-center">Desde (Cant.)</label>
                                                <input type="number" className="w-full p-2 bg-white dark:bg-slate-900 border rounded-xl text-center font-black text-sm outline-none focus:border-orange-500" value={newProduct.priceTiers?.[i]?.minQuantity || ""} onChange={e => updateTier(i, 'minQuantity', Number(e.target.value))} placeholder="Cant"/>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER DE ACCIONES */}
                <div className="p-6 md:p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 shrink-0 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Base de Datos Online</span>
                        </div>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={() => setShowModal(false)} className="flex-1 md:flex-none px-8 py-4 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl transition-all">Cancelar</button>
                        <button onClick={handleSave} className="flex-[2] md:flex-none px-16 py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-primary-700 shadow-2xl shadow-primary-500/40 transition-all active:scale-95 flex items-center justify-center gap-3">
                            <Save size={20}/> Registrar Artículo
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryModule;
