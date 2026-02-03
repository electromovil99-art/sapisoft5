
import { ViewState } from './types';
import { 
  ShoppingCart, Package, Wrench, 
  Wallet, Users, Activity, ShoppingBag, FolderCog, FileSearch, Truck, Landmark, BrainCircuit, 
  Printer, Shield, FileMinus, CreditCard, Map, MessageCircle,
  Database, Settings, BarChart3, ClipboardList, FileScan, FileBarChart, PieChart, Image as ImageIcon, History, Menu,
  TrendingDown, TrendingUp, Building2, Bug, ShieldCheck, SearchCode, Settings2, Zap, Store, ArrowRightLeft, Clock, KanbanSquare, HandCoins, Landmark as LandmarkIcon
} from 'lucide-react';

export const INITIAL_NAV_STRUCTURE = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: ShoppingCart,
    enabled: true,
    items: [
      { view: ViewState.POS, label: 'Ventas', icon: ShoppingCart, enabled: true },
      { view: ViewState.ACCOUNTS_RECEIVABLE, label: 'CX Cobrar', icon: HandCoins, enabled: true },
      { view: ViewState.ACCOUNTS_PAYABLE, label: 'CX Pagar', icon: LandmarkIcon, enabled: true },
      { view: ViewState.QUOTATIONS, label: 'Cotizaciones', icon: ClipboardList, enabled: true },
      { view: ViewState.PRESALES, label: 'Preventas', icon: Clock, enabled: true },
      { view: ViewState.SERVICES, label: 'Serv. Tec', icon: Wrench, enabled: true },
      { view: ViewState.CLIENTS, label: 'Clientes', icon: Users, enabled: true },
      { view: ViewState.CREDIT_NOTE, label: 'N. de Credit', icon: FileMinus, enabled: true },
      { view: ViewState.WHATSAPP, label: 'WhatsApp', icon: MessageCircle, enabled: true },
      { view: ViewState.CRM, label: 'CRM', icon: KanbanSquare, enabled: true },
    ]
  },
  {
    id: 'logistica',
    label: 'Logística',
    icon: Package,
    enabled: true,
    items: [
      { view: ViewState.INVENTORY, label: 'Inventario', icon: Package, enabled: true },
      { view: ViewState.PURCHASES, label: 'Compras', icon: ShoppingBag, enabled: true },
      { view: ViewState.WAREHOUSE_TRANSFER, label: 'Transferencias', icon: ArrowRightLeft, enabled: true },
      { view: ViewState.SUPPLIERS, label: 'Proveedores', icon: Truck, enabled: true },
      { view: ViewState.LOCATIONS, label: 'Ubicaciones', icon: Map, enabled: true },
      { view: ViewState.MANAGE_RESOURCES, label: 'Recursos', icon: FolderCog, enabled: true },
      { view: ViewState.INVENTORY_ADJUSTMENT, label: 'Ajuste Inv.', icon: Settings2, enabled: true },
      { view: ViewState.INVENTORY_AUDIT, label: 'Auditoría', icon: ShieldCheck, enabled: true },
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: Wallet,
    enabled: true,
    items: [
      { view: ViewState.CASH, label: 'Caja Chica', icon: Wallet, enabled: true },
      { view: ViewState.CASH_TRANSFERS, label: 'Transf. Caja', icon: ArrowRightLeft, enabled: true },
      { view: ViewState.BANK_ACCOUNTS, label: 'Ctas. Banco', icon: Landmark, enabled: true },
      { view: ViewState.BANK_HISTORY, label: 'Mov. Banco', icon: History, enabled: true },
      { view: ViewState.FINANCIAL_STRATEGY, label: 'Estrategia', icon: BrainCircuit, enabled: true },
      { view: ViewState.CLIENT_WALLET, label: 'Billetera Cli.', icon: CreditCard, enabled: true },
    ]
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    enabled: true,
    items: [
      { view: ViewState.SALES_REPORT, label: 'Rep. Ventas', icon: TrendingUp, enabled: true },
      { view: ViewState.PROFIT_REPORT, label: 'Utilidades', icon: PieChart, enabled: true },
      { view: ViewState.BUSINESS_EVOLUTION, label: 'Evolución', icon: Activity, enabled: true },
      { view: ViewState.CASH_BOX_HISTORY, label: 'Hist. Cajas', icon: History, enabled: true },
    ]
  },
  {
    id: 'consultas',
    label: 'Historial',
    icon: FileSearch,
    enabled: true,
    items: [
      { view: ViewState.HISTORY_QUERIES, label: 'Movimientos', icon: FileSearch, enabled: true },
      { view: ViewState.PURCHASES_HISTORY, label: 'H. Compras', icon: ShoppingBag, enabled: true },
      { view: ViewState.INGRESOS_HISTORY, label: 'H. Ingresos', icon: TrendingUp, enabled: true },
      { view: ViewState.EGRESOS_HISTORY, label: 'H. Egresos', icon: TrendingDown, enabled: true },
      { view: ViewState.PRODUCT_HISTORY_HISTORY, label: 'H. Producto', icon: SearchCode, enabled: true },
      { view: ViewState.KARDEX_HISTORY, label: 'Kardex', icon: Package, enabled: true },
      { view: ViewState.CREDIT_NOTE_HISTORY, label: 'H. Notas Cre.', icon: FileMinus, enabled: true },
    ]
  },
  {
    id: 'configuracion',
    label: 'Ajustes',
    icon: Settings,
    enabled: true,
    items: [
      { view: ViewState.COMPANY_PROFILE, label: 'Empresa', icon: Building2, enabled: true },
      { view: ViewState.USER_PRIVILEGES, label: 'Usuarios', icon: Users, enabled: true },
      { view: ViewState.CONFIG_PRINTER, label: 'Impresión', icon: Printer, enabled: true },
      { view: ViewState.DATABASE_CONFIG, label: 'Base Datos', icon: Database, enabled: true },
      { view: ViewState.MEDIA_EDITOR, label: 'Multimedia', icon: ImageIcon, enabled: true },
      { view: ViewState.SYSTEM_DIAGNOSTICS, label: 'Diagnóstico', icon: Bug, enabled: true },
      { view: ViewState.GATEWAY_CONFIG, label: 'Pasarelas', icon: Zap, enabled: true },
      { view: ViewState.BRANCH_MANAGEMENT, label: 'Sucursales', icon: Store, enabled: true },
    ]
  }
];
