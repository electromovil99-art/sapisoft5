
import { ViewState } from './types';
import { 
  ShoppingCart, Package, Wrench, 
  Wallet, Users, Activity, ShoppingBag, FolderCog, FileSearch, Truck, Landmark, BrainCircuit, 
  Printer, Shield, FileMinus, CreditCard, Map, MessageCircle,
  Database, Settings, BarChart3, ClipboardList, FileScan, FileBarChart, PieChart, Image as ImageIcon, History, Menu,
  TrendingDown, TrendingUp, Building2, Bug, ShieldCheck, SearchCode, Settings2, Zap, Store, ArrowRightLeft, Clock
} from 'lucide-react';

export const INITIAL_NAV_STRUCTURE = [
  {
    id: 'comercial',
    label: 'Comercial',
    icon: ShoppingCart,
    enabled: true,
    items: [
      { view: ViewState.POS, label: 'Ventas', icon: ShoppingCart, enabled: true },
      { view: ViewState.QUOTATIONS, label: 'Cotizaciones', icon: ClipboardList, enabled: true },
      { view: ViewState.PRESALES, label: 'Preventas', icon: Clock, enabled: true }, // NEW
      { view: ViewState.SERVICES, label: 'Servicio Técnico', icon: Wrench, enabled: true },
      { view: ViewState.CLIENTS, label: 'Clientes', icon: Users, enabled: true },
      { view: ViewState.CREDIT_NOTE, label: 'Nota de Crédito', icon: FileMinus, enabled: true },
      { view: ViewState.WHATSAPP, label: 'WhatsApp', icon: MessageCircle, enabled: true }, 
    ]
  },
  {
    id: 'logistica',
    label: 'Logística',
    icon: Package,
    enabled: true,
    items: [
      { view: ViewState.INVENTORY, label: 'Inventario', icon: Package, enabled: true },
      { view: ViewState.INVENTORY_ADJUSTMENT, label: 'Toma Inventario', icon: FileScan, enabled: true },
      { view: ViewState.PURCHASES, label: 'Compras', icon: ShoppingBag, enabled: true },
      { view: ViewState.WAREHOUSE_TRANSFER, label: 'Traspasos', icon: ArrowRightLeft, enabled: true },
      { view: ViewState.SUPPLIERS, label: 'Proveedores', icon: Truck, enabled: true },
      { view: ViewState.MANAGE_RESOURCES, label: 'Marcas y Cat.', icon: FolderCog, enabled: true },
      { view: ViewState.LOCATIONS, label: 'Lugares / Ubigeo', icon: Map, enabled: true }, 
    ]
  },
  {
    id: 'finanzas',
    label: 'Finanzas',
    icon: Wallet,
    enabled: true,
    items: [
      { view: ViewState.CASH, label: 'Caja', icon: Wallet, enabled: true },
      { view: ViewState.CASH_TRANSFERS, label: 'Traspasos Efectivo', icon: ArrowRightLeft, enabled: true },
      { view: ViewState.CASH_BOX_HISTORY, label: 'Historial Cajas', icon: History, enabled: true },
      { view: ViewState.BANK_ACCOUNTS, label: 'Bancos', icon: Landmark, enabled: true },
      { view: ViewState.BANK_HISTORY, label: 'Mov. Bancarios', icon: FileSearch, enabled: true },
      { view: ViewState.CLIENT_WALLET, label: 'Billeteras', icon: CreditCard, enabled: true },
      { view: ViewState.FIXED_EXPENSES, label: 'Gastos Fijos', icon: TrendingDown, enabled: true },
      { view: ViewState.FIXED_INCOME, label: 'Ingresos Fijos', icon: TrendingUp, enabled: true },
    ]
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    enabled: true,
    items: [
      { view: ViewState.SALES_REPORT, label: 'Ventas', icon: TrendingUp, enabled: true },
      { view: ViewState.PROFIT_REPORT, label: 'Utilidades', icon: PieChart, enabled: true },
      { view: ViewState.INVENTORY_AUDIT, label: 'Auditoría IA', icon: ShieldCheck, enabled: true },
      { view: ViewState.BUSINESS_EVOLUTION, label: 'Evolución', icon: Activity, enabled: true },
      { view: ViewState.FINANCIAL_STRATEGY, label: 'Estrategia IA', icon: BrainCircuit, enabled: true },
    ]
  },
  {
    id: 'consultas',
    label: 'Consultas',
    icon: FileSearch,
    enabled: true,
    items: [
      { view: ViewState.HISTORY_QUERIES, label: 'H. Ventas', icon: ShoppingCart, enabled: true },
      { view: ViewState.PURCHASES_HISTORY, label: 'H. Compras', icon: ShoppingBag, enabled: true },
      { view: ViewState.INGRESOS_HISTORY, label: 'Ingresos', icon: TrendingUp, enabled: true },
      { view: ViewState.EGRESOS_HISTORY, label: 'Gastos', icon: TrendingDown, enabled: true },
      { view: ViewState.PRODUCT_HISTORY_HISTORY, label: 'H. Product', icon: SearchCode, enabled: true },
      { view: ViewState.CREDIT_NOTE_HISTORY, label: 'H. Nota de Credit', icon: FileMinus, enabled: true }, 
      { view: ViewState.KARDEX_HISTORY, label: 'Kardex (Stock)', icon: Package, enabled: true }
    ]
  },
  {
    id: 'configuracion',
    label: 'Config.',
    icon: Settings,
    enabled: true,
    items: [
      { view: ViewState.BRANCH_MANAGEMENT, label: 'Sucursales', icon: Store, enabled: true },
      { view: ViewState.COMPANY_PROFILE, label: 'Perfil de Empresa', icon: Building2, enabled: true },
      { view: ViewState.GATEWAY_CONFIG, label: 'Pasarelas Pago', icon: Zap, enabled: true },
      { view: ViewState.USER_PRIVILEGES, label: 'Usuarios', icon: Shield, enabled: true },
      { view: ViewState.SYSTEM_DIAGNOSTICS, label: 'Diagnóstico Sistema', icon: Bug, enabled: true },
      { view: ViewState.MEDIA_EDITOR, label: 'Multimedia', icon: ImageIcon, enabled: true },
      { view: ViewState.CONFIG_PRINTER, label: 'Impresoras', icon: Printer, enabled: true },
      { view: ViewState.DATABASE_CONFIG, label: 'Base de Datos', icon: Database, enabled: true },
    ]
  }
];
