
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ViewState, AuthSession, SystemUser, Branch, Product, Client, 
  ServiceOrder, CashMovement, SaleRecord, PurchaseRecord, 
  StockMovement, Supplier, Brand, Category, BankAccount, 
  GeoLocation, Quotation, Presale, CashBoxSession, CashTransferRequest,
  WarehouseTransfer, InventoryHistorySession, Tenant, VideoTutorial,
  PaymentBreakdown, CartItem
} from './types';
import { INITIAL_NAV_STRUCTURE } from './navigation';
import { 
  MOCK_CLIENTS, MOCK_SERVICES, MOCK_CASH_MOVEMENTS, TECH_PRODUCTS, 
  TECH_CATEGORIES, MOCK_LOCATIONS, PHARMA_PRODUCTS, PHARMA_CATEGORIES,
  FIXED_EXPENSE_CATEGORIES, FIXED_INCOME_CATEGORIES
} from './constants';

// Component Imports
import LoginScreen from './components/LoginScreen';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SalesModule from './components/SalesModule'; // POS
import PurchaseModule from './components/PurchaseModule';
import InventoryModule from './components/InventoryModule';
import ServicesModule from './components/ServicesModule';
import ClientsModule from './components/ClientsModule';
import CashModule from './components/CashModule'; // Cash & Cash Transfers
import CashTransferModule from './components/CashTransferModule';
import CashBoxHistoryModule from './components/CashBoxHistoryModule';
import BankAccountsModule from './components/BankAccountsModule';
import BankHistoryModule from './components/BankHistoryModule';
import ClientWalletModule from './components/ClientWalletModule';
import SalesReportModule from './components/SalesReportModule';
import ProfitReportModule from './components/ProfitReportModule';
import InventoryAuditModule from './components/InventoryAuditModule';
import BusinessEvolutionModule from './components/BusinessEvolutionModule';
import FinancialStrategyModule from './components/FinancialStrategyModule';
import HistoryQueries from './components/HistoryQueries';
import CreditNoteModule from './components/CreditNoteModule';
import BranchManagementModule from './components/BranchManagementModule';
import CompanyProfileModule from './components/CompanyProfileModule';
import GatewayConfigModule from './components/GatewayConfigModule';
import UserPrivilegesModule from './components/UserPrivilegesModule';
import SystemDiagnosticsModule from './components/SystemDiagnosticsModule';
import MediaEditorModule from './components/MediaEditorModule';
import PrintConfigModule from './components/PrintConfigModule';
import DatabaseModule from './components/DatabaseModule';
import WarehouseTransferModule from './components/WarehouseTransferModule';
import SuppliersModule from './components/SuppliersModule';
import ResourceManagement from './components/ResourceManagement';
import LocationsModule from './components/LocationsModule';
import WhatsAppModule from './components/WhatsAppModule';
import QuotationModule from './components/QuotationModule';
import PresaleModule from './components/PresaleModule';
import FinanceManagerModule from './components/FinanceManagerModule';
import SuperAdminModule from './components/SuperAdminModule';
import InventoryAdjustmentModule from './components/InventoryAdjustmentModule';
import MenuEditorModule from './components/MenuEditorModule'; 

export default function App() {
  // --- AUTH & THEME ---
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSyncEnabled, setIsSyncEnabled] = useState(false);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [navStructure, setNavStructure] = useState(INITIAL_NAV_STRUCTURE);

  // --- MASTER DATA ---
  const [branches, setBranches] = useState<Branch[]>([{ id: 'MAIN', name: 'PRINCIPAL', isMain: true, address: 'Central', phone: '' }]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('MAIN');
  
  const [users, setUsers] = useState<SystemUser[]>([
      { id: '1', username: 'admin', password: '123', fullName: 'ADMINISTRADOR', role: 'ADMIN', active: true, permissions: ['ALL'], companyName: 'SAPISOFT', industry: 'TECH' },
      { id: '2', username: 'superadmin', password: '123', fullName: 'SapiSoft Master', role: 'SUPER_ADMIN', active: true, permissions: ['ALL'], companyName: 'SAPISOFT', industry: 'TECH' }
  ]);
  
  const [tenants, setTenants] = useState<Tenant[]>([
      { id: 'T1', companyName: 'SAPISOFT', industry: 'TECH', status: 'ACTIVE', subscriptionEnd: '31/12/2030', ownerName: 'Admin', phone: '', planType: 'FULL', baseCurrency: 'PEN', creditBalance: 0 }
  ]);

  const [products, setProducts] = useState<Product[]>([...TECH_PRODUCTS, ...PHARMA_PRODUCTS]);
  const [clients, setClients] = useState<Client[]>(MOCK_CLIENTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([...TECH_CATEGORIES, ...PHARMA_CATEGORIES]);
  const [locations, setLocations] = useState<GeoLocation[]>(MOCK_LOCATIONS);
  
  // RESTORED: Cuentas Bancarias por Defecto
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
      { id: '1', bankName: 'BCP', accountNumber: '191-12345678-0-01', currency: 'PEN', alias: 'Cta Corriente Soles', useInSales: true, useInPurchases: true },
      { id: '2', bankName: 'INTERBANK', accountNumber: '200-300123456', currency: 'USD', alias: 'Ahorros Dólares', useInSales: true, useInPurchases: true },
      { id: '3', bankName: 'YAPE', accountNumber: '987654321', currency: 'PEN', alias: 'Yape Corporativo', useInSales: true, useInPurchases: false }
  ]);
  
  // --- TRANSACTIONS ---
  const [services, setServices] = useState<ServiceOrder[]>(MOCK_SERVICES);
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const [purchasesHistory, setPurchasesHistory] = useState<PurchaseRecord[]>([]);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(MOCK_CASH_MOVEMENTS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [presales, setPresales] = useState<Presale[]>([]);
  const [creditNotes, setCreditNotes] = useState<any[]>([]); 
  const [warehouseTransfers, setWarehouseTransfers] = useState<WarehouseTransfer[]>([]);
  const [inventorySessions, setInventorySessions] = useState<InventoryHistorySession[]>([]);

  // --- CASH BOX CONTROL ---
  const [cashSessions, setCashSessions] = useState<CashBoxSession[]>([]);
  const [branchCashStatus, setBranchCashStatus] = useState<Record<string, boolean>>({});
  const [branchLastClosingCash, setBranchLastClosingCash] = useState<Record<string, number>>({});
  const [cashTransferRequests, setCashTransferRequests] = useState<CashTransferRequest[]>([]);

  // --- CONFIG ---
  const [fixedExpenses, setFixedExpenses] = useState<string[]>(FIXED_EXPENSE_CATEGORIES);
  const [fixedIncome, setFixedIncome] = useState<string[]>(FIXED_INCOME_CATEGORIES);
  const [chats, setChats] = useState<any[]>([]); 
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState<string>('');
  const [featureImage, setFeatureImage] = useState<string>('');
  const [videoTutorials, setVideoTutorials] = useState<VideoTutorial[]>([]);

  const lastClosingCash = branchLastClosingCash[currentBranchId] || 0;
  const isCashBoxOpen = branchCashStatus[currentBranchId] || false;
  
  const currentSession = useMemo(() => {
      return cashSessions.find(s => s.branchId === currentBranchId && s.status === 'OPEN');
  }, [cashSessions, currentBranchId]);

  // --- HANDLERS ---

  const handleLogin = (user: SystemUser) => {
      setSession({
          user,
          businessName: user.companyName,
          token: 'mock-token',
          baseCurrency: 'PEN'
      });
      if(user.role === 'SUPER_ADMIN') setCurrentView(ViewState.SUPER_ADMIN_DASHBOARD);
      else setCurrentView(ViewState.DASHBOARD);
  };

  const handleLogout = () => {
      setSession(null);
      setCurrentView(ViewState.DASHBOARD);
  };

  const handleAddService = useCallback((s: ServiceOrder) => {
      setServices(prev => [{ ...s, branchId: currentBranchId }, ...prev]);
  }, [currentBranchId]);

  const handleAddCashMovement = useCallback((m: CashMovement) => {
    const targetBranchId = m.branchId || currentBranchId;
    setCashMovements(prev => [{ ...m, branchId: targetBranchId }, ...prev]);
  }, [currentBranchId]);

  const handleOpenCashBox = (openingCash: number, notes: string, banks: Record<string, string>) => {
      const user = session?.user.fullName || 'ADMIN';
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const confirmedDigital: Record<string, number> = {};
      Object.entries(banks).forEach(([k,v]) => confirmedDigital[k] = parseFloat(v));

      const newSession: CashBoxSession = { 
        id: 'SES-' + Date.now(), 
        branchId: currentBranchId, 
        openingDate: `${date} ${time}`, 
        openingUser: user, 
        status: 'OPEN', 
        expectedOpening: lastClosingCash, 
        countedOpening: openingCash, 
        openingDifference: openingCash - lastClosingCash, 
        openingNotes: notes, 
        confirmedDigitalAtOpen: confirmedDigital, 
        closingDate: '', closingUser: '', expectedCashAtClose: 0, countedCashAtClose: 0, cashDifferenceAtClose: 0, expectedDigitalAtClose: 0, confirmedDigitalAtClose: {}, closingNotes: '' 
      };
      setCashSessions([newSession, ...cashSessions]);
      setBranchCashStatus(prev => ({ ...prev, [currentBranchId]: true }));
  };

  const handleCloseCashBox = (counted: number, sysCash: number, sysDigital: number, notes: string, banks: Record<string, string>) => {
      const user = session?.user.fullName || 'ADMIN';
      const confirmedDigital: Record<string, number> = {};
      Object.entries(banks).forEach(([k,v]) => confirmedDigital[k] = parseFloat(v));

      setCashSessions(prev => prev.map(s => (s.status === 'OPEN' && s.branchId === currentBranchId) ? { 
          ...s, status: 'CLOSED', 
          closingDate: `${new Date().toLocaleDateString('es-PE')} ${new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`, 
          closingUser: user, 
          expectedCashAtClose: sysCash, 
          countedCashAtClose: counted, 
          cashDifferenceAtClose: counted - sysCash, 
          expectedDigitalAtClose: sysDigital,
          confirmedDigitalAtClose: confirmedDigital,
          closingNotes: notes 
      } : s));
      setBranchCashStatus(prev => ({ ...prev, [currentBranchId]: false }));
      setBranchLastClosingCash(prev => ({ ...prev, [currentBranchId]: counted }));
  };

  const handleInitiateCashTransfer = (fromId: string, toId: string, amount: number, exchangeRate: number, reference: string, opNumber: string, targetBranchId: string) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const user = session?.user.fullName || 'ADMIN';
      const targetBranch = branches.find(b => b.id === targetBranchId);

      const newRequest: CashTransferRequest = {
          id: 'REQ-' + Date.now(),
          date, time,
          fromBranchId: currentBranchId,
          fromBranchName: branches.find(b => b.id === currentBranchId)?.name || 'ORIGEN',
          toBranchId: targetBranchId,
          toBranchName: targetBranch?.name || 'DESTINO',
          fromAccountId: fromId,
          toAccountId: toId,
          amount: amount, 
          currency: fromId === 'CASH' ? session?.baseCurrency || 'PEN' : bankAccounts.find(b=>b.id===fromId)?.currency || 'PEN',
          status: 'PENDING',
          user,
          notes: reference,
          operationNumber: opNumber
      };
      
      setCashTransferRequests(prev => [newRequest, ...prev]);
      alert("Solicitud de traspaso creada. El dinero se moverá cuando el destino confirme.");
  };

  const handleConfirmCashTransfer = (request: CashTransferRequest) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const user = session?.user.fullName || 'ADMIN';

      const fromConcept = `TRASPASO A ${request.toBranchName} - ${request.toAccountId === 'CASH' ? 'CAJA' : 'BANCO'}`;
      handleAddCashMovement({
          id: 'TR-OUT-' + Date.now(),
          branchId: request.fromBranchId, 
          date, time,
          type: 'Egreso',
          paymentMethod: request.fromAccountId === 'CASH' ? 'Efectivo' : 'Transferencia',
          concept: fromConcept,
          amount: request.amount,
          user,
          category: 'TRANSFERENCIA SALIDA',
          financialType: 'Variable',
          accountId: request.fromAccountId === 'CASH' ? undefined : request.fromAccountId,
          referenceId: request.operationNumber,
          currency: request.currency
      });

      const toConcept = `RECEPCIÓN DE ${request.fromBranchName}`;
      handleAddCashMovement({
          id: 'TR-IN-' + Date.now(),
          branchId: request.toBranchId, 
          date, time,
          type: 'Ingreso',
          paymentMethod: request.toAccountId === 'CASH' ? 'Efectivo' : 'Transferencia',
          concept: toConcept,
          amount: request.amount,
          user,
          category: 'TRANSFERENCIA ENTRADA',
          financialType: 'Variable',
          accountId: request.toAccountId === 'CASH' ? undefined : request.toAccountId,
          referenceId: request.operationNumber,
          currency: request.currency
      });

      setCashTransferRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'COMPLETED' } : r));
      alert("Transferencia completada. Saldos actualizados en ambas sucursales.");
  };

  const handleRejectCashTransfer = (request: CashTransferRequest) => {
      setCashTransferRequests(prev => prev.map(r => r.id === request.id ? { ...r, status: 'REJECTED' } : r));
      alert("Solicitud rechazada. No se realizaron movimientos de dinero.");
  };

  const addProduct = (p: Product) => setProducts([p, ...products]);
  const updateProduct = (p: Product) => setProducts(products.map(prod => prod.id === p.id ? p : prod));
  const deleteProduct = (id: string) => setProducts(products.filter(p => p.id !== id));
  
  const addClient = (c: Client) => setClients([c, ...clients]);
  const addSupplier = (s: Supplier) => setSuppliers([s, ...suppliers]);
  const deleteSupplier = (id: string) => setSuppliers(suppliers.filter(s => s.id !== id));

  const processSale = (cart: CartItem[], total: number, docType: string, clientName: string, paymentBreakdown: PaymentBreakdown, ticketId: string, detailedPayments: any[], currency: string, exchangeRate: number) => {
      const sale: SaleRecord = {
          id: ticketId, branchId: currentBranchId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'}),
          clientName, docType, total, currency, exchangeRate, items: cart, paymentBreakdown, detailedPayments, user: session?.user.fullName || 'ADMIN'
      };
      setSalesHistory([sale, ...salesHistory]);

      detailedPayments.forEach((p: any) => {
          handleAddCashMovement({
              id: 'MOV-' + Math.random(), branchId: currentBranchId, date: sale.date, time: sale.time,
              type: 'Ingreso', paymentMethod: p.method, amount: p.amount,
              concept: `${docType} #${ticketId} - ${clientName}`, user: sale.user,
              category: 'VENTA', financialType: 'Variable', accountId: p.accountId, currency
          });
      });

      cart.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product) {
              const newStock = product.stock - item.quantity;
              updateProduct({ ...product, stock: newStock });
              setStockMovements(prev => [{
                  id: 'STK-' + Math.random(), branchId: currentBranchId, date: sale.date, time: sale.time,
                  productId: product.id, productName: product.name, type: 'SALIDA', quantity: item.quantity,
                  currentStock: newStock, reference: `${docType} #${ticketId}`, user: sale.user
              }, ...prev]);
          }
      });
  };

  const processPurchase = (cart: CartItem[], total: number, docType: string, supplierName: string, paymentCondition: 'Contado' | 'Credito', creditDays: number, detailedPayments: any[], currency: string = 'PEN', exchangeRate: number = 1) => {
      const purchase: PurchaseRecord = {
          id: 'PUR-' + Date.now(), branchId: currentBranchId, date: new Date().toLocaleDateString('es-PE'), time: new Date().toLocaleTimeString('es-PE', {hour: '2-digit', minute:'2-digit'}),
          supplierName, docType, total, currency, exchangeRate, items: cart, paymentCondition, detailedPayments, user: session?.user.fullName || 'ADMIN'
      };
      setPurchasesHistory([purchase, ...purchasesHistory]);

      if (paymentCondition === 'Contado') {
          detailedPayments.forEach((p: any) => {
              handleAddCashMovement({
                  id: 'MOV-' + Math.random(), branchId: currentBranchId, date: purchase.date, time: purchase.time,
                  type: 'Egreso', paymentMethod: p.method, amount: p.amount,
                  concept: `COMPRA ${docType} - ${supplierName}`, user: purchase.user,
                  category: 'COMPRA', financialType: 'Variable', accountId: p.accountId, currency
              });
          });
      }

      cart.forEach(item => {
          const product = products.find(p => p.id === item.id);
          if (product) {
              const newStock = product.stock + item.quantity;
              const newCost = item.price; 
              updateProduct({ ...product, stock: newStock, cost: newCost });
              setStockMovements(prev => [{
                  id: 'STK-' + Math.random(), branchId: currentBranchId, date: purchase.date, time: purchase.time,
                  productId: product.id, productName: product.name, type: 'ENTRADA', quantity: item.quantity,
                  currentStock: newStock, reference: `${docType} - ${supplierName}`, user: purchase.user, unitCost: newCost
              }, ...prev]);
          }
      });
  };

  const onProcessCreditNote = (originalSaleId: string, itemsToReturn: { itemId: string, quantity: number }[], totalRefund: number, breakdown: PaymentBreakdown, detailedRefunds: any[] = []) => {
      const date = new Date().toLocaleDateString('es-PE');
      const time = new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const user = session?.user.fullName || 'ADMIN';

      // 1. Stock Return
      itemsToReturn.forEach(({ itemId, quantity }) => {
          const product = products.find(p => p.id === itemId);
          if (product) {
              const newStock = product.stock + quantity;
              updateProduct({ ...product, stock: newStock });
              setStockMovements(prev => [{
                  id: 'STK-NC-' + Math.random(),
                  branchId: currentBranchId,
                  date, time,
                  productId: product.id,
                  productName: product.name,
                  type: 'ENTRADA',
                  quantity: quantity,
                  currentStock: newStock,
                  reference: `Devolución Venta #${originalSaleId}`,
                  user: user
              }, ...prev]);
          }
      });

      // 2. Financial Refund
      detailedRefunds.forEach((refund) => {
          handleAddCashMovement({
              id: refund.id,
              branchId: currentBranchId,
              date, time,
              type: 'Egreso',
              paymentMethod: refund.method,
              amount: refund.amount,
              concept: `DEVOLUCION VENTA #${originalSaleId}`,
              user,
              category: 'DEVOLUCION',
              financialType: 'Variable',
              accountId: refund.accountId,
              referenceId: refund.reference
          });
      });

      const newCN = {
          id: 'NC-' + Date.now(),
          originalSaleId,
          date, time,
          itemsToReturn,
          totalRefund,
          breakdown,
          user,
          branchId: currentBranchId
      };
      setCreditNotes(prev => [newCN, ...prev]);
  };

  // --- CART HELPERS ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);

  const handleSwitchBranch = (id: string) => setCurrentBranchId(id);
  const handleCreateBranch = (name: string, address: string) => {
      const newBranch: Branch = { id: 'BR-' + Date.now(), name, address, isMain: false };
      setBranches([...branches, newBranch]);
  };

  if (!session) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        users={users}
        tenants={tenants}
        heroImage={heroImage}
        featureImage={featureImage}
        videoTutorials={videoTutorials}
        onResetPassword={(uid, pass) => alert("Funcionalidad de reset no implementada en demo.")}
      />
    );
  }

  return (
    <Layout
      companyName={session.businessName}
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
      onCreateBranch={handleCreateBranch}
    >
      {currentView === ViewState.DASHBOARD && <Dashboard onNavigate={setCurrentView} session={session} cashMovements={cashMovements.filter(m => m.branchId === currentBranchId)} clients={clients} services={services.filter(s => s.branchId === currentBranchId)} products={products} navStructure={navStructure} />}
      {currentView === ViewState.SUPER_ADMIN_DASHBOARD && <SuperAdminModule tenants={tenants} onAddTenant={(t, u) => { setTenants([...tenants, t]); setUsers([...users, u]); }} onUpdateTenant={(id, upd, pass) => { setTenants(tenants.map(t => t.id === id ? { ...t, ...upd } : t)); if(pass) { const u = users.find(us => us.companyName === tenants.find(t=>t.id===id)?.companyName); if(u) setUsers(users.map(us=>us.id===u.id?{...us, password:pass}:us)); }}} onDeleteTenant={id => setTenants(tenants.filter(t => t.id !== id))} onResetTenantData={() => alert("Wipe data simulated")} videoTutorials={videoTutorials} onAddVideo={v => setVideoTutorials([...videoTutorials, v])} onUpdateVideo={v => setVideoTutorials(videoTutorials.map(vt => vt.id === v.id ? v : vt))} onDeleteVideo={id => setVideoTutorials(videoTutorials.filter(v => v.id !== id))} />}
      
      {currentView === ViewState.POS && <SalesModule products={products} clients={clients} categories={categories} purchasesHistory={purchasesHistory} stockMovements={stockMovements} bankAccounts={bankAccounts} onAddClient={addClient} onProcessSale={processSale} cart={cart} setCart={setCart} client={client} setClient={setClient} quotations={quotations} onLoadQuotation={q => { setCart(q.items); setClient(clients.find(c => c.name === q.clientName) || null); }} onAddQuotation={q => setQuotations([...quotations, q])} onAddPresale={p => setPresales([...presales, p])} systemBaseCurrency={session.baseCurrency} branches={branches} globalStocks={{}} presales={presales} currentBranchId={currentBranchId} locations={locations} onNavigate={setCurrentView} />}
      {currentView === ViewState.PURCHASES && <PurchaseModule products={products} suppliers={suppliers} categories={categories} bankAccounts={bankAccounts} onAddSupplier={addSupplier} locations={locations} onProcessPurchase={processPurchase} systemBaseCurrency={session.baseCurrency} />}
      {currentView === ViewState.INVENTORY && <InventoryModule products={products} brands={brands} categories={categories} onUpdateProduct={updateProduct} onAddProduct={addProduct} onAddProducts={ps => setProducts([...ps, ...products])} onDeleteProduct={deleteProduct} onNavigate={setCurrentView} salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} />}
      {currentView === ViewState.INVENTORY_ADJUSTMENT && <InventoryAdjustmentModule products={products} salesHistory={salesHistory} onProcessInventorySession={(s) => { setInventorySessions([s, ...inventorySessions]); if(s.status === 'ADJUSTED') s.items.forEach(i => { const p = products.find(prod => prod.id === i.productId); if(p) updateProduct({...p, stock: i.physicalCount}); }); }} sessionUser={session.user.fullName} history={inventorySessions} />}
      {currentView === ViewState.SERVICES && <ServicesModule services={services.filter(s => s.branchId === currentBranchId)} products={products} categories={categories} bankAccounts={bankAccounts} onAddService={handleAddService} onFinalizeService={(id, cost, status, breakdown) => setServices(prev => prev.map(s => s.id === id ? { ...s, cost, status } : s))} onMarkRepaired={id => setServices(prev => prev.map(s => s.id === id ? { ...s, status: 'Reparado' } : s))} clients={clients} onAddClient={addClient} onOpenWhatsApp={() => {}} locations={locations} currentBranchId={currentBranchId} />}
      {currentView === ViewState.CLIENTS && <ClientsModule clients={clients} onAddClient={addClient} locations={locations} />}
      {currentView === ViewState.CASH && <CashModule movements={cashMovements.filter(m => m.branchId === currentBranchId)} salesHistory={salesHistory} purchasesHistory={purchasesHistory} onAddMovement={handleAddCashMovement} bankAccounts={bankAccounts} onUniversalTransfer={(from, to, amount, rate, ref, op) => handleInitiateCashTransfer(from, to, amount, rate, ref, op, currentBranchId)} fixedExpenseCategories={fixedExpenses} fixedIncomeCategories={fixedIncome} onAddFixedCategory={(cat, type) => type === 'Ingreso' ? setFixedIncome([...fixedIncome, cat]) : setFixedExpenses([...fixedExpenses, cat])} isCashBoxOpen={isCashBoxOpen} lastClosingCash={lastClosingCash} onOpenCashBox={handleOpenCashBox} onCloseCashBox={handleCloseCashBox} systemBaseCurrency={session.baseCurrency} currentSession={currentSession} currentBranchId={currentBranchId} />}
      {currentView === ViewState.CASH_TRANSFERS && <CashTransferModule bankAccounts={bankAccounts} movements={cashMovements} requests={cashTransferRequests} branches={branches} currentBranchId={currentBranchId} onInitiateTransfer={handleInitiateCashTransfer} onConfirmTransfer={handleConfirmCashTransfer} onRejectTransfer={handleRejectCashTransfer} systemBaseCurrency={session.baseCurrency} isCashBoxOpen={isCashBoxOpen} />}
      {currentView === ViewState.CASH_BOX_HISTORY && <CashBoxHistoryModule sessions={cashSessions.filter(s => s.branchId === currentBranchId)} bankAccounts={bankAccounts} />}
      {currentView === ViewState.BANK_ACCOUNTS && <BankAccountsModule bankAccounts={bankAccounts} onAddBankAccount={b => setBankAccounts([...bankAccounts, b])} onUpdateBankAccount={b => setBankAccounts(bankAccounts.map(x => x.id === b.id ? b : x))} onDeleteBankAccount={id => setBankAccounts(bankAccounts.filter(b => b.id !== id))} onUniversalTransfer={(from, to, amount, rate, ref, op) => handleInitiateCashTransfer(from, to, amount, rate, ref, op, currentBranchId)} />}
      {currentView === ViewState.BANK_HISTORY && <BankHistoryModule cashMovements={cashMovements} bankAccounts={bankAccounts} />}
      {currentView === ViewState.CLIENT_WALLET && <ClientWalletModule clients={clients} locations={locations} onUpdateClientBalance={(id, amount, reason) => setClients(clients.map(c => c.id === id ? { ...c, digitalBalance: c.digitalBalance + amount } : c))} onAddClient={addClient} />}
      {currentView === ViewState.SALES_REPORT && <SalesReportModule salesHistory={salesHistory.filter(s => s.branchId === currentBranchId)} />}
      {currentView === ViewState.PROFIT_REPORT && <ProfitReportModule salesHistory={salesHistory.filter(s => s.branchId === currentBranchId)} cashMovements={cashMovements.filter(m => m.branchId === currentBranchId)} products={products} />}
      {currentView === ViewState.INVENTORY_AUDIT && <InventoryAuditModule history={inventorySessions} products={products} />}
      {currentView === ViewState.BUSINESS_EVOLUTION && <BusinessEvolutionModule products={products} clients={clients} movements={cashMovements.filter(m => m.branchId === currentBranchId)} />}
      {currentView === ViewState.FINANCIAL_STRATEGY && <FinancialStrategyModule products={products} salesHistory={salesHistory} cashMovements={cashMovements.filter(m => m.branchId === currentBranchId)} onAddCashMovement={handleAddCashMovement} />}
      {currentView === ViewState.HISTORY_QUERIES && <HistoryQueries salesHistory={salesHistory.filter(s => s.branchId === currentBranchId)} purchasesHistory={purchasesHistory.filter(p => p.branchId === currentBranchId)} stockMovements={stockMovements.filter(s => s.branchId === currentBranchId)} cashMovements={cashMovements.filter(m => m.branchId === currentBranchId)} initialTab="ventas" />}
      {currentView === ViewState.CREDIT_NOTE && <CreditNoteModule salesHistory={salesHistory} onProcessCreditNote={onProcessCreditNote} bankAccounts={bankAccounts} />}
      {currentView === ViewState.BRANCH_MANAGEMENT && <BranchManagementModule branches={branches} onAddBranch={(n, a, p) => setBranches([...branches, {id: 'BR-'+Date.now(), name: n, address: a, phone: p, isMain: false}])} onUpdateBranch={b => setBranches(branches.map(x => x.id === b.id ? b : x))} onDeleteBranch={id => setBranches(branches.filter(b => b.id !== id))} onCloneBranch={() => {}} onSwitchBranch={handleSwitchBranch} currentBranchId={currentBranchId} />}
      {currentView === ViewState.COMPANY_PROFILE && <CompanyProfileModule companyName={session.businessName} onUpdateCompanyName={n => setSession({...session, businessName: n})} companyLogo={companyLogo} onUpdateLogo={setCompanyLogo} baseCurrency={session.baseCurrency} onUpdateBaseCurrency={c => setSession({...session, baseCurrency: c})} />}
      {currentView === ViewState.GATEWAY_CONFIG && <GatewayConfigModule />}
      {currentView === ViewState.USER_PRIVILEGES && <UserPrivilegesModule users={users} onAddUser={u => setUsers([...users, u])} onUpdateUser={u => setUsers(users.map(x => x.id === u.id ? u : x))} onDeleteUser={id => setUsers(users.filter(u => u.id !== id))} />}
      {currentView === ViewState.SYSTEM_DIAGNOSTICS && <SystemDiagnosticsModule products={products} cashMovements={cashMovements} stockMovements={stockMovements} onAddCashMovement={handleAddCashMovement} onAddProduct={addProduct} onProcessSale={processSale} onProcessPurchase={processPurchase} onProcessCreditNote={onProcessCreditNote} onAddService={handleAddService} currentBranchId={currentBranchId} />}
      {currentView === ViewState.MEDIA_EDITOR && <MediaEditorModule onUpdateHeroImage={setHeroImage} onUpdateFeatureImage={setFeatureImage} />}
      {currentView === ViewState.CONFIG_PRINTER && <PrintConfigModule />}
      {currentView === ViewState.DATABASE_CONFIG && <DatabaseModule isSyncEnabled={isSyncEnabled} data={{ products, clients, movements: cashMovements, sales: salesHistory, services, suppliers, brands, categories, bankAccounts }} onSyncDownload={(d) => { if(d.products) setProducts(d.products); if(d.clients) setClients(d.clients); if(d.sales) setSalesHistory(d.sales); if(d.movements) setCashMovements(d.movements); if(d.services) setServices(d.services); if(d.suppliers) setSuppliers(d.suppliers); if(d.brands) setBrands(d.brands); if(d.categories) setCategories(d.categories); if(d.bankAccounts) setBankAccounts(d.bankAccounts); }} />}
      {currentView === ViewState.WAREHOUSE_TRANSFER && <WarehouseTransferModule branches={branches} currentBranchId={currentBranchId} products={products} onProcessTransfer={t => setWarehouseTransfers([...warehouseTransfers, t])} onConfirmTransfer={t => { 
          // 1. Aumentar stock en destino
          t.items.forEach(i => {
              const p = products.find(prod => prod.id === i.productId);
              if(p) { updateProduct({...p, stock: p.stock + i.quantity}); setStockMovements(prev => [...prev, { id: 'TR-IN-'+Math.random(), branchId: t.toBranchId, date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(), productId: p.id, productName: p.name, type: 'ENTRADA', quantity: i.quantity, currentStock: p.stock + i.quantity, reference: `TRASPASO DE ${t.fromBranchName}`, user: session.user.fullName }]); }
          });
          setWarehouseTransfers(warehouseTransfers.map(x => x.id === t.id ? { ...x, status: 'COMPLETED' } : x));
          alert("Recepción confirmada. Inventario actualizado.");
      }} onRejectTransfer={t => setWarehouseTransfers(warehouseTransfers.map(x => x.id === t.id ? { ...x, status: 'REJECTED' } : x))} history={warehouseTransfers} quotations={presales} />}
      {currentView === ViewState.SUPPLIERS && <SuppliersModule suppliers={suppliers} onAddSupplier={addSupplier} onDeleteSupplier={deleteSupplier} purchasesHistory={purchasesHistory} />}
      {currentView === ViewState.MANAGE_RESOURCES && <ResourceManagement brands={brands} onAddBrand={b => setBrands([...brands, b])} onDeleteBrand={id => setBrands(brands.filter(b => b.id !== id))} categories={categories} onAddCategory={c => setCategories([...categories, c])} onDeleteCategory={id => setCategories(categories.filter(c => c.id !== id))} />}
      {currentView === ViewState.LOCATIONS && <LocationsModule locations={locations} onAddLocation={l => setLocations([...locations, l])} onDeleteLocation={id => setLocations(locations.filter(l => l.id !== id))} onResetLocations={() => setLocations(MOCK_LOCATIONS)} />}
      {currentView === ViewState.WHATSAPP && <WhatsAppModule products={products} clients={clients} chats={chats} setChats={setChats} />}
      {currentView === ViewState.QUOTATIONS && <QuotationModule quotations={quotations} onLoadQuotation={q => { setCart(q.items); setClient(clients.find(c => c.name === q.clientName) || null); setCurrentView(ViewState.POS); }} onDeleteQuotation={id => setQuotations(quotations.filter(q => q.id !== id))} />}
      {currentView === ViewState.PRESALES && <PresaleModule presales={presales} onLoadPresale={p => { setCart(p.items); setClient(clients.find(c => c.name === p.clientName) || null); setCurrentView(ViewState.POS); }} onDeletePresale={id => setPresales(presales.filter(p => p.id !== id))} products={products} clients={clients} categories={categories} purchasesHistory={purchasesHistory} stockMovements={stockMovements} bankAccounts={bankAccounts} locations={locations} onAddClient={addClient} onAddPresale={p => setPresales([...presales, p])} systemBaseCurrency={session.baseCurrency} branches={branches} globalStocks={{}} currentBranchId={currentBranchId} quotations={quotations} onAddQuotation={q => setQuotations([...quotations, q])} />}
      {currentView === ViewState.FIXED_EXPENSES && <FinanceManagerModule activeTab="EXPENSES" categories={fixedExpenses} onAddCategory={c => setFixedExpenses([...fixedExpenses, c])} onDeleteCategory={c => setFixedExpenses(fixedExpenses.filter(x => x !== c))} />}
      {currentView === ViewState.FIXED_INCOME && <FinanceManagerModule activeTab="INCOME" categories={fixedIncome} onAddCategory={c => setFixedIncome([...fixedIncome, c])} onDeleteCategory={c => setFixedIncome(fixedIncome.filter(x => x !== c))} />}
      {currentView === ViewState.PURCHASES_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="compras" />}
      {currentView === ViewState.INGRESOS_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="ingresos" />}
      {currentView === ViewState.EGRESOS_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="egresos" />}
      {currentView === ViewState.KARDEX_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="kardex" products={products} />}
      {currentView === ViewState.CREDIT_NOTE_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="notas_credito" />}
      {currentView === ViewState.PRODUCT_HISTORY_HISTORY && <HistoryQueries salesHistory={salesHistory} purchasesHistory={purchasesHistory} stockMovements={stockMovements} cashMovements={cashMovements} initialTab="historial_producto" products={products} />}
    </Layout>
  );
}
