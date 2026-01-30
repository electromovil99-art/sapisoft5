
import React, { useMemo, useState } from 'react';
import { 
  ShoppingCart, Users, Wrench, Target, TrendingUp, 
  ArrowRight, Grid, LayoutDashboard, Smartphone, 
  MessageCircle, ArrowUpRight, Wallet, Receipt, Package, DollarSign,
  Box, Truck, BarChart3, Settings, Shield, FileText, ChevronLeft, FolderOpen
} from 'lucide-react';
import { ViewState, AuthSession, CashMovement, Client, ServiceOrder, Product } from '../types';

interface DashboardProps {
  onNavigate: (view: ViewState) => void;
  session?: AuthSession | null;
  cashMovements: CashMovement[];
  clients: Client[];
  services: ServiceOrder[];
  products: Product[]; 
  navStructure: any[]; 
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, session, cashMovements = [], services = [], clients = [], products = [], navStructure = [] }) => {
  const userName = session?.user.fullName || 'Usuario';
  const businessName = session?.businessName || 'SapiSoft ERP';
  const dailyGoal = 2000.00;
  
  // Estado para manejar la navegación por carpetas en móvil
  const [activeMobileCategory, setActiveMobileCategory] = useState<string | null>(null);

  // --- CÁLCULOS DE MÉTRICAS ---
  const stats = useMemo(() => {
      const today = new Date().toLocaleDateString('es-PE');
      
      const movementsToday = cashMovements.filter(m => m.date === today);
      const salesTodayAmount = movementsToday
          .filter(m => m.type === 'Ingreso' && (m.category === 'VENTA' || m.concept.toUpperCase().includes('VENTA')))
          .reduce((acc, m) => acc + m.amount, 0);
      
      const salesCountToday = movementsToday.filter(m => m.type === 'Ingreso' && m.category === 'VENTA').length;
      const pendingServices = services.filter(s => s.status === 'Pendiente').length;
      const repairedServices = services.filter(s => s.status === 'Reparado').length;
      const totalClients = clients.length;
      const totalReceivables = clients.reduce((acc, c) => acc + (c.creditUsed || 0), 0);

      const mySalesToday = movementsToday
          .filter(m => m.user === session?.user.fullName && m.type === 'Ingreso' && (m.category === 'VENTA' || m.concept.toUpperCase().includes('VENTA')))
          .reduce((acc, m) => acc + m.amount, 0);

      return { 
          salesTodayAmount, 
          salesCountToday, 
          pendingServices, 
          repairedServices, 
          totalClients, 
          totalReceivables,
          mySalesToday
      };
  }, [cashMovements, services, clients, session?.user.fullName]);

  const goalProgress = Math.min(100, (stats.mySalesToday / dailyGoal) * 100);

  // Helper para colores de iconos estilo iOS
  const getCategoryColor = (catId: string) => {
      switch(catId) {
          case 'comercial': return 'bg-blue-500 shadow-blue-500/30';
          case 'logistica': return 'bg-orange-500 shadow-orange-500/30';
          case 'finanzas': return 'bg-emerald-500 shadow-emerald-500/30';
          case 'reportes': return 'bg-indigo-500 shadow-indigo-500/30';
          case 'consultas': return 'bg-violet-500 shadow-violet-500/30';
          case 'configuracion': return 'bg-slate-500 shadow-slate-500/30';
          default: return 'bg-slate-500';
      }
  };

  // Obtener la categoría activa para la vista de detalle móvil
  const activeCategoryData = useMemo(() => {
      return navStructure.find(c => c.id === activeMobileCategory);
  }, [activeMobileCategory, navStructure]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500 pb-20 md:pb-6">
      
      {/* --- VISTA MÓVIL (SIMPLIFICADA POR ÁREAS) --- */}
      <div className="md:hidden flex flex-col gap-6 pt-2 px-2">
          {/* Header Móvil - Solo visible en nivel superior */}
          {!activeMobileCategory && (
              <>
                <div className="flex justify-between items-end px-2">
                    <div>
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-0.5">{new Date().toLocaleDateString('es-PE', {weekday: 'long', day: 'numeric'})}</p>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Hola, {userName.split(' ')[0]}</h1>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-sm">
                        <div className="w-full h-full flex items-center justify-center text-slate-500 font-black text-sm">
                            {userName.charAt(0)}
                        </div>
                    </div>
                </div>

                {/* Widget de Estado Rápido */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar px-1 py-2">
                    <div className="min-w-[130px] bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-20">
                        <div className="flex items-center gap-2 text-emerald-500"><DollarSign size={14}/> <span className="text-[9px] font-black uppercase text-slate-400">Ventas</span></div>
                        <div className="text-lg font-black text-slate-800 dark:text-white">S/ {stats.salesTodayAmount.toFixed(0)}</div>
                    </div>
                    <div className="min-w-[130px] bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col justify-between h-20">
                        <div className="flex items-center gap-2 text-orange-500"><Wrench size={14}/> <span className="text-[9px] font-black uppercase text-slate-400">Taller</span></div>
                        <div className="text-lg font-black text-slate-800 dark:text-white">{stats.pendingServices} <span className="text-[10px] text-slate-400">Pend.</span></div>
                    </div>
                </div>
              </>
          )}

          {/* ÁREA DE NAVEGACIÓN */}
          <div className="flex-1 px-1">
              {!activeMobileCategory ? (
                  // NIVEL 1: CATEGORÍAS (CARPETAS)
                  <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Áreas de Trabajo</h3>
                      <div className="grid grid-cols-4 gap-y-6 gap-x-4">
                          {navStructure.filter(c => c.enabled).map(cat => {
                              const CatIcon = cat.icon;
                              return (
                                  <button 
                                      key={cat.id}
                                      onClick={() => setActiveMobileCategory(cat.id)}
                                      className="flex flex-col items-center gap-2 active:scale-95 transition-transform group"
                                  >
                                      {/* Estilo Folder/Carpeta */}
                                      <div className={`w-[68px] h-[68px] rounded-[22px] flex items-center justify-center text-white shadow-lg ${getCategoryColor(cat.id)} bg-opacity-90 backdrop-blur-sm`}>
                                          <CatIcon size={28} strokeWidth={2} />
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
                                          {cat.label}
                                      </span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              ) : (
                  // NIVEL 2: APPS DENTRO DE LA CATEGORÍA
                  <div className="animate-in slide-in-from-right-10 duration-300">
                      <div className="flex items-center gap-2 mb-6">
                          <button 
                            onClick={() => setActiveMobileCategory(null)}
                            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-200 shadow-sm active:scale-90 transition-all"
                          >
                              <ChevronLeft size={24}/>
                          </button>
                          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                              {activeCategoryData?.label}
                          </h2>
                      </div>

                      <div className="grid grid-cols-4 gap-y-8 gap-x-4 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800 min-h-[300px] content-start">
                          {activeCategoryData?.items.filter((item: any) => item.enabled).map((item: any) => {
                              const Icon = item.icon;
                              return (
                                  <button 
                                      key={item.view}
                                      onClick={() => onNavigate(item.view)}
                                      className="flex flex-col items-center gap-2 active:scale-90 transition-transform group"
                                  >
                                      <div className="w-[60px] h-[60px] bg-white dark:bg-slate-800 rounded-[18px] flex items-center justify-center text-slate-700 dark:text-white shadow-sm border border-slate-100 dark:border-slate-700 group-hover:border-primary-200">
                                          <Icon size={26} strokeWidth={1.5} className="text-slate-600 dark:text-slate-300"/>
                                      </div>
                                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight max-w-[70px]">
                                          {item.label}
                                      </span>
                                  </button>
                              );
                          })}
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* --- VISTA ESCRITORIO / TABLET (ORIGINAL) --- */}
      <div className="hidden md:flex flex-col gap-4">
          {/* 1. HERO COMPACTO */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
              
              <div className="z-10 flex flex-col w-full md:w-auto text-center md:text-left items-center md:items-start">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-2 w-fit">
                      <LayoutDashboard size={10}/> PANEL DE CONTROL
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white leading-none tracking-tighter">
                      ¡Bienvenido, {userName.split(' ')[0]}!
                  </h2>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-bold uppercase tracking-tight mt-1">
                      Resumen de hoy en {businessName}
                  </p>
              </div>

              <div className="flex items-center gap-8 z-10 w-full md:w-auto justify-between md:justify-end">
                  <div className="flex-1 text-left md:text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mi Meta Personal</p>
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-3 justify-end">
                          <span className="text-xl md:text-2xl font-black text-primary-600">S/ {stats.mySalesToday.toFixed(2)}</span>
                          <div className="w-full md:w-24 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div className="bg-primary-600 h-full" style={{ width: `${goalProgress}%` }}></div>
                          </div>
                      </div>
                  </div>
                  <div className="relative w-14 h-14 md:w-16 md:h-16 shrink-0">
                      <svg className="w-full h-full transform -rotate-90">
                          <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-slate-700" />
                          <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * (goalProgress / 100))} strokeLinecap="round" className="text-primary-600 transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-primary-600">
                          {goalProgress.toFixed(0)}%
                      </div>
                  </div>
              </div>
          </div>

          {/* 2. GRILLA DE KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
              
              {/* VENTAS */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.HISTORY_QUERIES)}>
                  <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-xl"><DollarSign size={20}/></div>
                      <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ventas Hoy</span>
                          <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">S/ {stats.salesTodayAmount.toFixed(2)}</p>
                      </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{stats.salesCountToday} tickets</span>
                  </div>
              </div>

              {/* TALLER */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.SERVICES)}>
                  <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-xl"><Wrench size={20}/></div>
                      <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Taller</span>
                          <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats.pendingServices + stats.repairedServices}</p>
                      </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                      <div className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">P: {stats.pendingServices}</div>
                      <div className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">R: {stats.repairedServices}</div>
                  </div>
              </div>

              {/* CLIENTES */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.CLIENTS)}>
                  <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl"><Users size={20}/></div>
                      <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clientes</span>
                          <p className="text-2xl font-black text-slate-800 dark:text-white leading-none mt-1">{stats.totalClients}</p>
                      </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                      <TrendingUp size={12} className="text-emerald-500"/>
                      <span className="text-[10px] font-bold text-slate-500">Crecimiento constante</span>
                  </div>
              </div>

              {/* POR COBRAR */}
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[1.8rem] shadow-sm border border-slate-200 dark:border-slate-700 group hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onNavigate(ViewState.CLIENT_WALLET)}>
                  <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-xl"><Wallet size={20}/></div>
                      <div className="text-right">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Por Cobrar</span>
                          <p className="text-2xl font-black text-red-600 leading-none mt-1">S/ {stats.totalReceivables.toFixed(2)}</p>
                      </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1">
                      <span className="text-[10px] font-black text-red-400 uppercase tracking-tighter">Deuda clientes <ArrowRight size={10}/></span>
                  </div>
              </div>

          </div>

          {/* 3. ACCIONES RÁPIDAS - DESKTOP */}
          <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 p-5 flex flex-col grow">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Grid size={12} className="text-primary-600"/> Accesos Directos del Sistema
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => onNavigate(ViewState.POS)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-primary/40 hover:bg-white transition-all group">
                      <div className="p-2.5 bg-primary-100 text-primary-600 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all"><ShoppingCart size={18}/></div>
                      <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Venta Rápida</p></div>
                  </button>
                  <button onClick={() => onNavigate(ViewState.SERVICES)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-orange-400/40 hover:bg-white transition-all group">
                      <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all"><Smartphone size={18}/></div>
                      <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Nueva Recepción</p></div>
                  </button>
                  <button onClick={() => onNavigate(ViewState.INVENTORY)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-emerald-400/40 hover:bg-white transition-all group">
                      <div className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all"><Package size={18}/></div>
                      <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">Inventario</p></div>
                  </button>
                  <button onClick={() => onNavigate(ViewState.WHATSAPP)} className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] flex items-center gap-3 hover:border-indigo-400/40 hover:bg-white transition-all group">
                      <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><MessageCircle size={18}/></div>
                      <div className="text-left leading-tight"><p className="text-[11px] font-black text-slate-800 dark:text-white uppercase">WhatsApp CRM</p></div>
                  </button>
              </div>
              
              {/* BANNER INFERIOR DE ESTADO SUTIL */}
              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest gap-2">
                  <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Servidores Online</span>
                  <span>SapiSoft v4.0.2 - {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
