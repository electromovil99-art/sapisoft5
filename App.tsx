
// ... existing imports ...
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ViewState, Product, Client, Supplier, Category, Brand, SaleRecord, 
  PurchaseRecord, StockMovement, CashMovement, ServiceOrder, 
  SystemUser, AuthSession, Tenant, BankAccount, GeoLocation, 
  Quotation, Presale, Branch, WarehouseTransfer, CashTransferRequest, 
  CashBoxSession, VideoTutorial, CartItem, PaymentBreakdown, InventoryHistorySession,
  CrmContact,
  MasterMovement
} from './types';
import { 
  TECH_PRODUCTS, PHARMA_PRODUCTS, MOCK_CLIENTS, MOCK_SERVICES, 
  MOCK_CASH_MOVEMENTS, MOCK_LOCATIONS, TECH_CATEGORIES 
} from './constants';
import { INITIAL_NAV_STRUCTURE } from './navigation';

// Components
import Layout from './components/Layout';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import SalesModule from './components/SalesModule';
import InventoryModule from './components/InventoryModule';
import PurchaseModule from './components/PurchaseModule';
import ServicesModule from './components/ServicesModule';
import CashModule from './components/CashModule';
import ClientsModule from './components/ClientsModule';
import SuppliersModule from './components/SuppliersModule';
import ResourceManagement from './components/ResourceManagement';
import SalesReportModule from './components/SalesReportModule';
import ProfitReportModule from './components/ProfitReportModule';
import InventoryAuditModule from './components/InventoryAuditModule';
import BusinessEvolutionModule from './components/BusinessEvolutionModule';
import FinancialStrategyModule from './components/FinancialStrategyModule';
import HistoryQueries from './components/HistoryQueries';
import LocationsModule from './components/LocationsModule';
import UserPrivilegesModule from './components/UserPrivilegesModule';
import CreditNoteModule from './components/CreditNoteModule';
import ClientWalletModule from './components/ClientWalletModule';
import WhatsAppModule from './components/WhatsAppModule';
import QuotationModule from './components/QuotationModule';
import PresaleModule from './components/PresaleModule';
import DatabaseModule from './components/DatabaseModule';
import PrintConfigModule from './components/PrintConfigModule';
import MediaEditorModule from './components/MediaEditorModule';
import SuperAdminModule from './components/SuperAdminModule';
import CashBoxHistoryModule from './components/CashBoxHistoryModule';
import BankAccountsModule from './components/BankAccountsModule';
import BankHistoryModule from './components/BankHistoryModule';
import CompanyProfileModule from './components/CompanyProfileModule';
import SystemDiagnosticsModule from './components/SystemDiagnosticsModule';
import GatewayConfigModule from './components/GatewayConfigModule';
import BranchManagementModule from './components/BranchManagementModule';
import WarehouseTransferModule from './components/WarehouseTransferModule';
import CashTransferModule from './components/CashTransferModule';
import InventoryAdjustmentModule from './components/InventoryAdjustmentModule';
import CrmModule from './components/CrmModule'; 
import AccountsReceivableModule from './components/AccountsReceivableModule'; 
import AccountsPayableModule from './components/AccountsPayableModule'; 

const App = () => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);

  // --- DATA STATE ---
  const [products, setProducts] = useState<Product[]>([...TECH_PRODUCTS, ...PHARMA_PRODUCTS]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: '1', name: 'TECNOLOGIA GLOBAL SAC', ruc: '20100000001', phone: '999888777', digitalBalance: 0 }
  ]);
  const [categories, setCategories] = useState<Category[]>(TECH_CATEGORIES);
  const [brands, setBrands] = useState<Brand[]>([{ id: '1', name: 'SAMSUNG' }, { id: '2', name: 'APPLE' }]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(MOCK_CASH_MOVEMENTS);
  const [services, setServices] = useState<ServiceOrder[]>(MOCK_SERVICES);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [presales, setPresales] = useState<Presale[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    { id: '1', bankName: 'BCP', accountNumber: '193-0000000-0-01', currency: 'PEN', alias: 'Cuenta Principal', useInSales: true, useInPurchases: true }
  ]);
  const [locations, setLocations] = useState<GeoLocation[]>(MOCK_LOCATIONS);
  
  const [users, setUsers] = useState<SystemUser[]>([
    { id: '1', username: 'ADMIN', password: '123', fullName: 'Administrador Principal', role: 'ADMIN', active: true, permissions: ['ALL'], companyName: 'SapiSoft Demo', industry: 'TECH' },
    { id: '2', username: 'SUPER', password: '123', fullName: 'Super Admin', role: 'SUPER_ADMIN', active: true, permissions: ['ALL'], companyName: 'SapiSoft Corp', industry: 'TECH' }
  ]);
  
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: '1', companyName: 'SapiSoft Demo', industry: 'TECH', status: 'ACTIVE', subscriptionEnd: '31/12/2030', ownerName: 'Admin Demo', phone: '900000000', planType: 'FULL', baseCurrency: 'PEN' }
  ]);
  const [branches, setBranches] = useState<Branch[]>([
    { id: 'BR-001', name: 'SEDE PRINCIPAL', address: 'AV. CENTRAL 123', isMain: true }
  ]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('BR-001');
  const [warehouseTransfers, setWarehouseTransfers] = useState<WarehouseTransfer[]>([]);
  const [cashTransferRequests, setCashTransferRequests] = useState<CashTransferRequest[]>([]);
  const [cashBoxSessions, setCashBoxSessions] = useState<CashBoxSession[]>([]);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistorySession[]>([]);
  
  // --- CRM STATE ---
  const [crmDb, setCrmDb] = useState<Record<string, CrmContact>>(() => {
      // Initialize CRM with mock clients
      const db: Record<string, CrmContact> = {};
      MOCK_CLIENTS.forEach(c => {
          if (c.phone) {
              const phone = c.phone.replace(/\D/g, '');
              if(phone) {
                  db[phone] = {
                      phone: phone,
                      name: c.name,
                      stage: 'Nuevo',
                      labels: c.tags || [],
                      notes: [],
                      lastInteraction: c.lastPurchaseDate,
                      email: c.email,
                      address: c.address
                  };
              }
          }
      });
      return db;
  });
  
  const [crmStages, setCrmStages] = useState<any[]>([
      { id: 'Nuevo', name: 'Nuevo', color: 'border-slate-400' },
      { id: 'Interesado', name: 'Interesado', color: 'border-blue-500' },
      { id: 'Seguimiento', name: 'Seguimiento', color: 'border-amber-500' },
      { id: 'Venta', name: 'Venta', color: 'border-emerald-500' },
      { id: 'Perdido', name: 'Perdido', color: 'border-red-500' }
  ]);
  
  // --- UI STATE FOR MODULES ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [posClient, setPosClient] = useState<Client | null>(null);
  
  const [chats, setChats] = useState<any[]>(() => {
      return MOCK_CLIENTS.filter(c => c.phone).map(c => ({
          id: { _serialized: `${c.phone}@c.us`, user: c.phone?.replace(/\D/g, '') },
          name: c.name,
          unreadCount: 0,
          timestamp: Math.floor(Date.now() / 1000),
          lastMessage: { body: 'Hola, quisiera consultar sobre un producto...' },
          fromMe: false
      }));
  });

  const [currentCashSession, setCurrentCashSession] = useState<CashBoxSession | undefined>(undefined);
  const [companyName, setCompanyName] = useState('Mi Empresa S.A.C.');
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [baseCurrency, setBaseCurrency] = useState('PEN');
  const [navStructure, setNavStructure] = useState(INITIAL_NAV_STRUCTURE);
  
  const [pendingClientData, setPendingClientData] = useState<{name: string, phone: string} | null>(null);

  const [fixedExpenses, setFixedExpenses] = useState<string[]>(['Alquiler', 'Luz', 'Agua', 'Internet', 'Planilla']);
  const [fixedIncomes, setFixedIncomes] = useState<string[]>(['Alquiler Subarriendo', 'Regalias']);

  // --- ACTIONS ---

  const handleLogin = (user: SystemUser) => {
    const tenant = tenants.find(t => t.companyName === user.companyName);
    setSession({
      user,
      businessName: user.companyName,
      token: 'mock-token',
      baseCurrency: tenant?.baseCurrency || 'PEN'
    });
    setCompanyName(user.companyName);
    setBaseCurrency(tenant?.baseCurrency || 'PEN');
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleRegisterFromCRM = (name: string, phone: string) => {
      setPendingClientData({ name, phone });
      setCurrentView(ViewState.CLIENTS);
  };

  const handleAddClient = (c: Client) => {
      setClients([...clients, c]);
      if (c.phone) {
          const cleanPhone = c.phone.replace(/\D/g, '');
          setCrmDb(prev => ({
              ...prev,
              [cleanPhone]: {
                  ...(prev[cleanPhone] || {}),
                  name: c.name,
                  phone: cleanPhone,
                  stage: prev[cleanPhone]?.stage || 'Nuevo',
                  labels: [...(prev[cleanPhone]?.labels || []), 'Cliente'],
                  notes: prev[cleanPhone]?.notes || []
              }
          }));
      }
  };

  const handleAddProduct = (p: Product) => setProducts([...products, p]);
  const handleUpdateProduct = (p: Product) => setProducts(products.map(pr => pr.id === p.id ? p : pr));
  const handleDeleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  const handleAddProducts = (newProds: Product[]) => setProducts([...products, ...newProds]);

  const handleProcessSale = (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => {
      const sale: SaleRecord = {
          id: ticketId,
          branchId: currentBranchId,
          date: new Date().toLocaleDateString('es-PE'),
          time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          clientName,
          docType,
          total,
          currency,
          exchangeRate,
          items: cart,
          paymentBreakdown,
          detailedPayments,
          user: session?.user.fullName || 'Admin'
      };
      setSales([sale, ...sales]);

      // Update Client Credit if applicable
      if (sale.paymentBreakdown.cash === 0 && sale.paymentBreakdown.card === 0 && sale.paymentBreakdown.yape === 0 && sale.paymentBreakdown.bank === 0) {
          // It's full credit or wallet
          const client = clients.find(c => c.name === clientName);
          if (client) {
              const newUsed = (client.creditUsed || 0) + total;
              setClients(clients.map(c => c.id === client.id ? { ...c, creditUsed: newUsed } : c));
          }
      }

      // Stock reduction
      const newStockMoves: StockMovement[] = cart.map(item => {
          const product = products.find(p => p.id === item.id);
          const newStock = (product?.stock || 0) - item.quantity;
          if (product) {
              handleUpdateProduct({ ...product, stock: newStock });
          }
          return {
              id: 'MOV-' + Date.now() + Math.random(),
              branchId: currentBranchId,
              date: sale.date,
              time: sale.time,
              productId: item.id,
              productName: item.name,
              type: 'SALIDA',
              quantity: item.quantity,
              currentStock: newStock,
              reference: `${docType} #${ticketId}`,
              user: session?.user.fullName || 'Admin'
          };
      });
      setStockMovements([...newStockMoves, ...stockMovements]);

      // Cash Movement
      if (paymentBreakdown.cash > 0) {
          const m: CashMovement = {
              id: 'M-' + Date.now(),
              branchId: currentBranchId,
              date: sale.date,
              time: sale.time,
              type: 'Ingreso',
              paymentMethod: 'Efectivo',
              concept: `VENTA ${docType} #${ticketId}`,
              amount: paymentBreakdown.cash,
              user: session?.user.fullName || 'Admin',
              category: 'VENTA',
              financialType: 'Variable',
              currency: sale.currency
          };
          setCashMovements([m, ...cashMovements]);
      }
  };

  const handleProcessPurchase = (cart: CartItem[], total: number, docType: string, supplierName: string, paymentCondition: 'Contado' | 'Credito', creditDays: number, detailedPayments: any[], currency?: string, exchangeRate?: number) => {
      const purchase: PurchaseRecord = {
          id: 'PUR-' + Date.now(),
          branchId: currentBranchId,
          date: new Date().toLocaleDateString('es-PE'),
          time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          supplierName,
          docType,
          total,
          currency: currency || baseCurrency,
          exchangeRate: exchangeRate || 1,
          items: cart,
          paymentCondition,
          detailedPayments,
          user: session?.user.fullName || 'Admin'
      };
      setPurchases([purchase, ...purchases]);

      const newStockMoves: StockMovement[] = cart.map(item => {
          const product = products.find(p => p.id === item.id);
          const newStock = (product?.stock || 0) + item.quantity;
          if (product) {
              handleUpdateProduct({ ...product, stock: newStock, cost: item.price });
          }
          return {
              id: 'MOV-' + Date.now() + Math.random(),
              branchId: currentBranchId,
              date: purchase.date,
              time: purchase.time,
              productId: item.id,
              productName: item.name,
              type: 'ENTRADA',
              quantity: item.quantity,
              currentStock: newStock,
              reference: `COMPRA ${docType}`,
              user: session?.user.fullName || 'Admin',
              unitCost: item.price
          };
      });
      setStockMovements([...newStockMoves, ...stockMovements]);

      if (paymentCondition === 'Contado' && detailedPayments) {
          detailedPayments.forEach((p: any) => {
              if (p.method === 'Efectivo') {
                  setCashMovements([
                      {
                          id: 'M-' + Date.now() + Math.random(),
                          branchId: currentBranchId,
                          date: purchase.date,
                          time: purchase.time,
                          type: 'Egreso',
                          paymentMethod: 'Efectivo',
                          concept: `COMPRA ${docType} - ${supplierName}`,
                          amount: p.amount,
                          user: session?.user.fullName || 'Admin',
                          category: 'COMPRA',
                          financialType: 'Variable',
                          currency: purchase.currency
                      },
                      ...cashMovements
                  ]);
              }
          });
      }
  };

  // --- NEW HANDLERS FOR AR/AP (UPDATED WITH FUNCTIONAL UPDATES) ---
  const handleRegisterPaymentReceivable = (ticketId: string, amount: number, paymentDetails: any, allocations?: Record<string, number>) => {
    // Determine Sale details (Using functional state ensures latest state inside loop if needed, but here we trigger side effects)
    // IMPORTANT: When calling this in a loop, standard state updates might overwrite. We use functional updates.
    
    const receivedAmount = paymentDetails.amount || amount;
    const allocatedAmount = amount;
    const excess = Math.max(0, receivedAmount - allocatedAmount);
    
    // 1. Functional Sales Update
    setSales(prevSales => {
        const saleIndex = prevSales.findIndex(s => s.id === ticketId);
        if (saleIndex === -1) return prevSales;
        
        const sale = prevSales[saleIndex];
        const newPayment = {
            ...paymentDetails,
            amount: allocatedAmount, // Log only the debt part in the sale record
            allocations, // Store item specific allocations
            id: Math.random().toString(), // Ensure unique ID
        };
        const updatedSale = {
            ...sale,
            detailedPayments: [...(sale.detailedPayments || []), newPayment]
        };
        const newSales = [...prevSales];
        newSales[saleIndex] = updatedSale;
        return newSales;
    });

    // 2. Functional Clients Update (Safe for loops)
    const saleForClient = sales.find(s => s.id === ticketId); // Note: 'sales' might be stale in loop, but clientName is constant per ticket ID.
    if (saleForClient) {
        setClients(prevClients => {
            return prevClients.map(c => {
                if (c.name === saleForClient.clientName) {
                    let newCreditUsed = Math.max(0, c.creditUsed - allocatedAmount);
                    let newDigitalBalance = c.digitalBalance;
                    if (excess > 0) newDigitalBalance += excess;
                    return { ...c, creditUsed: newCreditUsed, digitalBalance: newDigitalBalance };
                }
                return c;
            });
        });
    }

    // 3. Register Cash Movement (Total Received)
    if (paymentDetails.method === 'Efectivo') {
        const m: CashMovement = {
            id: 'M-' + Date.now() + Math.random(),
            branchId: currentBranchId,
            date: paymentDetails.date,
            time: paymentDetails.time,
            type: 'Ingreso',
            paymentMethod: 'Efectivo',
            concept: `ABONO VENTA #${ticketId} (Inc. ${excess > 0 ? 'Excedente' : ''})`,
            amount: receivedAmount, // The full cash received
            user: session?.user.fullName || 'Admin',
            category: 'COBRANZA',
            financialType: 'Variable',
            currency: saleForClient?.currency || 'PEN'
        };
        setCashMovements(prev => [m, ...prev]);
    }
    
    // Removed Alert to allow bulk processing without spamming
  };

  const handleRegisterPaymentPayable = (purchaseId: string, amount: number, paymentDetails: any, allocations?: Record<string, number>) => {
      // 1. Functional Purchase Update
      setPurchases(prevPurchases => {
          const idx = prevPurchases.findIndex(p => p.id === purchaseId);
          if (idx === -1) return prevPurchases;
          
          const purchase = prevPurchases[idx];
          const allocatedAmount = amount; 
          
          const newPayment = { ...paymentDetails, amount: allocatedAmount, allocations, id: Math.random().toString() };
          const updatedPurchase = {
              ...purchase,
              detailedPayments: [...(purchase.detailedPayments || []), newPayment]
          };
          const newArr = [...prevPurchases];
          newArr[idx] = updatedPurchase;
          return newArr;
      });

      // 2. Handle Supplier Balance
      const purchaseForSupplier = purchases.find(p => p.id === purchaseId);
      const receivedAmount = paymentDetails.amount || amount;
      const allocatedAmount = amount;
      const excess = Math.max(0, receivedAmount - allocatedAmount);

      if (purchaseForSupplier && excess > 0) {
          setSuppliers(prevSuppliers => {
             return prevSuppliers.map(s => {
                 if(s.name === purchaseForSupplier.supplierName) {
                     return { ...s, digitalBalance: (s.digitalBalance || 0) + excess };
                 }
                 return s;
             });
          });
      }

      // 3. Register Cash Movement if Cash
      if (paymentDetails.method === 'Efectivo') {
          const m: CashMovement = {
              id: 'M-' + Date.now() + Math.random(),
              branchId: currentBranchId,
              date: paymentDetails.date,
              time: paymentDetails.time,
              type: 'Egreso',
              paymentMethod: 'Efectivo',
              concept: `PAGO COMPRA #${purchaseId}`,
              amount: receivedAmount,
              user: session?.user.fullName || 'Admin',
              category: 'PAGO PROVEEDOR',
              financialType: 'Variable',
              currency: purchaseForSupplier?.currency || 'PEN'
          };
          setCashMovements(prev => [m, ...prev]);
      }
      
      // Removed Alert to allow bulk processing
  };
  
  // ... rest of the App.tsx component ...
  const handleAddService = (s: ServiceOrder) => setServices([s, ...services]);
  const handleFinalizeService = (serviceId: string, total: number, finalStatus: 'Entregado' | 'Devolucion', paymentBreakdown: PaymentBreakdown) => {
      setServices(services.map(s => s.id === serviceId ? { ...s, status: finalStatus, cost: total } : s));
      if (paymentBreakdown.cash > 0) {
          setCashMovements([
              {
                  id: 'M-' + Date.now(),
                  branchId: currentBranchId,
                  date: new Date().toLocaleDateString('es-PE'),
                  time: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                  type: 'Ingreso',
                  paymentMethod: 'Efectivo',
                  concept: `SERVICIO TECNICO #${serviceId}`,
                  amount: paymentBreakdown.cash,
                  user: session?.user.fullName || 'Admin',
                  category: 'SERVICIO',
                  financialType: 'Variable'
              },
              ...cashMovements
          ]);
      }
  };
  const handleMarkRepaired = (id: string) => setServices(services.map(s => s.id === id ? { ...s, status: 'Reparado' } : s));

  const handleAddSupplier = (s: Supplier) => setSuppliers([...suppliers, s]);
  const handleDeleteSupplier = (id: string) => setSuppliers(suppliers.filter(s => s.id !== id));

  const handleAddBrand = (b: Brand) => setBrands([...brands, b]);
  const handleDeleteBrand = (id: string) => setBrands(brands.filter(b => b.id !== id));
  const handleAddCategory = (c: Category) => setCategories([...categories, c]);
  const handleDeleteCategory = (id: string) => setCategories(categories.filter(c => c.id !== id));

  const handleAddLocation = (loc: GeoLocation) => setLocations([...locations, loc]);
  const handleDeleteLocation = (id: string) => setLocations(locations.filter(l => l.id !== id));
  const handleResetLocations = () => setLocations(MOCK_LOCATIONS);

  const handleAddUser = (u: SystemUser) => setUsers([...users, u]);
  const handleUpdateUser = (u: SystemUser) => setUsers(users.map(usr => usr.id === u.id ? u : usr));
  const handleDeleteUser = (id: string) => setUsers(users.filter(u => u.id !== id));

  const handleAddBankAccount = (b: BankAccount) => setBankAccounts([...bankAccounts, b]);
  const handleUpdateBankAccount = (b: BankAccount) => setBankAccounts(bankAccounts.map(bk => bk.id === b.id ? b : bk));
  const handleDeleteBankAccount = (id: string) => setBankAccounts(bankAccounts.filter(b => b.id !== id));

  const handleUpdateClientBalance = (clientId: string, amountChange: number, reason: string, paymentMethod: any, accountId?: string) => {
      setClients(clients.map(c => c.id === clientId ? { ...c, digitalBalance: c.digitalBalance + amountChange } : c));
  };

  const handleUniversalTransfer = (from: string, to: string, amount: number, rate: number, ref: string, op: string) => {
      alert(`Transferencia de ${amount} realizada de ${from} a ${to}`);
  };

  const handleOpenCashBox = (openingCash: number, notes: string, confirmedBankBalances: Record<string, string>) => {
      const newSession: CashBoxSession = {
          id: 'CS-' + Date.now(),
          branchId: currentBranchId,
          openingDate: new Date().toLocaleString(),
          closingDate: '',
          openingUser: session?.user.fullName || 'Admin',
          closingUser: '',
          status: 'OPEN',
          expectedOpening: openingCash,
          countedOpening: openingCash,
          openingDifference: 0,
          openingNotes: notes,
          confirmedDigitalAtOpen: Object.entries(confirmedBankBalances).reduce((acc, [k, v]) => ({...acc, [k]: Number(v)}), {}),
          expectedCashAtClose: 0,
          countedCashAtClose: 0,
          cashDifferenceAtClose: 0,
          expectedDigitalAtClose: 0,
          confirmedDigitalAtClose: {},
          closingNotes: ''
      };
      setCurrentCashSession(newSession);
  };

  const handleCloseCashBox = (countedCash: number, systemCash: number, systemDigital: number, notes: string, confirmedBankBalances: Record<string, string>) => {
      if (currentCashSession) {
          const closedSession = {
              ...currentCashSession,
              closingDate: new Date().toLocaleString(),
              closingUser: session?.user.fullName || 'Admin',
              status: 'CLOSED' as const,
              expectedCashAtClose: systemCash,
              countedCashAtClose: countedCash,
              cashDifferenceAtClose: countedCash - systemCash,
              expectedDigitalAtClose: systemDigital,
              confirmedDigitalAtClose: Object.entries(confirmedBankBalances).reduce((acc, [k, v]) => ({...acc, [k]: Number(v)}), {}),
              closingNotes: notes
          };
          setCashBoxSessions([closedSession, ...cashBoxSessions]);
          setCurrentCashSession(undefined);
      }
  };

  const handleAddMovement = (m: CashMovement) => setCashMovements([m, ...cashMovements]);

  const handleAddQuotation = (q: Quotation) => setQuotations([q, ...quotations]);
  const handleDeleteQuotation = (id: string) => setQuotations(quotations.filter(q => q.id !== id));
  const handleLoadQuotation = (q: Quotation) => {
      setCart(q.items);
      if (q.clientName) {
          const c = clients.find(cl => cl.name === q.clientName);
          if (c) setPosClient(c);
      }
      setCurrentView(ViewState.POS);
  };

  const handleAddPresale = (p: Presale) => setPresales([p, ...presales]);
  const handleDeletePresale = (id: string) => setPresales(presales.filter(p => p.id !== id));
  const handleLoadPresale = (p: Presale) => {
      alert("Procesando entrega de preventa " + p.id);
  };

  const handleProcessCreditNote = (originalSaleId: string, itemsToReturn: { itemId: string, quantity: number }[], totalRefund: number, breakdown: PaymentBreakdown, detailedRefunds?: any[]) => {
      alert("Nota de crédito procesada por S/ " + totalRefund);
  };

  const handleProcessInventorySession = (s: InventoryHistorySession) => setInventoryHistory([s, ...inventoryHistory]);

  const handleCloneBranch = (sourceId: string, newName: string) => {
      const newBranch: Branch = { id: 'BR-' + Date.now(), name: newName, address: '', isMain: false };
      setBranches([...branches, newBranch]);
  };
  const handleSwitchBranch = (id: string) => setCurrentBranchId(id);
  const handleAddBranch = (name: string, address: string, phone: string) => setBranches([...branches, { id: 'BR-' + Date.now(), name, address, phone, isMain: false }]);
  const handleUpdateBranch = (b: Branch) => setBranches(branches.map(br => br.id === b.id ? b : br));
  const handleDeleteBranch = (id: string) => setBranches(branches.filter(b => b.id !== id));

  const handleAddTenant = (t: Tenant) => setTenants([...tenants, t]);
  const handleUpdateTenant = (id: string, updates: Partial<Tenant>) => setTenants(tenants.map(t => t.id === id ? { ...t, ...updates } : t));
  const handleDeleteTenant = (id: string) => setTenants(tenants.filter(t => t.id !== id));
  const handleResetTenantData = (id: string) => alert("Datos reseteados para tenant " + id);

  const handleSyncDownload = (data: any) => {
      if (data.products) setProducts(data.products);
      if (data.clients) setClients(data.clients);
      alert("Datos sincronizados desde la nube.");
  };

  if (!session) {
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        users={users} 
        tenants={tenants} 
        heroImage={companyLogo || undefined}
      />
    );
  }

  return (
    <Layout
      companyName={companyName}
      companyLogo={companyLogo}
      navStructure={navStructure}
      currentView={currentView}
      onNavigate={setCurrentView}
      isDarkMode={isDarkMode}
      toggleTheme={() => setIsDarkMode(!isDarkMode)}
      session={session}
      onLogout={handleLogout}
      isSyncEnabled={isSyncEnabled}
      toggleSyncMode={() => setIsSyncEnabled(!isSyncEnabled)}
      branches={branches}
      currentBranchId={currentBranchId}
      onSwitchBranch={handleSwitchBranch}
      onCreateBranch={(name, addr) => handleAddBranch(name, addr, '')}
    >
      {currentView === ViewState.DASHBOARD && (
        <Dashboard 
          onNavigate={setCurrentView} 
          session={session} 
          cashMovements={cashMovements}
          clients={clients}
          services={services}
          products={products}
          navStructure={navStructure}
        />
      )}
      
      {currentView === ViewState.POS && (
        <SalesModule 
          products={products}
          clients={clients}
          categories={categories}
          purchasesHistory={purchases}
          stockMovements={stockMovements}
          bankAccounts={bankAccounts}
          locations={locations}
          onAddClient={handleAddClient}
          onProcessSale={handleProcessSale}
          cart={cart}
          setCart={setCart}
          client={posClient}
          setClient={setPosClient}
          quotations={quotations}
          onLoadQuotation={handleLoadQuotation}
          onAddQuotation={handleAddQuotation}
          onAddPresale={handleAddPresale}
          systemBaseCurrency={baseCurrency}
          branches={branches}
          currentBranchId={currentBranchId}
          onNavigate={setCurrentView} 
        />
      )}

      {currentView === ViewState.ACCOUNTS_RECEIVABLE && (
        <AccountsReceivableModule 
          clients={clients}
          salesHistory={sales}
          bankAccounts={bankAccounts}
          onRegisterPayment={handleRegisterPaymentReceivable}
          isCashBoxOpen={!!currentCashSession} // Pass CashBox status
        />
      )}

      {currentView === ViewState.ACCOUNTS_PAYABLE && (
        <AccountsPayableModule 
          suppliers={suppliers}
          purchasesHistory={purchases}
          bankAccounts={bankAccounts}
          onRegisterPayment={handleRegisterPaymentPayable}
          isCashBoxOpen={!!currentCashSession} // Pass CashBox status
        />
      )}

      {currentView === ViewState.SERVICES && (
        <ServicesModule 
          services={services} 
          products={products}
          categories={categories}
          bankAccounts={bankAccounts}
          onAddService={handleAddService}
          onFinalizeService={handleFinalizeService}
          onMarkRepaired={handleMarkRepaired}
          clients={clients}
          onAddClient={handleAddClient}
          onOpenWhatsApp={(name, phone) => { window.open(`https://wa.me/${phone}`); }}
          locations={locations}
          currentBranchId={currentBranchId}
        />
      )}
      
      {/* ... Rest of modules (Inventory, Purchases, Cash, Clients, etc. UNCHANGED) ... */}
      {currentView === ViewState.INVENTORY && (
        <InventoryModule 
          products={products} 
          brands={brands} 
          categories={categories} 
          onUpdateProduct={handleUpdateProduct} 
          onAddProduct={handleAddProduct}
          onAddProducts={handleAddProducts}
          onDeleteProduct={handleDeleteProduct}
          onNavigate={setCurrentView}
          salesHistory={sales}
          purchasesHistory={purchases}
          stockMovements={stockMovements}
        />
      )}

      {currentView === ViewState.PURCHASES && (
        <PurchaseModule 
          products={products}
          suppliers={suppliers}
          categories={categories}
          bankAccounts={bankAccounts}
          onAddSupplier={handleAddSupplier}
          locations={locations}
          onProcessPurchase={handleProcessPurchase}
          systemBaseCurrency={baseCurrency}
        />
      )}

      {currentView === ViewState.CASH && (
        <CashModule 
          movements={cashMovements}
          salesHistory={sales}
          purchasesHistory={purchases}
          onAddMovement={handleAddMovement}
          bankAccounts={bankAccounts}
          onUniversalTransfer={handleUniversalTransfer}
          fixedExpenseCategories={fixedExpenses}
          fixedIncomeCategories={fixedIncomes}
          onAddFixedCategory={(cat, type) => type === 'Ingreso' ? setFixedIncomes([...fixedIncomes, cat]) : setFixedExpenses([...fixedExpenses, cat])}
          isCashBoxOpen={!!currentCashSession}
          lastClosingCash={0}
          onOpenCashBox={handleOpenCashBox}
          onCloseCashBox={handleCloseCashBox}
          systemBaseCurrency={baseCurrency}
          currentSession={currentCashSession}
          currentBranchId={currentBranchId}
        />
      )}

      {currentView === ViewState.CLIENTS && (
        <ClientsModule 
          clients={clients}
          onAddClient={handleAddClient}
          onOpenWhatsApp={(name, phone) => window.open(`https://wa.me/${phone}`)}
          locations={locations}
          initialData={pendingClientData}
          onClearInitialData={() => setPendingClientData(null)}
        />
      )}

      {currentView === ViewState.WHATSAPP && (
        <WhatsAppModule 
          clients={clients} 
          onAddClient={handleAddClient}
          products={products}
          chats={chats}
          setChats={setChats}
          currentUser={session.user.fullName}
          onNavigate={setCurrentView}
          crmDb={crmDb}
          setCrmDb={setCrmDb}
          crmStages={crmStages}
          setCrmStages={setCrmStages}
          onRegisterClientFromCrm={handleRegisterFromCRM}
        />
      )}

      {currentView === ViewState.CRM && (
        <CrmModule 
          crmDb={crmDb} 
          setCrmDb={setCrmDb} 
          stages={crmStages} 
          onNavigate={setCurrentView}
        />
      )}

      {currentView === ViewState.SUPPLIERS && (
        <SuppliersModule 
          suppliers={suppliers}
          onAddSupplier={handleAddSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          purchasesHistory={purchases}
        />
      )}

      {currentView === ViewState.MANAGE_RESOURCES && (
        <ResourceManagement 
          brands={brands} 
          onAddBrand={handleAddBrand}
          onDeleteBrand={handleDeleteBrand}
          categories={categories} 
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      )}

      {currentView === ViewState.SALES_REPORT && (
        <SalesReportModule salesHistory={sales} />
      )}

      {currentView === ViewState.PROFIT_REPORT && (
        <ProfitReportModule salesHistory={sales} cashMovements={cashMovements} products={products} />
      )}

      {currentView === ViewState.INVENTORY_AUDIT && (
        <InventoryAuditModule history={inventoryHistory} products={products} />
      )}

      {currentView === ViewState.BUSINESS_EVOLUTION && (
        <BusinessEvolutionModule products={products} clients={clients} movements={cashMovements} />
      )}

      {currentView === ViewState.FINANCIAL_STRATEGY && (
        <FinancialStrategyModule products={products} salesHistory={sales} cashMovements={cashMovements} onAddCashMovement={handleAddMovement} />
      )}

      {currentView === ViewState.HISTORY_QUERIES && (
        <HistoryQueries 
          salesHistory={sales} 
          purchasesHistory={purchases} 
          stockMovements={stockMovements} 
          cashMovements={cashMovements} 
          initialTab='ventas' 
          products={products}
        />
      )}

      {currentView === ViewState.PURCHASES_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='compras' products={products} />}
      {currentView === ViewState.INGRESOS_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='ingresos' products={products} />}
      {currentView === ViewState.EGRESOS_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='egresos' products={products} />}
      {currentView === ViewState.PRODUCT_HISTORY_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='historial_producto' products={products} />}
      {currentView === ViewState.KARDEX_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='kardex' products={products} />}
      {currentView === ViewState.CREDIT_NOTE_HISTORY && <HistoryQueries salesHistory={sales} purchasesHistory={purchases} stockMovements={stockMovements} cashMovements={cashMovements} initialTab='notas_credito' products={products} />}

      {currentView === ViewState.LOCATIONS && (
        <LocationsModule 
          locations={locations} 
          onAddLocation={handleAddLocation} 
          onDeleteLocation={handleDeleteLocation} 
          onResetLocations={handleResetLocations}
        />
      )}

      {currentView === ViewState.USER_PRIVILEGES && (
        <UserPrivilegesModule 
          users={users} 
          onAddUser={handleAddUser} 
          onUpdateUser={handleUpdateUser} 
          onDeleteUser={handleDeleteUser} 
        />
      )}

      {currentView === ViewState.CREDIT_NOTE && (
        <CreditNoteModule 
          salesHistory={sales} 
          onProcessCreditNote={handleProcessCreditNote} 
          bankAccounts={bankAccounts}
        />
      )}

      {currentView === ViewState.CLIENT_WALLET && (
        <ClientWalletModule 
          clients={clients} 
          locations={locations} 
          onUpdateClientBalance={handleUpdateClientBalance} 
          onAddClient={handleAddClient} 
          bankAccounts={bankAccounts}
          isCashBoxOpen={!!currentCashSession}
        />
      )}

      {currentView === ViewState.QUOTATIONS && (
        <QuotationModule 
          quotations={quotations} 
          onLoadQuotation={handleLoadQuotation} 
          onDeleteQuotation={handleDeleteQuotation} 
        />
      )}

      {currentView === ViewState.PRESALES && (
        <PresaleModule 
          presales={presales} 
          onLoadPresale={handleLoadPresale} 
          onDeletePresale={handleDeletePresale} 
          products={products}
          clients={clients}
          categories={categories}
          purchasesHistory={purchases}
          stockMovements={stockMovements}
          bankAccounts={bankAccounts}
          locations={locations}
          onAddClient={handleAddClient}
          onAddPresale={handleAddPresale}
          systemBaseCurrency={baseCurrency}
          branches={branches}
          currentBranchId={currentBranchId}
          quotations={quotations}
          onAddQuotation={handleAddQuotation}
        />
      )}

      {currentView === ViewState.DATABASE_CONFIG && (
        <DatabaseModule 
          isSyncEnabled={isSyncEnabled}
          data={{ products, clients, movements: cashMovements, sales, services, suppliers, brands, categories, bankAccounts }}
          onSyncDownload={handleSyncDownload}
        />
      )}

      {currentView === ViewState.CONFIG_PRINTER && (
        <PrintConfigModule />
      )}

      {currentView === ViewState.MEDIA_EDITOR && (
        <MediaEditorModule 
          onUpdateHeroImage={() => {}} 
          onUpdateFeatureImage={() => {}} 
        />
      )}

      {currentView === ViewState.SUPER_ADMIN_DASHBOARD && (
        <SuperAdminModule 
          tenants={tenants}
          onAddTenant={handleAddTenant}
          onUpdateTenant={handleUpdateTenant}
          onDeleteTenant={handleDeleteTenant}
          onResetTenantData={handleResetTenantData}
        />
      )}

      {currentView === ViewState.CASH_BOX_HISTORY && (
        <CashBoxHistoryModule sessions={cashBoxSessions} bankAccounts={bankAccounts} />
      )}

      {currentView === ViewState.BANK_ACCOUNTS && (
        <BankAccountsModule 
          bankAccounts={bankAccounts} 
          onAddBankAccount={handleAddBankAccount} 
          onUpdateBankAccount={handleUpdateBankAccount} 
          onDeleteBankAccount={handleDeleteBankAccount} 
          onUniversalTransfer={handleUniversalTransfer}
        />
      )}

      {currentView === ViewState.BANK_HISTORY && (
        <BankHistoryModule cashMovements={cashMovements} bankAccounts={bankAccounts} />
      )}

      {currentView === ViewState.COMPANY_PROFILE && (
        <CompanyProfileModule 
          companyName={companyName} 
          onUpdateCompanyName={setCompanyName} 
          companyLogo={companyLogo} 
          onUpdateLogo={setCompanyLogo} 
          baseCurrency={baseCurrency} 
          onUpdateBaseCurrency={setBaseCurrency}
        />
      )}

      {currentView === ViewState.SYSTEM_DIAGNOSTICS && (
        <SystemDiagnosticsModule 
          products={products}
          cashMovements={cashMovements}
          stockMovements={stockMovements}
          onAddCashMovement={handleAddMovement}
          onAddProduct={handleAddProduct}
          onProcessSale={handleProcessSale}
          onProcessPurchase={handleProcessPurchase}
          onProcessCreditNote={handleProcessCreditNote}
          onAddService={handleAddService}
          currentBranchId={currentBranchId}
        />
      )}

      {currentView === ViewState.GATEWAY_CONFIG && (
        <GatewayConfigModule />
      )}

      {currentView === ViewState.BRANCH_MANAGEMENT && (
        <BranchManagementModule 
          branches={branches}
          onAddBranch={handleAddBranch}
          onUpdateBranch={handleUpdateBranch}
          onDeleteBranch={handleDeleteBranch}
          onCloneBranch={handleCloneBranch}
          onSwitchBranch={handleSwitchBranch}
          currentBranchId={currentBranchId}
        />
      )}

      {currentView === ViewState.WAREHOUSE_TRANSFER && (
        <WarehouseTransferModule 
          branches={branches}
          currentBranchId={currentBranchId}
          products={products}
          onProcessTransfer={(t) => setWarehouseTransfers([t, ...warehouseTransfers])}
          onConfirmTransfer={(t) => {
              const updated = { ...t, status: 'COMPLETED' as const };
              setWarehouseTransfers(warehouseTransfers.map(tr => tr.id === t.id ? updated : tr));
              const newMoves: StockMovement[] = t.items.map(i => {
                  const prod = products.find(p => p.id === i.productId);
                  const newStock = (prod?.stock || 0) + i.quantity;
                  if (prod) handleUpdateProduct({ ...prod, stock: newStock });
                  return {
                      id: 'MOV-' + Date.now() + Math.random(),
                      branchId: currentBranchId,
                      date: new Date().toLocaleDateString('es-PE'),
                      time: new Date().toLocaleTimeString('es-PE'),
                      productId: i.productId,
                      productName: i.productName,
                      type: 'ENTRADA',
                      quantity: i.quantity,
                      currentStock: newStock,
                      reference: `TRASPASO RECIBIDO #${t.id}`,
                      user: session?.user.fullName || 'Admin'
                  };
              });
              setStockMovements([...newMoves, ...stockMovements]);
          }}
          onRejectTransfer={(t) => setWarehouseTransfers(warehouseTransfers.map(tr => tr.id === t.id ? { ...tr, status: 'REJECTED' } : tr))}
          history={warehouseTransfers}
          quotations={presales} 
        />
      )}

      {currentView === ViewState.CASH_TRANSFERS && (
        <CashTransferModule 
          bankAccounts={bankAccounts}
          movements={cashMovements}
          requests={cashTransferRequests}
          branches={branches}
          currentBranchId={currentBranchId}
          onInitiateTransfer={(from, to, amount, rate, ref, op, targetBranchId) => {
              const req: CashTransferRequest = {
                  id: 'REQ-' + Date.now(),
                  date: new Date().toLocaleDateString('es-PE'),
                  time: new Date().toLocaleTimeString('es-PE'),
                  fromBranchId: currentBranchId,
                  fromBranchName: branches.find(b => b.id === currentBranchId)?.name || '',
                  toBranchId: targetBranchId,
                  toBranchName: branches.find(b => b.id === targetBranchId)?.name || '',
                  amount,
                  currency: baseCurrency,
                  status: 'PENDING',
                  user: session?.user.fullName || 'Admin',
                  notes: ref
              };
              setCashTransferRequests([req, ...cashTransferRequests]);
              handleAddMovement({
                  id: 'M-' + Date.now(),
                  branchId: currentBranchId,
                  date: req.date,
                  time: req.time,
                  type: 'Egreso',
                  paymentMethod: 'Efectivo',
                  concept: `TRASPASO A ${req.toBranchName}`,
                  amount: amount,
                  user: session?.user.fullName || 'Admin',
                  category: 'TRANSFERENCIA SALIENTE',
                  financialType: 'Variable'
              });
          }}
          onConfirmTransfer={(req) => {
              setCashTransferRequests(cashTransferRequests.map(r => r.id === req.id ? { ...r, status: 'COMPLETED' } : r));
              handleAddMovement({
                  id: 'M-' + Date.now(),
                  branchId: currentBranchId,
                  date: new Date().toLocaleDateString('es-PE'),
                  time: new Date().toLocaleTimeString('es-PE'),
                  type: 'Ingreso',
                  paymentMethod: 'Efectivo',
                  concept: `RECEPCIÓN DE ${req.fromBranchName}`,
                  amount: req.amount,
                  user: session?.user.fullName || 'Admin',
                  category: 'TRANSFERENCIA ENTRANTE',
                  financialType: 'Variable'
              });
          }}
          systemBaseCurrency={baseCurrency}
          isCashBoxOpen={!!currentCashSession}
        />
      )}

      {currentView === ViewState.INVENTORY_ADJUSTMENT && (
        <InventoryAdjustmentModule 
          products={products}
          salesHistory={sales}
          onProcessInventorySession={handleProcessInventorySession}
          sessionUser={session.user.fullName}
          history={inventoryHistory}
        />
      )}

    </Layout>
  );
};

export default App;
