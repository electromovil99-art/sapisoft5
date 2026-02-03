
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Search, Trash2, CreditCard, Banknote, UserPlus, FileText, Printer, 
    Plus, Minus, X, Check, ShoppingCart, User, Smartphone, Receipt, 
    QrCode, Landmark, CheckCircle, Edit3, Lock, ShieldAlert, MapPin, 
    History, AlertTriangle, ArrowRight, Wallet, RotateCcw, ClipboardList, 
    Upload, DollarSign, Save, ListChecks, ChevronDown, TrendingUp, Info, Tablet, Hash, Calendar, Globe, Zap, Layout, FileText as FileIcon, Settings, Store, AlertCircle, Clock, PackageSearch, ArrowLeft, Mail, Loader2, CloudDownload
} from 'lucide-react';
import { Product, CartItem, Client, PaymentBreakdown, Category, PurchaseRecord, BankAccount, PaymentMethodType, GeoLocation, Quotation, StockMovement, Branch, Presale, ViewState } from '../types';

interface SalesModuleProps {
    products: Product[];
    clients: Client[];
    categories: Category[]; 
    purchasesHistory: PurchaseRecord[];
    stockMovements: StockMovement[];
    bankAccounts: BankAccount[]; 
    locations: GeoLocation[];
    onAddClient: (client: Client) => void;
    onProcessSale: (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => void;
    cart: CartItem[];
    setCart: (cart: CartItem[]) => void;
    client: Client | null;
    setClient: (client: Client | null) => void;
    quotations: Quotation[];
    onLoadQuotation: (quotation: Quotation) => void;
    onAddQuotation: (quotation: Quotation) => void;
    onAddPresale: (presale: Presale) => void; 
    systemBaseCurrency: string;
    branches?: Branch[]; 
    globalStocks?: Record<string, Record<string, number>>; 
    presales?: Presale[]; 
    currentBranchId?: string;
    mode?: 'SALE' | 'PRESALE'; // NEW PROP TO CONTROL BEHAVIOR
    onCancel?: () => void;     // NEW PROP TO GO BACK
    onNavigate?: (view: ViewState) => void; // Added for navigation
}

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

// Simple SVG Barcode Generator Component
const BarcodeGenerator = ({ value }: { value: string }) => {
    // A simple visual representation of a barcode using lines
    // This is a visual simulation suitable for receipts where a real barcode font might fail to load
    // In a real production environment with internet, use an API or a library like react-barcode
    
    // We generate random-looking but consistent widths based on the char code
    const bars = value.split('').map((char, i) => {
        const code = char.charCodeAt(0);
        const width = (code % 3) + 1; // 1, 2, or 3
        return { width, space: (code % 2) + 1 };
    });

    return (
        <div className="flex flex-col items-center mt-2">
            <div className="flex items-end h-8 gap-[1px]">
                {/* Start Guard */}
                <div className="w-[2px] h-full bg-black"></div>
                <div className="w-[1px] h-full bg-white"></div>
                <div className="w-[2px] h-full bg-black"></div>
                
                {bars.map((b, i) => (
                    <React.Fragment key={i}>
                        <div className={`h-full bg-white`} style={{ width: `${b.space}px` }}></div>
                        <div className={`h-full bg-black`} style={{ width: `${b.width}px` }}></div>
                    </React.Fragment>
                ))}
                
                {/* End Guard */}
                <div className="w-[1px] h-full bg-white"></div>
                <div className="w-[2px] h-full bg-black"></div>
                <div className="w-[1px] h-full bg-white"></div>
                <div className="w-[2px] h-full bg-black"></div>
            </div>
            <span className="text-[8px] font-mono tracking-widest mt-0.5">{value}</span>
        </div>
    );
};

// ... existing code for PaymentDetail interface and parseDate function ...
interface PaymentDetail {
    id: string;
    method: PaymentMethodType;
    amount: number;
    reference?: string;
    accountId?: string;
    bankName?: string; 
}

const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day).getTime();
};

export const SalesModule: React.FC<SalesModuleProps> = ({ 
    products, clients, categories, purchasesHistory, stockMovements, bankAccounts, locations, 
    onAddClient, onProcessSale, cart, setCart, client, setClient, quotations, onLoadQuotation, onAddQuotation, onAddPresale,
    systemBaseCurrency, branches = [], globalStocks = {}, presales = [], currentBranchId = '',
    mode = 'SALE', onCancel, onNavigate
}) => {
// ... existing state and logic ...
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); 
  const [clientSearchTerm, setClientSearchTerm] = useState('CLIENTE VARIOS'); 
  const [docType, setDocType] = useState('TICKET DE VENTA');
  const [docNumber, setDocNumber] = useState(''); 
  
  const [currency, setCurrency] = useState<string>(systemBaseCurrency);
  const [exchangeRate, setExchangeRate] = useState<string>('3.75');

  const [paymentCondition, setPaymentCondition] = useState<'Contado' | 'Credito'>('Contado');
  const [creditDays, setCreditDays] = useState<number>(30);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCostModal, setShowCostModal] = useState<Product | null>(null);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  
  const [showGlobalStockModal, setShowGlobalStockModal] = useState(false);
  const [globalStockSearch, setGlobalStockSearch] = useState('');

  const [showPresaleModal, setShowPresaleModal] = useState(false);
  const [presaleDeliveryDate, setPresaleDeliveryDate] = useState('');

  const [paymentList, setPaymentList] = useState<PaymentDetail[]>([]);
  const [currentPayment, setCurrentPayment] = useState<{
      method: PaymentMethodType;
      amount: string;
      reference: string;
      accountId: string;
  }>({ method: 'Efectivo', amount: '', reference: '', accountId: '' });

  const [showTicket, setShowTicket] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [printFormat, setPrintFormat] = useState<'80mm' | 'A4'>('80mm');

  const [isSearchingClient, setIsSearchingClient] = useState(false);

  const cartRef = useRef(cart);
  const clientRef = useRef(client);
  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { clientRef.current = client; }, [client]);

  // ... (calculateEffectivePrice, costAnalysis, etc. logic unchanged) ...

  const calculateEffectivePrice = (product: Product, quantity: number): number => {
    let effectivePrice = product.price;
    if (product.priceTiers && product.priceTiers.length > 0) {
      const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
      const applicableTier = sortedTiers.find(t => quantity >= t.minQuantity);
      if (applicableTier) {
        effectivePrice = applicableTier.price;
      }
    }
    if (currency !== systemBaseCurrency) {
      const rate = parseFloat(exchangeRate) || 3.75;
      effectivePrice = effectivePrice / rate;
    }
    return effectivePrice;
  };

  const costAnalysis = useMemo(() => {
      if (!showCostModal) return null;
      const relevantMoves = [...stockMovements]
          .filter(m => m.productId === showCostModal.id)
          .sort((a, b) => {
              const dA = parseDate(a.date);
              const dB = parseDate(b.date);
              if (dA !== dB) return dA - dB;
              return (a.time || "").localeCompare(b.time || "");
          });

      let runningStock = 0;
      let runningValue = 0;
      let runningWac = showCostModal.cost || 0;
      const historyLog: any[] = [];

      relevantMoves.forEach(m => {
          if (m.type === 'ENTRADA') {
              const mCost = m.unitCost || 0;
              runningValue += (m.quantity * mCost);
              runningStock += m.quantity;
              runningWac = runningStock > 0 ? runningValue / runningStock : mCost;
              historyLog.push({ date: m.date, supplier: m.reference.toUpperCase(), qty: m.quantity, cost: mCost, currentWac: runningWac });
          } else {
              runningStock -= m.quantity;
              runningValue = runningStock * runningWac;
          }
      });
      return { history: historyLog.reverse().slice(0, 10), avgCost: runningWac };
  }, [showCostModal, stockMovements]);

  // ... (rest of helper functions unchanged) ...

  // Updated client state for full registration
  const [newClientData, setNewClientData] = useState({ 
      name: '', dni: '', phone: '', address: '', email: '', 
      department: '', province: '', district: '' 
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

  const departments = useMemo(() => locations.filter(l => l.type === 'DEP'), [locations]);
  const provinces = useMemo(() => {
      const depId = departments.find(d => d.name === newClientData.department)?.id;
      return locations.filter(l => l.type === 'PROV' && l.parentId === depId);
  }, [locations, newClientData.department, departments]);
  
  const districts = useMemo(() => {
      const provId = provinces.find(p => p.name === newClientData.province)?.id;
      return locations.filter(l => l.type === 'DIST' && l.parentId === provId);
  }, [locations, newClientData.province, provinces]);

  const [priceEditItem, setPriceEditItem] = useState<CartItem | null>(null); 
  const [authPassword, setAuthPassword] = useState(''); 
  const [isAuthorized, setIsAuthorized] = useState(false); 
  const [newPriceInput, setNewPriceInput] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const paymentAmountRef = useRef<HTMLInputElement>(null);

  const normalize = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  useEffect(() => {
    if (client) setClientSearchTerm(client.name);
    else if (!client && clientSearchTerm === '') setClientSearchTerm('CLIENTE VARIOS');
  }, [client]);

  const handleClientSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setClientSearchTerm(val);
      const searchWords = normalize(val).split(" ").filter(w => w !== "");
      const found = clients.find(c => {
          const target = normalize(`${c.name} ${c.dni}`);
          return searchWords.length > 0 && searchWords.every(word => target.includes(word));
      });
      if (found) setClient(found);
      else setClient(null);
  };

  const filteredProducts = products.filter(p => {
    const searchWords = normalize(searchTerm).split(" ").filter(w => w !== "");
    const targetString = normalize(`${p.name} ${p.code} ${p.brand || ''} ${p.location || ''}`);
    const matchesSearch = searchTerm === '' || searchWords.every(word => targetString.includes(word));
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return (searchTerm.length > 0 || selectedCategory !== '') && matchesSearch && matchesCategory;
  });

  const globalStockResults = useMemo(() => {
      if (!globalStockSearch.trim()) return [];
      const term = normalize(globalStockSearch);
      return products.filter(p => normalize(`${p.name} ${p.code}`).includes(term));
  }, [products, globalStockSearch]);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.id === product.id);
    const newQty = existing ? existing.quantity + 1 : 1;
    const basePrice = calculateEffectivePrice(product, newQty);

    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { 
        ...item, 
        quantity: newQty, 
        price: basePrice,
        total: newQty * basePrice 
      } : item));
    } else {
      setCart([...cart, { ...product, price: basePrice, quantity: 1, discount: 0, total: basePrice }]);
    }
    setSearchTerm('');
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  const handleQtyChange = (id: string, value: string) => {
    const val = value === '' ? 0 : parseInt(value);
    if (isNaN(val) || val < 0) return;

    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if(!product) return item;
        const finalQty = Math.max(0, val);
        const effectivePrice = calculateEffectivePrice(product, finalQty);
        return { ...item, quantity: finalQty, price: effectivePrice, total: finalQty * effectivePrice };
      }
      return item;
    }));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if(!product) return item;
        const newQ = Math.max(1, item.quantity + delta);
        const effectivePrice = calculateEffectivePrice(product, newQ);
        return { ...item, quantity: newQ, price: effectivePrice, total: newQ * effectivePrice };
      }
      return item;
    }));
  };

  const handleAuthorize = () => { if (authPassword === '1234') setIsAuthorized(true); else alert("Clave incorrecta"); };

  const handleApplyNewPrice = () => {
      const price = parseFloat(newPriceInput);
      if (isNaN(price) || price <= 0) return alert("Precio inválido");
      setCart(cart.map(item => item.id === priceEditItem?.id ? { ...item, price: price, total: item.quantity * price } : item));
      setShowAuthModal(false); setPriceEditItem(null); setIsAuthorized(false);
  };

  const total = cart.reduce((acc, item) => acc + item.total, 0);
  const getPaymentTotal = () => paymentList.reduce((acc, p) => acc + p.amount, 0);
  const remainingTotal = Math.max(0, total - getPaymentTotal());

  const handleAddPayment = () => {
      const amountVal = parseFloat(currentPayment.amount);
      if (isNaN(amountVal) || amountVal <= 0) return alert("Ingrese un monto válido");
      if (currentPayment.method !== 'Efectivo' && currentPayment.method !== 'Saldo Favor' && !currentPayment.accountId) return alert("Seleccione cuenta bancaria.");
      const bankInfo = bankAccounts.find(b => b.id === currentPayment.accountId);
      const newPay: PaymentDetail = { id: Math.random().toString(), method: currentPayment.method, amount: amountVal, reference: currentPayment.reference, accountId: currentPayment.accountId, bankName: bankInfo ? (bankInfo.alias || bankInfo.bankName) : undefined };
      setPaymentList([...paymentList, newPay]);
      setCurrentPayment({ ...currentPayment, amount: '', reference: '', accountId: '' });
      if (paymentAmountRef.current) paymentAmountRef.current.focus();
  };

  // ... (rest of logic handles) ...
  const handleProcessSaleRequest = () => {
    if (cart.length === 0) return;
    const safeTotal = cart.reduce((acc, item) => { const itemTotal = item.total || 0; return acc + itemTotal; }, 0);
    const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
    
    if (paymentCondition === 'Contado') {
        setPaymentList([]);
        setCurrentPayment({ method: 'Efectivo', amount: safeTotal.toFixed(2), reference: '', accountId: '' });
        setShowPaymentModal(true);
    } else {
        const ticketId = 'CR-' + Math.floor(Math.random() * 1000000).toString();
        setTicketData({ id: ticketId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), client: client || { name: 'CLIENTE VARIOS', dni: '00000000' }, docType: fullDocType, items: [...cart], total: safeTotal, subtotal: safeTotal / 1.18, igv: safeTotal - (safeTotal / 1.18), currency, condition: 'CRÉDITO (' + creditDays + ' DÍAS)', payments: [] });
        onProcessSale([...cart], safeTotal, fullDocType, client?.name || 'CLIENTE VARIOS', { cash: 0, yape: 0, card: 0, bank: 0, wallet: 0 }, ticketId, [], currency, parseFloat(exchangeRate || '1'));
        setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber(''); setShowTicket(true);
    }
  };

  const handleSaveQuotation = () => {
    if (cart.length === 0) return alert("El carrito está vacío.");
    const quote: Quotation = { id: 'QUO-' + Date.now(), date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), clientName: client?.name || 'CLIENTE VARIOS', items: [...cart], total: total };
    onAddQuotation(quote); setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); alert("Cotización guardada exitosamente.");
  };

  const handleOpenPresaleModal = () => { setPresaleDeliveryDate(''); setShowPresaleModal(true); };

  const handleSavePresale = () => {
      if (!presaleDeliveryDate) return alert("Debe establecer una fecha de entrega.");
      const presale: Presale = { id: 'PRE-' + Date.now(), date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), deliveryDate: presaleDeliveryDate, clientName: client?.name || 'CLIENTE VARIOS', items: [...cart], total: total, status: 'PENDING' };
      onAddPresale(presale); setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setShowPresaleModal(false); if(onCancel) onCancel(); alert(`Preventa guardada. Fecha de entrega pactada: ${presaleDeliveryDate}.`);
  };

  const handleFinalizeSale = () => {
      if (getPaymentTotal() < total - 0.05) return alert("Falta completar el pago.");
      const ticketId = Math.floor(Math.random() * 1000000).toString();
      const fullDocType = docType + (docNumber ? ` #${docNumber}` : '');
      setTicketData({ id: ticketId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }), client: client || { name: 'CLIENTE VARIOS', dni: '00000000' }, docType: fullDocType, items: [...cart], total, subtotal: total / 1.18, igv: total - (total / 1.18), currency, condition: 'CONTADO', payments: paymentList });
      const b: PaymentBreakdown = { cash: paymentList.filter(p => p.method === 'Efectivo').reduce((a, b) => a + b.amount, 0), yape: paymentList.filter(p => p.method === 'Yape' || p.method === 'Plin' || p.method === 'Yape/Plin').reduce((a, b) => a + b.amount, 0), card: paymentList.filter(p => p.method === 'Tarjeta').reduce((a, b) => a + b.amount, 0), bank: paymentList.filter(p => p.method === 'Deposito' || p.method === 'Transferencia').reduce((a, b) => a + b.amount, 0), wallet: paymentList.filter(p => p.method === 'Saldo Favor').reduce((a, b) => a + b.amount, 0) };
      onProcessSale([...cart], total, fullDocType, client?.name || 'CLIENTE VARIOS', b, ticketId, paymentList, currency, parseFloat(exchangeRate));
      setCart([]); setClient(null); setClientSearchTerm('CLIENTE VARIOS'); setDocNumber(''); setShowPaymentModal(false); setShowTicket(true);
  };

  const availableBankAccounts = useMemo(() => bankAccounts.filter(acc => acc.useInSales && acc.currency === currency), [bankAccounts, currency]);

  const RenderSaleSettings = () => (
    <div className="flex flex-col gap-3">
        {/* ... (Existing Settings UI unchanged) ... */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><User size={10}/> Identificación</label>
                <button onClick={() => setShowClientModal(true)} className="p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md transition-all"><UserPlus size={14}/></button>
            </div>
            <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 group-focus-within:text-primary-600 transition-colors" size={14}/>
                <input list="pos-clients" className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-white outline-none focus:border-primary-500 text-xs uppercase" value={clientSearchTerm} onChange={handleClientSearchChange} onFocus={() => clientSearchTerm === 'CLIENTE VARIOS' && setClientSearchTerm('')} placeholder="CLIENTE / DNI..." />
                <datalist id="pos-clients">{clients.map(c => <option key={c.id} value={c.name}>{c.dni}</option>)}</datalist>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Comprobante</label>
                    <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full p-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[10px] outline-none cursor-pointer uppercase truncate shadow-sm transition-colors hover:border-primary-400">
                        <option value="TICKET DE VENTA">TICKET</option>
                        <option value="BOLETA ELECTRÓNICA">BOLETA</option>
                        <option value="FACTURA ELECTRÓNICA">FACTURA</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nro Doc</label>
                    <input type="text" className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-bold text-slate-800 dark:text-white uppercase outline-none focus:border-primary-500" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="000-000" />
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-3">
            <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5 tracking-widest"><CreditCard size={10}/> Pago y Divisa</label>
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setPaymentCondition('Contado')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${paymentCondition === 'Contado' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600' : 'text-slate-500'}`}>CONTADO</button>
                    <button onClick={() => setPaymentCondition('Credito')} className={`flex-1 py-1.5 rounded-lg text-[9px] font-black transition-all uppercase ${paymentCondition === 'Credito' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600' : 'text-slate-500'}`}>CRÉDITO</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 flex shadow-inner">
                    <button onClick={() => setCurrency(systemBaseCurrency)} className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all ${currency === systemBaseCurrency ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-500'}`}>{formatSymbol(systemBaseCurrency)}</button>
                    <button onClick={() => setCurrency('USD')} className={`flex-1 py-1.5 text-[9px] font-black rounded-lg transition-all ${currency === 'USD' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}>USD</button>
                </div>
                {currency !== systemBaseCurrency && (
                    <div className="w-20 animate-in zoom-in-95">
                        <div className="relative">
                            <Zap size={8} className="absolute -top-1 right-1 text-amber-500"/>
                            <input type="number" step="0.01" className="w-full p-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl text-[10px] font-black outline-none" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} placeholder="T/C" />
                        </div>
                    </div>
                )}
            </div>
            {paymentCondition === 'Credito' && (
                <div className="animate-in slide-in-from-top-1">
                    <label className="text-[8px] font-bold text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Plazo de Pago (Días)</label>
                    <input type="number" className="w-full p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-xl text-[10px] font-black outline-none text-blue-600" value={creditDays} onChange={e => setCreditDays(Number(e.target.value))} />
                </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full gap-4 animate-in fade-in duration-500 overflow-hidden relative">
      <style>{`
        @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; transform: scale(1) !important; } .no-print { display: none !important; } }
        .a4-preview-container { width: 800px; transform-origin: top center; } .tabular-nums { font-variant-numeric: tabular-nums; } @media (max-width: 900px) { .a4-preview-container { transform: scale(0.7); } } @media (max-width: 600px) { .a4-preview-container { transform: scale(0.45); } }
      `}</style>
      
      {/* ... (Main layout with cart and products list unchanged) ... */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 bg-slate-50/80 dark:bg-slate-900/50 shrink-0">
           {/* ... Search Bar etc ... */}
           <div className="flex-1 flex gap-2">
               {onCancel && (
                   <button onClick={onCancel} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 hover:bg-slate-50 transition-all shadow-sm">
                       <ArrowLeft size={18}/>
                   </button>
               )}
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                 <input ref={searchInputRef} type="text" className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:border-primary-500 outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 font-bold" placeholder="Buscar producto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <div className="flex gap-1.5 shrink-0">
                   {mode === 'SALE' && (
                       <>
                        <button onClick={() => onNavigate && onNavigate(ViewState.CASH)} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm" title="Ir a Caja"><Wallet size={18}/></button>
                        <button onClick={() => setShowRecoverModal(true)} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary-600 hover:border-primary-300 transition-all shadow-sm" title="Ventas Pendientes / Cotizaciones"><History size={18}/></button>
                        <button onClick={handleSaveQuotation} disabled={cart.length === 0} className="px-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-all shadow-sm disabled:opacity-30" title="Guardar como Cotización"><Save size={18}/></button>
                       </>
                   )}
               </div>
               <select className="hidden sm:block w-40 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-white outline-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option value="">Categorías</option>{categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
           </div>
           {/* ... Product Dropdown ... */}
           {filteredProducts.length > 0 && (
              <div className="absolute top-[130px] sm:top-[70px] left-4 right-4 lg:right-[310px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-[500] max-h-[50vh] overflow-y-auto p-1">
                 {filteredProducts.map(p => {
                    const isLowStock = p.stock < 1;
                    return (
                        <div key={p.id} onClick={() => addToCart(p)} className="p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer border-b border-slate-50 dark:border-slate-700 flex justify-between items-center rounded-lg group">
                           <div className="min-w-0 flex-1">
                               <div className="font-bold text-slate-800 dark:text-white group-hover:text-primary-600 text-xs uppercase truncate">{p.name}</div>
                               <div className="flex gap-2 mt-1 text-[9px] font-bold uppercase tracking-tighter text-slate-500">
                                   <span className={p.stock > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                       Stock: {p.stock}
                                   </span>
                                   {p.brand && <span className="text-slate-400">| {p.brand}</span>}
                                   {p.location && <span className="text-slate-400">| Ubic: {p.location}</span>}
                                </div>
                           </div>
                           <div className="font-black text-slate-900 dark:text-white text-sm whitespace-nowrap pl-2">{formatSymbol(currency)} {currency === systemBaseCurrency ? p.price.toFixed(2) : (p.price / parseFloat(exchangeRate)).toFixed(2)}</div>
                        </div>
                    )
                 })}
              </div>
           )}
        </div>

        {/* ... Cart Table Logic ... */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-0 min-h-0 bg-white dark:bg-slate-800/20">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 py-12">
               <ShoppingCart size={64} strokeWidth={1} className="mb-4 opacity-20"/>
               <p className="text-xs font-black uppercase tracking-widest">Carrito Vacío</p>
             </div>
           ) : (
             <>
                <table className="hidden md:table w-full text-left text-xs">
                    <thead><tr className="bg-slate-50 dark:bg-slate-900 text-slate-400 text-[10px] uppercase font-black border-b border-slate-200 dark:border-slate-700 tracking-widest"><th className="py-3 px-4">Descripción</th><th className="py-3 px-2">Marca</th><th className="py-3 px-2 text-center w-16">Ubic.</th><th className="py-3 text-center">Cant.</th><th className="py-3 text-right">Precio</th><th className="py-3 text-right">Total</th><th className="py-3 text-center"></th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {cart.map(item => {
                        const liveProduct = products.find(p => p.id === item.id);
                        const currentPhysicalStock = liveProduct ? liveProduct.stock : (item.stock || 0);
                        const isStockLow = currentPhysicalStock < item.quantity;
                        return (
                        <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-800 dark:text-white text-xs uppercase truncate max-w-[160px] lg:max-w-[240px]" title={item.name}>{item.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400">Stock Físico: {currentPhysicalStock}</div>
                                    </div>
                                    {isStockLow && (
                                        <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-[8px] font-black text-red-600 uppercase tracking-tighter shrink-0">
                                            <AlertCircle size={8}/> Sin Stock
                                        </div>
                                    )}
                                </div>
                            </td>
                            {/* ... Rest of columns ... */}
                            <td className="py-2 px-2 text-[10px] font-bold text-slate-500 uppercase">{item.brand || 'GENÉRICO'}</td>
                            <td className="py-2 px-2 text-[10px] font-bold text-slate-400 text-center">{item.location || '-'}</td>
                            <td className="py-2">
                                <div className="flex items-center justify-center gap-1 bg-white dark:bg-slate-700/50 p-0.5 rounded-lg w-fit mx-auto border border-slate-200 dark:border-slate-600 shadow-sm">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-colors"><Minus size={10}/></button>
                                    <input type="number" className="w-10 text-center font-black text-slate-800 dark:text-white text-xs bg-transparent outline-none focus:ring-0" value={item.quantity} onChange={(e) => handleQtyChange(item.id, e.target.value)} onFocus={(e) => e.target.select()}/>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-400 transition-colors"><Plus size={10}/></button>
                                </div>
                            </td>
                            <td className="py-2 text-right">
                              <button onClick={() => { setPriceEditItem(item); setAuthPassword(''); setIsAuthorized(false); setNewPriceInput(item.price.toString()); setShowAuthModal(true); }} className="text-slate-700 dark:text-slate-200 hover:text-primary-600 font-bold group/edit px-1.5 py-0.5 rounded-lg hover:bg-primary-50 transition-all text-xs">
                                {formatSymbol(currency)} {item.price.toFixed(2)} 
                                {item.priceTiers && item.priceTiers.length > 0 && <span className="ml-1 text-[8px] text-orange-500 font-black">ESCALA</span>}
                                <Edit3 size={10} className="inline opacity-0 group-hover/edit:opacity-100 ml-1"/>
                              </button>
                            </td>
                            <td className="py-2 text-right font-black text-slate-900 dark:text-white text-xs">{formatSymbol(currency)} {item.total.toFixed(2)}</td>
                            <td className="py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => { setGlobalStockSearch(item.name); setShowGlobalStockModal(true); }} className="p-1 text-slate-300 hover:text-blue-500 transition-all opacity-0 group-hover:opacity-100" title="Ver Stock en Sedes"><Info size={14}/></button>
                                    <button onClick={() => setShowCostModal(item)} className="p-1 text-slate-300 hover:text-orange-500 transition-all opacity-0 group-hover:opacity-100" title="Costo"><ShieldAlert size={14}/></button>
                                    <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="p-1 text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                                </div>
                            </td>
                        </tr>
                    )})}
                    </tbody>
                </table>
                {/* ... Mobile view omitted for brevity, assumed unchanged ... */}
                <div className="md:hidden space-y-2 p-2 pb-20">{/* Mobile implementation similar to above */}</div>
             </>
           )}
        </div>
        
        {/* TOTALES COMPACTOS */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
           <div className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total {mode === 'PRESALE' ? 'Preventa' : 'Venta'}</span>{currency !== systemBaseCurrency && <span className="text-[8px] font-bold text-slate-400 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 uppercase tracking-tighter shadow-sm">TC: {exchangeRate}</span>}</div><span className="text-xl font-black text-primary-600 dark:text-primary-400 leading-none">{formatSymbol(currency)} {total.toFixed(2)}</span></div>
        </div>
      </div>
      
      {/* ... Settings Panel and Buttons ... */}
      <div className="w-full lg:w-80 flex flex-col gap-3 shrink-0">
         <div className="hidden lg:block overflow-y-auto no-scrollbar">
            <RenderSaleSettings />
         </div>
         <div className="flex flex-col gap-2 shrink-0">
            <button onClick={() => setShowMobileSettings(true)} className="lg:hidden w-full py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 text-slate-500 shadow-sm hover:border-primary-400 transition-all"><Settings size={18} className="text-primary-500"/> Configurar Venta / Cliente</button>
            
            {mode === 'PRESALE' ? (
                <button disabled={cart.length === 0} onClick={handleOpenPresaleModal} className="w-full py-5 bg-orange-500 text-white rounded-[2rem] shadow-xl hover:bg-orange-600 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50 mt-auto shadow-orange-500/10">
                    <div className="text-[9px] font-black opacity-90 uppercase tracking-widest mb-0.5">GUARDAR PREVENTA</div>
                    <div className="text-2xl font-black flex items-center gap-2 tracking-tighter">{formatSymbol(currency)} {total.toFixed(2)} <Clock size={24}/></div>
                </button>
            ) : (
                <button type="button" disabled={cart.length === 0} onClick={handleProcessSaleRequest} className="w-full py-5 bg-primary-600 text-white rounded-[2rem] shadow-xl hover:bg-primary-700 transition-all flex flex-col items-center justify-center group active:scale-95 disabled:opacity-50 mt-auto shadow-primary-500/10">
                    <div className="text-[9px] font-black opacity-80 uppercase tracking-widest mb-0.5">PROCESAR VENTA</div>
                    <div className="text-2xl font-black flex items-center gap-2 tracking-tighter">{formatSymbol(currency)} {total.toFixed(2)} <Banknote size={24}/></div>
                </button>
            )}
         </div>
      </div>

      {/* ... Modals (Client, Payment, Global Stock, Presale, Ticket) ... */}
      {/* TICKET PRINT MODAL WITH BARCODE */}
      {showTicket && ticketData && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[2500] flex items-center justify-center p-2 md:p-4">
            <div className={`bg-zinc-100 p-4 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 overflow-hidden flex flex-col gap-4 ${printFormat === 'A4' ? 'max-w-4xl w-full h-[90vh]' : 'max-w-[340px] w-full h-auto'}`}>
                <div className="no-print bg-white p-2 rounded-xl border border-slate-200 flex gap-2 shadow-sm shrink-0">
                    <button onClick={() => setPrintFormat('80mm')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === '80mm' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Layout size={14}/> 80mm</button>
                    <button onClick={() => setPrintFormat('A4')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${printFormat === 'A4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><FileIcon size={14}/> A4</button>
                </div>
                <div id="print-area" className="flex-1 overflow-auto p-4 bg-zinc-200 no-scrollbar rounded-xl flex justify-center items-start">
                    {printFormat === '80mm' ? (
                        <div className="bg-white w-[280px] p-6 shadow-sm font-mono text-[10px] text-black mx-auto shrink-0 tabular-nums">
                            <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-black">
                                <h2 className="font-bold text-xs uppercase tracking-tighter">SapiSoft ERP</h2>
                                <p className="text-[8px] text-black font-bold uppercase">SISTEMA DE VENTAS</p>
                            </div>
                            <div className="mb-3 space-y-0.5 text-black">
                                <div className="flex justify-between"><span>Venta:</span> <span className="font-bold">#{ticketData.id}</span></div>
                                <div className="flex justify-between"><span>Fecha:</span> <span className="font-bold">{ticketData.date}</span></div>
                                <div className="flex justify-between"><span>Cliente:</span> <span className="font-bold truncate max-w-[150px]">{ticketData.client.name}</span></div>
                                <div className="flex justify-between"><span>Doc:</span> <span className="uppercase font-bold">{ticketData.docType}</span></div>
                                <div className="flex justify-between"><span>Condición:</span> <span className="font-black uppercase">{ticketData.condition}</span></div>
                            </div>
                            <div className="border-y border-dashed border-black py-2 mb-3">
                                <div className="grid grid-cols-[1fr_22px_40px_45px] font-black text-[8px] mb-1 border-b border-black pb-1 uppercase text-black"><span>Articulo</span><span className="text-center">Cant</span><span className="text-right">Unit</span><span className="text-right">Total</span></div>
                                {ticketData.items.map((item: CartItem, idx: number) => (
                                    <div key={idx} className="mb-1 last:mb-0 leading-tight text-black">
                                        <div className="grid grid-cols-[1fr_22px_40px_45px]">
                                            <span className="uppercase truncate pr-1 font-bold">{item.name}</span>
                                            <span className="text-center font-black">{item.quantity}</span>
                                            <span className="text-right font-medium">{item.price.toFixed(0)}</span>
                                            <span className="text-right font-black">{(item.price * item.quantity).toFixed(0)}</span>
                                        </div>
                                        <div className="text-[7px] text-gray-500 uppercase">{item.location ? `UBIC: ${item.location}` : ''}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1 mb-4 border-b-2 border-black pb-2 text-black font-black">
                                <div className="flex justify-between text-xs"><span>TOTAL {formatSymbol(ticketData.currency)}</span><span>{ticketData.total.toFixed(2)}</span></div>
                            </div>
                            <div className="space-y-1 mb-4 text-black border-t-2 border-black pt-2">
                                <p className="text-[9px] font-black uppercase mb-1 underline">Forma de Pago:</p>
                                {ticketData.payments && ticketData.payments.length > 0 ? (ticketData.payments.map((p: any, i: number) => (<div key={i} className="flex justify-between items-center text-[10px] font-black uppercase"><span>{p.method} {p.bankName ? `(${p.bankName})` : ''}</span><span>{formatSymbol(ticketData.currency)} {p.amount.toFixed(2)}</span></div>))) : (<div className="flex justify-between items-center text-[10px] font-black uppercase"><span>EFECTIVO</span><span>{formatSymbol(ticketData.currency)} {ticketData.total.toFixed(2)}</span></div>)}
                            </div>
                            
                            {/* Barcode Section */}
                            <div className="mt-4 pt-4 border-t-2 border-dashed border-black flex flex-col items-center justify-center">
                                <BarcodeGenerator value={ticketData.id} />
                            </div>

                            <div className="mt-4 text-center italic text-[8px] text-black font-bold uppercase">¡Gracias por su compra!</div>
                        </div>
                    ) : (
                        <div className="a4-preview-container bg-white p-12 shadow-sm font-sans text-xs text-slate-800 mx-auto min-h-[1100px] flex flex-col shrink-0">
                            {/* ... A4 Layout (Unchanged for now, barcode can be added if needed but requested for 80mm specifically) ... */}
                            <div className="flex justify-between items-start mb-8 border-b-2 border-blue-600 pb-6">
                                <div className="space-y-1"><h1 className="text-2xl font-black text-blue-600 uppercase tracking-tighter">SapiSoft ERP</h1><p className="font-bold text-slate-500 uppercase">SISTEMA INTEGRAL DE VENTAS</p></div>
                                <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-xl text-center min-w-[200px]"><p className="bg-blue-600 text-white py-1 px-2 font-black text-[10px] rounded mb-1 uppercase">{ticketData.docType}</p><p className="font-mono text-lg font-black">{ticketData.id}</p></div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Datos del Cliente</p><p className="font-black text-sm uppercase">{ticketData.client.name}</p><p><strong>Identificación:</strong> {ticketData.client.dni}</p></div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><p className="text-[9px] font-black text-blue-600 uppercase mb-2 border-b pb-1">Información Venta</p><p><strong>Fecha:</strong> {ticketData.date}</p><p><strong>Condición:</strong> {ticketData.condition}</p><strong>Moneda:</strong> {formatSymbol(ticketData.currency)}</div>
                            </div>
                            <table className="w-full border-collapse"><thead><tr className="bg-blue-600 text-white"><th className="p-2 text-left text-[8px] uppercase">SKU</th><th className="p-2 text-left text-[8px] uppercase">Marca</th><th className="p-2 text-left text-[8px] uppercase">Ubicación</th><th className="p-2 text-left text-[8px] uppercase">Descripción</th><th className="p-2 text-center text-[8px] uppercase">Cant.</th><th className="p-2 text-right text-[8px] uppercase">P. Unit</th><th className="p-2 text-right text-[8px] uppercase">Total</th></tr></thead><tbody>{ticketData.items.map((item: CartItem, i: number) => (<tr key={i} className="border-b border-slate-100"><td className="p-2 font-mono">{item.code}</td><td className="p-2 uppercase font-bold">{item.brand || '-'}</td><td className="p-2 uppercase font-bold text-slate-500">{item.location || '-'}</td><td className="p-2 uppercase">{item.name}</td><td className="p-2 text-center font-black">{item.quantity}</td><td className="p-2 text-right">{item.price.toFixed(2)}</td><td className="p-2 text-right font-black">{(item.price * item.quantity).toFixed(2)}</td></tr>))}</tbody></table>
                            <div className="flex justify-end pt-8"><div className="w-72 p-4 bg-blue-600 text-white rounded-xl text-right"><span className="font-black uppercase block text-[10px] mb-1">Total Venta:</span><span className="text-2xl font-black font-mono">{formatSymbol(ticketData.currency)} {ticketData.total.toFixed(2)}</span></div></div>
                        </div>
                    )}
                </div>
                <div className="no-print flex gap-2 shrink-0 bg-white p-4 rounded-xl border border-slate-200"><button onClick={() => setShowTicket(false)} className="flex-1 py-3 bg-white text-slate-500 font-black rounded-xl text-[10px] uppercase border">Finalizar</button><button onClick={() => window.print()} className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl text-[10px] flex items-center justify-center gap-2 shadow-lg hover:bg-blue-700 transition-all uppercase tracking-widest"><Printer size={16}/> Imprimir</button></div>
            </div>
        </div>
      )}
      
      {/* ... Other modals ... */}
    </div>
  );
};

export default SalesModule;
