
import React, { useMemo, useState } from 'react';
import { ViewState, AuthSession, Branch } from '../types';
import { 
  LayoutDashboard, ShoppingCart, Package, Wrench, 
  Wallet, Users, Activity, ShoppingBag, FolderCog, FileSearch, Truck, Landmark, Moon, Sun,
  LogOut, Bell, TrendingUp, X, Cloud, RefreshCw, Smartphone, Tablet, Monitor, Store, Plus, ChevronDown, CheckCircle2
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  companyName: string;
  companyLogo: string | null;
  navStructure: any[];
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  session: AuthSession; 
  onLogout: () => void; 
  isSyncEnabled: boolean;
  toggleSyncMode: () => void;
  branches: Branch[];
  currentBranchId: string;
  onSwitchBranch: (id: string) => void;
  onCreateBranch: (name: string, address: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, companyName, companyLogo, navStructure, currentView, 
  onNavigate, isDarkMode, toggleTheme, session, onLogout, 
  isSyncEnabled, toggleSyncMode, branches, currentBranchId, onSwitchBranch, onCreateBranch
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showBranchMenu, setShowBranchMenu] = useState(false);
  
  const isSuperAdmin = session?.user.role === 'SUPER_ADMIN';
  const isGlobalView = currentView === ViewState.SUPER_ADMIN_DASHBOARD;
  const isDashboard = currentView === ViewState.DASHBOARD;

  const currentBranch = branches.find(b => b.id === currentBranchId);

  const activeCategory = useMemo(() => {
    if (currentView === ViewState.DASHBOARD || currentView === ViewState.SUPER_ADMIN_DASHBOARD) return null;
    return navStructure.find(cat => 
      cat.items?.some((item: any) => item.view === currentView)
    );
  }, [currentView, navStructure]);

  const handleSyncClick = () => {
    setIsSyncing(true);
    toggleSyncMode();
    setTimeout(() => setIsSyncing(false), 2000);
  };

  return (
    <div className={`flex flex-col h-screen w-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden transition-colors duration-300 font-sans ${isDarkMode ? 'dark' : ''}`}>
      
      {/* 1. HEADER INTEGRADO */}
      <header className="relative shrink-0 z-[150] px-2 md:px-3 pt-2 md:pt-3 pb-1">
         <div className={`max-w-[1920px] mx-auto transition-all duration-500 rounded-2xl md:rounded-3xl shadow-2xl border border-white/10 backdrop-blur-2xl h-12 md:h-14 flex items-center px-2 md:px-4 relative overflow-visible ${isGlobalView ? 'bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900' : 'bg-gradient-to-r from-indigo-800 via-primary to-purple-900 dark:from-slate-950 dark:to-slate-900'}`}>
            
            {/* Logo y Branding */}
            <div className="flex items-center shrink-0 pr-2 md:pr-4 mr-2 border-r border-white/10">
                <button 
                    onClick={() => onNavigate(isSuperAdmin ? ViewState.SUPER_ADMIN_DASHBOARD : ViewState.DASHBOARD)} 
                    className="flex items-center gap-2 md:gap-3 group transition-all active:scale-95"
                >
                    <div className={`w-7 h-7 md:w-9 md:h-9 rounded-xl flex items-center justify-center border backdrop-blur-md transition-all shadow-inner ${isGlobalView ? 'bg-amber-500/20 border-amber-500/40' : 'bg-white/20 border-white/30'}`}>
                       {companyLogo ? (
                         <img src={companyLogo} alt="Logo" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                       ) : (
                         <span className="font-black text-base md:text-xl leading-none text-white">S</span>
                       )}
                    </div>
                    <div className="flex flex-col text-left hidden sm:flex">
                       <h1 className="font-black text-white text-[11px] leading-none tracking-tighter uppercase drop-shadow-md truncate max-w-[100px] md:max-w-none">
                           {isGlobalView ? 'SapiSoft Master' : companyName}
                       </h1>
                       <span className="text-[7px] font-black tracking-[0.2em] text-white/50 uppercase">
                           {isGlobalView ? 'Platform Control' : 'Cloud ERP System'}
                       </span>
                    </div>
                </button>
            </div>

            {/* Selector de Sucursal (Destacado) */}
            {!isGlobalView && (
              <div className="relative mr-2 md:mr-4 group shrink-0">
                <button 
                  onClick={() => setShowBranchMenu(!showBranchMenu)}
                  className="flex items-center gap-2 h-8 md:h-9 px-2 md:px-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all text-white group-hover:border-white/40"
                >
                  <div className="p-1 bg-white/20 rounded-lg"><Store size={12} className="text-white"/></div>
                  <div className="flex flex-col items-start leading-none gap-0.5">
                    <span className="text-[7px] font-bold opacity-60 uppercase tracking-widest hidden sm:block">Ubicación</span>
                    <span className="text-[10px] font-black uppercase truncate max-w-[80px] md:max-w-[120px] flex items-center gap-1">
                        {currentBranch?.name || 'Seleccionar'}
                        {currentBranch?.name.includes('(Copia)') && <span className="hidden lg:inline bg-amber-500/80 text-white text-[7px] px-1 rounded-sm">CLON</span>}
                    </span>
                  </div>
                  <ChevronDown size={12} className="opacity-60 group-hover:opacity-100 transition-opacity hidden sm:block"/>
                </button>

                {showBranchMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowBranchMenu(false)}></div>
                    <div className="absolute top-11 left-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-in slide-in-from-top-2">
                        <div className="p-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>Mis Sucursales</span>
                        <span className="bg-slate-200 dark:bg-slate-800 px-1.5 rounded text-slate-500">{branches.length}</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
                        {branches.map(b => (
                            <button
                            key={b.id}
                            onClick={() => { onSwitchBranch(b.id); setShowBranchMenu(false); }}
                            className={`w-full text-left px-3 py-2.5 flex items-center justify-between rounded-xl transition-colors mb-1 ${currentBranchId === b.id ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}
                            >
                            <div className="flex flex-col">
                                <span className="text-[11px] font-black uppercase leading-tight">{b.name}</span>
                                <span className="text-[9px] font-bold opacity-60 truncate max-w-[180px]">{b.address || 'Sin dirección'}</span>
                            </div>
                            {currentBranchId === b.id && <CheckCircle2 size={16} className="text-indigo-500"/>}
                            </button>
                        ))}
                        </div>
                        <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                        <button 
                            onClick={() => { onNavigate(ViewState.BRANCH_MANAGEMENT); setShowBranchMenu(false); }}
                            className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 rounded-xl text-[9px] font-black uppercase text-slate-600 dark:text-slate-400 hover:bg-indigo-100 hover:text-indigo-600 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-center gap-2"
                        >
                            <Plus size={12}/> Gestionar / Clonar Sedes
                        </button>
                        </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Navegación Segmentada (Oculta en móviles si estamos en Dashboard para mostrar el Grid de Apps) */}
            <nav className={`flex-1 flex items-center justify-start lg:justify-center gap-1 h-full px-0 md:px-2 overflow-x-auto no-scrollbar min-w-0 ${isDashboard ? 'hidden md:flex' : 'flex'}`}>
                {navStructure.map((cat) => {
                    const isActive = activeCategory?.id === cat.id;
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => cat.items && onNavigate(cat.items[0].view)}
                            className={`flex items-center justify-center gap-1.5 md:gap-2 h-8 md:h-9 px-2 md:px-3.5 rounded-xl transition-all duration-300 shrink-0
                                ${isActive 
                                    ? 'bg-white/20 border border-white/30 shadow-lg' 
                                    : 'hover:bg-white/10 border border-transparent'
                                }
                            `}
                            title={cat.label}
                        >
                            <Icon size={14} className={isActive ? 'text-white' : 'text-white/60'} />
                            <span className={`text-[8px] md:text-[10px] font-black uppercase tracking-tight ${isActive ? 'text-white block' : 'text-white/60 hidden lg:block'}`}>
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* Botones de Acción */}
            <div className="flex items-center gap-1.5 md:gap-2 ml-auto md:ml-2 pl-2 md:pl-4 border-l border-white/10 shrink-0">
               
               {/* SYNC */}
               <button 
                    onClick={handleSyncClick}
                    className={`p-1.5 md:p-2 rounded-xl transition-all ${
                        isSyncEnabled 
                            ? 'text-emerald-400 bg-emerald-500/20 border border-emerald-400/30' 
                            : 'text-white/30 hover:text-white/80'
                    }`}
                >
                    {isSyncing ? <RefreshCw size={14} className="animate-spin text-white"/> : <Cloud size={14}/>}
                </button>
               
               {/* TEMA Y NOTIFICACIONES */}
               <div className="flex items-center gap-0.5 bg-white/10 rounded-xl p-0.5">
                   <button onClick={toggleTheme} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                      {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                   </button>
                   <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-1.5 rounded-lg transition-all ${showNotifications ? 'bg-white text-primary' : 'text-white/60 hover:text-white'}`}
                   >
                      <Bell size={14} />
                      <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-primary"></span>
                   </button>
               </div>

               {/* Perfil */}
               <div className="flex items-center gap-2">
                  <div className="hidden xl:block text-right leading-none">
                      <p className="text-[10px] font-black text-white uppercase">{session.user.fullName.split(' ')[0]}</p>
                      <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">{session.user.role}</span>
                  </div>
                  <button 
                    onClick={onLogout} 
                    className="p-1.5 md:p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
                  >
                      <LogOut size={16}/>
                  </button>
               </div>
            </div>
         </div>

         {/* PANEL DE NOTIFICACIONES */}
         {showNotifications && (
             <div className="absolute top-14 right-2 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-4 duration-300 overflow-hidden z-[200]">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notificaciones</h4>
                    <button onClick={() => setShowNotifications(false)} className="text-slate-300 hover:text-slate-600"><X size={16}/></button>
                </div>
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-3 items-start border-b border-slate-50 dark:border-slate-800 pb-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><Activity size={14}/></div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-slate-800 dark:text-white leading-tight">Caja abierta correctamente</p>
                            <span className="text-[8px] text-slate-400 uppercase">Hace 5 min</span>
                        </div>
                    </div>
                </div>
             </div>
         )}
      </header>

      {/* 2. SUB HEADER (Solo si hay categoría activa y NO es Dashboard en móvil) */}
      {activeCategory && activeCategory.items && (
          <div className={`px-2 md:px-6 pb-2 shrink-0 animate-in slide-in-from-top-1 duration-300 ${isDashboard ? 'hidden md:block' : 'block'}`}>
              <div className="mx-auto h-9 md:h-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center px-2 md:px-4 overflow-x-auto no-scrollbar gap-1 w-full">
                  {activeCategory.items.map((item: any) => {
                      const isActiveSub = currentView === item.view;
                      const ItemIcon = item.icon;
                      return (
                          <button
                              key={item.view}
                              onClick={() => onNavigate(item.view)}
                              className={`flex items-center gap-2 px-3 md:px-4 py-1.5 rounded-xl text-[9px] md:text-[10px] font-black transition-all whitespace-nowrap shrink-0
                                  ${isActiveSub
                                      ? 'bg-primary/10 text-primary'
                                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                  }
                              `}
                          >
                              <ItemIcon size={12} className={isActiveSub ? 'text-primary' : 'opacity-60'}/>
                              <span className="uppercase tracking-widest">{item.label}</span>
                          </button>
                      )
                  })}
              </div>
          </div>
      )}

      {/* 3. AREA DE CONTENIDO */}
      <main className="flex-1 flex flex-col items-center min-w-0 relative overflow-hidden bg-slate-100 dark:bg-slate-950">
         <div className="flex-1 overflow-auto w-full scroll-smooth no-scrollbar p-2 md:p-4 lg:p-6">
            <div className="h-full flex flex-col animate-in fade-in duration-500">
               {children}
            </div>
         </div>
      </main>

      <div id="modal-root" className="relative z-[999]"></div>
    </div>
  );
};

export default Layout;
