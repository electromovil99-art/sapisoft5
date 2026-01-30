
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Building2, Plus, Search, User, Globe, Calendar, CreditCard, X, Edit, Power, 
    Lock, Banknote, Landmark, Receipt, ArrowRightLeft, History, Scale, 
    PiggyBank, ShieldCheck, Database, ShieldAlert, CheckCircle2, Trash2, 
    Calculator, Wallet, ArrowDownLeft, CalendarClock, QrCode, Gift, Hash, Tablet, 
    ListChecks, Clock, Activity as ActivityIcon, Settings2, ArrowUpRight, 
    TrendingUp, BarChart3, Users, AlertTriangle, ExternalLink, ShieldX, CheckSquare,
    Megaphone, Gauge, Zap, Share2, MousePointerClick, HeartPulse, ShieldEllipsis,
    Package, TrendingDown, Coins, Info, Mail, Phone, Key, RefreshCcw, Youtube, Play, Edit3
} from 'lucide-react';
import { 
    Tenant, SystemUser, IndustryType, PlanType, TenantInvoice, 
    MasterAccount, MasterMovement, PaymentMethodType, VideoTutorial
} from '../types';

interface SuperAdminModuleProps {
    tenants: Tenant[];
    onAddTenant: (tenant: Tenant, adminUser: SystemUser) => void;
    onUpdateTenant: (id: string, updates: Partial<Tenant>, newPassword?: string) => void;
    onDeleteTenant: (id: string) => void;
    onResetTenantData: (id: string) => void;
    // New Props for Video Management
    videoTutorials?: VideoTutorial[];
    onAddVideo?: (video: VideoTutorial) => void;
    onUpdateVideo?: (video: VideoTutorial) => void;
    onDeleteVideo?: (id: string) => void;
}

type MainTab = 'BUSINESSES' | 'COLLECTIONS' | 'HISTORY' | 'ANALYTICS' | 'BROADCAST' | 'VIDEOS';

const PLAN_PRICES: Record<PlanType, number> = {
    'BASICO': 39,
    'INTERMEDIO': 69,
    'FULL': 99
};

const formatSymbol = (code?: string) => {
    if (!code) return 'S/';
    const c = code.toUpperCase();
    if (c === 'PEN' || c === 'SOLES') return 'S/';
    if (c === 'USD' || c === 'DOLARES') return '$';
    return code;
};

const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const SuperAdminModule: React.FC<SuperAdminModuleProps> = ({ 
    tenants, 
    onAddTenant, 
    onUpdateTenant, 
    onDeleteTenant,
    onResetTenantData,
    videoTutorials = [],
    onAddVideo,
    onUpdateVideo,
    onDeleteVideo
}) => {
    const [activeMainTab, setActiveMainTab] = useState<MainTab>('BUSINESSES');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    
    // --- ESTADOS DE GESTIÓN ---
    const [selectedInvoiceForManual, setSelectedInvoiceForManual] = useState<TenantInvoice | null>(null);
    const [collectionPayments, setCollectionPayments] = useState<any[]>([]);
    const [tempPlan, setTempPlan] = useState<PlanType | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showQuotasModal, setShowQuotasModal] = useState<Tenant | null>(null);
    const [useCredit, setUseCredit] = useState(false);
    
    // --- VIDEO MANAGEMENT STATE ---
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [editingVideo, setEditingVideo] = useState<VideoTutorial | null>(null);
    const [videoForm, setVideoForm] = useState<Partial<VideoTutorial>>({
        title: '', module: '', description: '', youtubeUrl: '', duration: '', categoryColor: 'bg-blue-500'
    });

    const [currentCollPay, setCurrentCollPay] = useState({
        method: 'Efectivo' as PaymentMethodType,
        amount: '',
        reference: '',
        accountId: ''
    });

    const [formData, setFormData] = useState({
        companyName: '', industry: 'TECH' as IndustryType, ownerName: '', 
        username: '', password: '', phone: '', email: '', baseCurrency: 'PEN'
    });

    // --- MÉTRICAS ---
    const globalStats = useMemo(() => {
        const active = tenants.filter(t => t.status === 'ACTIVE');
        const mrr = active.reduce((acc, t) => acc + PLAN_PRICES[t.planType], 0);
        const atRisk = tenants.filter(t => {
            const diff = parseDate(t.subscriptionEnd).getTime() - new Date().getTime();
            return diff > 0 && diff < (5 * 24 * 60 * 60 * 1000);
        }).length;
        return { total: tenants.length, activeCount: active.length, mrr, atRisk };
    }, [tenants]);

    // --- LÓGICA DE COBRO Y VENCIMIENTO ---
    const paymentAnalysis = useMemo(() => {
        if (!selectedInvoiceForManual) return { total: 0, nextDate: '', isUpgrade: false, isDowngrade: false, daysRemaining: 0, creditToGenerate: 0, appliedCredit: 0 };
        
        const tenant = tenants.find(t => t.id === selectedInvoiceForManual.tenantId);
        if (!tenant) return { total: 0, nextDate: '', isUpgrade: false, isDowngrade: false, daysRemaining: 0, creditToGenerate: 0, appliedCredit: 0 };

        const expiryDate = parseDate(tenant.subscriptionEnd);
        const today = new Date();
        const diffDays = Math.max(0, Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        
        const currentPrice = PLAN_PRICES[tenant.planType];
        const targetPlan = tempPlan || tenant.planType;
        const targetPrice = PLAN_PRICES[targetPlan];
        
        const isUpgrade = targetPrice > currentPrice;
        const isDowngrade = targetPrice < currentPrice;

        // Regla: No se genera crédito si el plan actual es GRATIS/PRUEBA (si el precio es 0) o si no ha pagado nunca.
        // Como todos los tenants pagan el mismo precio según el plan, asumimos que si es el trial inicial (15 días), no genera crédito.
        const isTrial = diffDays > 0 && diffDays <= 15 && tenant.creditBalance === 0; 
        
        const currentRemainingValue = (currentPrice / 30) * diffDays;
        let creditToGenerate = 0;

        if (isDowngrade && !isTrial) {
            const targetRemainingValue = (targetPrice / 30) * diffDays;
            creditToGenerate = Math.max(0, currentRemainingValue - targetRemainingValue);
        }

        // Lógica de Vencimiento: Si paga antes de vencer, se suma a su fecha actual. Si paga después, cuenta desde hoy.
        let baseDate = expiryDate > today ? expiryDate : today;
        let nextDateObj = new Date(baseDate);
        nextDateObj.setDate(nextDateObj.getDate() + 30);

        let baseToPay = targetPrice;
        if (isUpgrade && !isTrial) {
             const diffPrice = targetPrice - currentPrice;
             baseToPay = (diffPrice / 30) * diffDays;
             // En upgrade el vencimiento no cambia, solo se ajusta el plan
             nextDateObj = new Date(expiryDate);
        }

        const availableCredit = tenant.creditBalance || 0;
        let finalToPay = baseToPay;
        let appliedCredit = 0;

        if (useCredit && availableCredit > 0) {
            appliedCredit = Math.min(availableCredit, finalToPay);
            finalToPay -= appliedCredit;
        }

        return { 
            total: Math.max(0, finalToPay), 
            nextDate: formatDate(nextDateObj), 
            isUpgrade, 
            isDowngrade, 
            daysRemaining: diffDays, 
            creditToGenerate,
            appliedCredit
        };
    }, [selectedInvoiceForManual, tempPlan, tenants, useCredit]);

    const amountCollected = collectionPayments.reduce((acc, p) => acc + p.amount, 0);
    const balancePending = Math.max(0, paymentAnalysis.total - amountCollected);

    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const matchesSearch = t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                t.ownerName.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' ? true : t.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [tenants, searchTerm, statusFilter]);

    // --- ESTADOS DE TESORERÍA ---
    const [masterAccounts] = useState<MasterAccount[]>([
        { id: 'BANK-01', name: 'HELIO REVENUE (SOL)', type: 'BANK', currency: 'PEN', balance: 4200 },
        { id: 'BANK-02', name: 'PADDLE SETTLEMENT', type: 'BANK', currency: 'USD', balance: 1250 }
    ]);
    const [masterMovements, setMasterMovements] = useState<MasterMovement[]>([]);

    // --- ACCIONES ---
    const handleCompletePayment = () => {
        if (balancePending > 0.1) return alert("Falta cubrir el saldo");
        const tenant = tenants.find(t => t.id === selectedInvoiceForManual?.tenantId);
        if (!tenant) return;

        // Actualizar el cliente
        onUpdateTenant(tenant.id, {
            planType: tempPlan || tenant.planType,
            subscriptionEnd: paymentAnalysis.nextDate,
            creditBalance: (tenant.creditBalance || 0) - paymentAnalysis.appliedCredit + paymentAnalysis.creditToGenerate
        });

        // Crear descripción ultra-detallada para tesorería
        const paymentsStr = collectionPayments.map(p => `S/ ${p.amount.toFixed(2)} ${p.method}${p.reference ? ` (OP: ${p.reference})` : ''}`).join(' + ');
        const creditStr = paymentAnalysis.appliedCredit > 0 ? ` + S/ ${paymentAnalysis.appliedCredit.toFixed(2)} Prorrateo (Generado el ${tenant.subscriptionEnd})` : '';
        const concept = `RECAUDACIÓN SaaS: ${tenant.companyName} | ${tempPlan || tenant.planType} | DETALLE: ${paymentsStr}${creditStr}`;

        const newMoves: MasterMovement[] = collectionPayments.map(p => ({
            id: `M-${Math.random().toString(36).substring(7)}`, 
            date: formatDate(new Date()), 
            time: new Date().toLocaleTimeString(),
            type: 'Ingreso', 
            accountId: p.accountId || 'CASH-01', 
            accountName: p.method === 'Efectivo' ? 'EFECTIVO' : (masterAccounts.find(a => a.id === p.accountId)?.name || p.method),
            amount: p.amount, 
            concept: concept, 
            tenantId: tenant.id,
            reference: p.reference
        }));

        setMasterMovements([...newMoves, ...masterMovements]);
        setSelectedInvoiceForManual(null);
        setCollectionPayments([]);
        setUseCredit(false);
        setTempPlan(null);
    };

    const handleResetPassword = (tenant: Tenant) => {
        const newPass = prompt(`Nueva contraseña para ${tenant.companyName}:`);
        if (newPass) onUpdateTenant(tenant.id, {}, newPass);
    };

    const handleRegisterTenant = () => {
        if (!formData.companyName || !formData.username || !formData.password) return alert("Datos incompletos");
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + 15);

        const newTenant: Tenant = {
            id: 'TEN-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            companyName: formData.companyName.toUpperCase(),
            industry: formData.industry, ownerName: formData.ownerName || 'Admin Instance', phone: formData.phone,
            status: 'ACTIVE', planType: 'FULL', subscriptionEnd: formatDate(trialExpiry),
            creditBalance: 0, baseCurrency: formData.baseCurrency
        };

        const adminUser: SystemUser = {
            id: 'USR-' + newTenant.id, username: formData.username, password: formData.password,
            fullName: formData.ownerName || 'Admin Instance', role: 'ADMIN', active: true, permissions: ['ALL'],
            industry: formData.industry, companyName: newTenant.companyName, email: formData.email
        };

        onAddTenant(newTenant, adminUser);
        setShowCreateModal(false);
        setFormData({ companyName: '', industry: 'TECH', ownerName: '', username: '', password: '', phone: '', email: '', baseCurrency: 'PEN' });
    };

    // --- VIDEO MANAGEMENT LOGIC ---
    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleOpenVideoModal = (video?: VideoTutorial) => {
        if (video) {
            setEditingVideo(video);
            setVideoForm(video);
        } else {
            setEditingVideo(null);
            setVideoForm({ title: '', module: '', description: '', youtubeUrl: '', duration: '', categoryColor: 'bg-blue-500' });
        }
        setShowVideoModal(true);
    };

    const handleSaveVideo = () => {
        if (!videoForm.title || !videoForm.youtubeUrl) return alert("Título y URL de YouTube requeridos");
        
        const videoData = {
            id: editingVideo ? editingVideo.id : Math.random().toString(),
            title: videoForm.title || '',
            module: videoForm.module || 'General',
            description: videoForm.description || '',
            youtubeUrl: videoForm.youtubeUrl || '',
            duration: videoForm.duration || '00:00',
            categoryColor: videoForm.categoryColor || 'bg-slate-500'
        };

        if (editingVideo && onUpdateVideo) {
            onUpdateVideo(videoData);
        } else if (onAddVideo) {
            onAddVideo(videoData);
        }
        setShowVideoModal(false);
    };

    return (
        <div className="flex flex-col h-full gap-4 p-2 bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
            {/* NAV TOP */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-2xl border shadow-sm shrink-0">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveMainTab('BUSINESSES')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'BUSINESSES' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Building2 size={14}/> Instancias
                    </button>
                    <button onClick={() => setActiveMainTab('COLLECTIONS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'COLLECTIONS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Receipt size={14}/> Cobranzas
                    </button>
                    <button onClick={() => setActiveMainTab('HISTORY')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <History size={14}/> Tesorería
                    </button>
                    <button onClick={() => setActiveMainTab('VIDEOS')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMainTab === 'VIDEOS' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
                        <Youtube size={14}/> Tutoriales
                    </button>
                </div>
            </div>

            {/* VISTA CLIENTES (LINEAL) */}
            {activeMainTab === 'BUSINESSES' && (
                <div className="flex-1 flex flex-col gap-4 min-h-0">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] border overflow-hidden flex flex-col shadow-sm flex-1">
                        <div className="p-4 border-b flex items-center justify-between bg-slate-50/30 px-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input type="text" placeholder="Filtrar base de datos..." className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border rounded-xl text-xs outline-none focus:border-primary-500 font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                </div>
                            </div>
                            <button onClick={() => setShowCreateModal(true)} className="bg-primary-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                                <Plus size={16}/> Nueva Instancia
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-[11px]">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-black uppercase tracking-widest border-b sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-4">Empresa</th>
                                        <th className="px-6 py-4">Contacto</th>
                                        <th className="px-6 py-4">Plan / Estado</th>
                                        <th className="px-6 py-4">Vencimiento</th>
                                        <th className="px-6 py-4 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredTenants.map(t => (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                                                        <Building2 size={16}/>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-black uppercase text-slate-800 dark:text-white">{t.companyName}</span>
                                                        <button onClick={() => handleResetPassword(t)} className="p-1 text-slate-300 hover:text-amber-500" title="Reset Clave Admin">
                                                            <Key size={14}/>
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-600 uppercase">{t.ownerName}</span>
                                                    <span className="text-slate-400">{t.phone}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg font-black text-[9px] border border-blue-100 uppercase">{t.planType}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-black text-slate-700">{t.subscriptionEnd}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => onResetTenantData(t.id)} className="p-2 text-slate-300 hover:text-orange-500" title="Wipe Data"><RefreshCcw size={16}/></button>
                                                    <button onClick={() => onDeleteTenant(t.id)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA VIDEOS */}
            {activeMainTab === 'VIDEOS' && (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border overflow-hidden flex flex-col shadow-sm animate-in fade-in">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50/30 px-8">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Youtube size={16} className="text-red-500"/> Gestión de Video Tutoriales</h3>
                        <button onClick={() => handleOpenVideoModal()} className="bg-red-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg">
                            <Plus size={14}/> Nuevo Video
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto p-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {videoTutorials.map(video => {
                                const youtubeId = getYoutubeId(video.youtubeUrl);
                                const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg` : '';
                                
                                return (
                                    <div key={video.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden group hover:shadow-xl transition-all">
                                        <div className={`h-40 bg-slate-100 relative group-hover:scale-105 transition-transform duration-500 ${video.categoryColor}`}>
                                            {thumbUrl && (
                                                <img src={thumbUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors text-white shadow-lg">
                                                    <Play size={20} fill="currentColor"/>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                {video.duration}
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[8px] font-black text-white px-2 py-0.5 rounded uppercase ${video.categoryColor}`}>
                                                    {video.module}
                                                </span>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleOpenVideoModal(video)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"><Edit3 size={14}/></button>
                                                    <button onClick={() => onDeleteVideo && onDeleteVideo(video.id)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                            </div>
                                            <h3 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-2 line-clamp-2">{video.title}</h3>
                                            <p className="text-[10px] text-slate-500 line-clamp-2">{video.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA COBRANZAS */}
            {activeMainTab === 'COLLECTIONS' && (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border overflow-hidden flex flex-col shadow-sm animate-in fade-in">
                    <div className="p-6 border-b flex justify-between items-center bg-slate-50/30 px-8">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Calculator size={16}/> Módulo de Recaudación Directa</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-[11px]">
                            <thead className="text-slate-400 font-black uppercase border-b sticky top-0 bg-white">
                                <tr>
                                    <th className="px-8 py-4">Instancia</th>
                                    <th className="px-8 py-4">Vence</th>
                                    <th className="px-8 py-4">Saldo a Favor</th>
                                    <th className="px-8 py-4 text-center">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {tenants.map(t => (
                                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-4 font-black uppercase text-slate-800">{t.companyName}</td>
                                        <td className="px-8 py-4 font-bold text-slate-500">{t.subscriptionEnd}</td>
                                        <td className="px-8 py-4 font-black text-emerald-600">S/ {t.creditBalance?.toFixed(2) || '0.00'}</td>
                                        <td className="px-8 py-4 text-center">
                                            <button onClick={() => { setSelectedInvoiceForManual({ id: 'REC-'+t.id, tenantId: t.id, tenantName: t.companyName, date: '', dueDate: t.subscriptionEnd, amount: 0, creditApplied: 0, netAmount: 0, status: 'PENDING', planType: t.planType }); setCollectionPayments([]); }} className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase hover:scale-105 transition-transform shadow-md">
                                                Cobrar Renovación
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL COBRO */}
            {selectedInvoiceForManual && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-2">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-5xl border flex flex-col md:flex-row overflow-hidden max-h-[95vh] animate-in zoom-in-95">
                        <div className="flex-1 p-8 md:p-10 bg-slate-50/50 dark:bg-slate-800/30 border-r flex flex-col min-h-0">
                            <div className="mb-6">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-800 dark:text-white leading-none mb-2">{selectedInvoiceForManual.tenantName}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Vence Original: {selectedInvoiceForManual.dueDate}</p>
                            </div>
                            
                            <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden mb-8 shadow-xl">
                                <div className="absolute top-0 right-0 p-6 opacity-5"><Calculator size={100}/></div>
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Total Renovación a Recaudar</p>
                                <div className="text-6xl font-black tracking-tighter tabular-nums mb-4">S/ {paymentAnalysis.total.toFixed(2)}</div>
                                
                                {paymentAnalysis.creditToGenerate > 0 && (
                                    <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/30 w-fit mb-4">
                                        <Coins size={14} className="text-emerald-400"/>
                                        <span className="text-[9px] font-black uppercase">Crédito a generar: S/ {paymentAnalysis.creditToGenerate.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                                    <div>
                                        <p className="text-[8px] font-black text-slate-500 uppercase">Nuevo Vencimiento:</p>
                                        <p className="text-xl font-black text-emerald-400 uppercase">{paymentAnalysis.nextDate}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-slate-500 uppercase">Por Cobrar:</p>
                                        <p className="text-2xl font-black text-red-500">S/ {balancePending.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Cambiar Plan</p>
                                <div className="grid grid-cols-3 gap-3">
                                    {(['BASICO', 'INTERMEDIO', 'FULL'] as PlanType[]).map(p => (
                                        <button key={p} onClick={() => setTempPlan(p)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${ (tempPlan || selectedInvoiceForManual.planType) === p ? 'bg-white border-primary-500 shadow-lg scale-105' : 'bg-transparent border-slate-100 opacity-40'}`}>
                                            <span className="text-[9px] font-black uppercase">{p}</span>
                                            <span className="text-xs font-black text-slate-700">S/ {PLAN_PRICES[p]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-[450px] p-8 md:p-10 flex flex-col bg-white overflow-y-auto no-scrollbar">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><ListChecks size={14}/> Métodos de Recaudación</h4>
                            
                            {tenants.find(t => t.id === selectedInvoiceForManual.tenantId)?.creditBalance && tenants.find(t => t.id === selectedInvoiceForManual.tenantId)!.creditBalance! > 0 && (
                                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-600 text-white rounded-lg"><Coins size={18}/></div>
                                        <div>
                                            <p className="text-[9px] font-black text-emerald-600 uppercase">Saldo a Favor</p>
                                            <p className="text-sm font-black">S/ {tenants.find(t => t.id === selectedInvoiceForManual.tenantId)!.creditBalance!.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setUseCredit(!useCredit)} className={`w-12 h-6 rounded-full relative transition-colors ${useCredit ? 'bg-emerald-600' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${useCredit ? 'translate-x-6' : ''}`}></div>
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 space-y-5">
                                <div className="grid grid-cols-2 gap-2">
                                    {['Efectivo', 'Transferencia', 'Yape', 'Tarjeta'].map(m => (
                                        <button key={m} onClick={() => setCurrentCollPay({...currentCollPay, method: m as any, reference: ''})} className={`py-3 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${currentCollPay.method === m ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                            {m}
                                        </button>
                                    ))}
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border space-y-4">
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">S/</span>
                                        <input type="number" className="w-full pl-10 p-3 bg-white border rounded-xl text-3xl font-black outline-none focus:border-primary-500" value={currentCollPay.amount} onChange={e => setCurrentCollPay({...currentCollPay, amount: e.target.value})} placeholder="0.00" />
                                    </div>
                                    {currentCollPay.method !== 'Efectivo' && (
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Nro de Operación</label>
                                            <input type="text" className="w-full p-3 bg-white border rounded-xl text-xs font-black uppercase outline-none focus:border-primary-500" value={currentCollPay.reference} onChange={e => setCurrentCollPay({...currentCollPay, reference: e.target.value})} placeholder="REF-12345" />
                                        </div>
                                    )}
                                    <button onClick={() => {
                                        const amt = parseFloat(currentCollPay.amount);
                                        if (amt > 0) setCollectionPayments([...collectionPayments, { ...currentCollPay, amount: amt, id: Date.now() }]);
                                        setCurrentCollPay({...currentCollPay, amount: '', reference: ''});
                                    }} className="w-full py-4 bg-slate-800 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Agregar Abono</button>
                                </div>

                                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                    {paymentAnalysis.appliedCredit > 0 && (
                                        <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                                            <span className="text-[9px] font-black uppercase text-emerald-600">CRÉDITO APLICADO</span>
                                            <span className="text-[10px] font-black text-emerald-600">- S/ {paymentAnalysis.appliedCredit.toFixed(2)}</span>
                                        </div>
                                    )}
                                    {collectionPayments.map(p => (
                                        <div key={p.id} className="flex justify-between items-center bg-slate-100 p-3 rounded-xl group">
                                            <div>
                                                <span className="text-[9px] font-black uppercase text-slate-600">{p.method}</span>
                                                {p.reference && <p className="text-[8px] text-slate-400 font-mono mt-0.5">#{p.reference}</p>}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-[11px] font-black">S/ {p.amount.toFixed(2)}</span>
                                                <button onClick={() => setCollectionPayments(prev => prev.filter(x => x.id !== p.id))} className="text-red-300 hover:text-red-500"><Trash2 size={14}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-8 space-y-3 mt-auto">
                                <button disabled={balancePending > 0.1} onClick={handleCompletePayment} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 flex items-center justify-center gap-3 active:scale-95 transition-all">
                                    <CheckCircle2 size={20}/> Conciliar SaaS
                                </button>
                                <button onClick={() => setSelectedInvoiceForManual(null)} className="w-full py-1 text-slate-400 font-black uppercase text-[8px] text-center tracking-widest">Descartar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA HISTORIAL TESORERÍA ACTUALIZADA */}
            {activeMainTab === 'HISTORY' && (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border overflow-hidden flex flex-col shadow-sm px-8">
                    <div className="p-8 border-b flex justify-between items-center bg-slate-50/30">
                        <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Landmark size={18}/> Central de Recaudación SaaS</h3>
                        <div className="flex gap-10">
                            {masterAccounts.map(acc => (
                                <div key={acc.id} className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{acc.name}</p>
                                    <p className="text-lg font-black text-slate-800">{formatSymbol(acc.currency)} {acc.balance.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-8">
                        <div className="space-y-4">
                            {masterMovements.map(m => (
                                <div key={m.id} className="flex flex-col p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 hover:border-primary-100 transition-all shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner"><ArrowUpRight size={24}/></div>
                                            <div>
                                                <p className="font-black text-base uppercase text-slate-800">{m.accountName}</p>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{m.date} - {m.time}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Ingreso Neto Recaudado</p>
                                            <p className="font-black text-emerald-600 text-2xl">S/ {m.amount.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase mb-2">
                                            <Info size={14}/> Desglose de Operación
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase">
                                            {m.concept}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {masterMovements.length === 0 && (
                                <div className="py-24 text-center text-slate-300 font-black uppercase tracking-widest italic flex flex-col items-center gap-6 opacity-40">
                                    <History size={64}/> Sin movimientos en el turno actual
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL ALTA INSTANCIA */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-white/20 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-8 border-b bg-slate-50 dark:bg-slate-800 flex justify-between items-center px-10">
                            <h3 className="font-black text-base uppercase flex items-center gap-3 tracking-tighter">
                                <Gift size={24} className="text-primary-600"/> Alta Nueva Instancia SaaS
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                        </div>
                        <div className="p-10 grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5"><Building2 size={12}/> Nombre de la Empresa</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black uppercase outline-none focus:border-primary-500" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5"><Phone size={12}/> Número Celular</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-bold outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="999..." />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5"><Mail size={12}/> Correo Electrónico</label>
                                <input type="email" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-bold outline-none lowercase" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="cliente@correo.com" />
                            </div>

                            <div className="space-y-1.5 border-t dark:border-slate-800 pt-6 mt-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5"><User size={12}/> Usuario Admin</label>
                                <input type="text" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black uppercase outline-none focus:border-indigo-500" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                            </div>

                            <div className="space-y-1.5 border-t dark:border-slate-800 pt-6 mt-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1.5"><Lock size={12}/> Contraseña Inicial</label>
                                <input type="password" placeholder="••••••••" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-bold outline-none focus:border-indigo-500" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                            </div>

                            <div className="col-span-2 pt-6">
                                <button onClick={handleRegisterTenant} className="w-full py-5 bg-primary-600 text-white rounded-[2rem] font-black uppercase text-xs shadow-xl active:scale-95 transition-all tracking-[0.2em]">
                                    Activar 15 Días Prueba (Plan FULL)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL VIDEO */}
            {showVideoModal && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-[2rem] shadow-2xl border border-white/10 animate-in zoom-in-95 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
                                <Youtube size={18} className="text-red-600"/> {editingVideo ? 'Editar Video' : 'Nuevo Video'}
                            </h3>
                            <button onClick={() => setShowVideoModal(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Título del Video</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-primary-500" value={videoForm.title} onChange={e => setVideoForm({...videoForm, title: e.target.value})} placeholder="Ej: Cómo realizar una venta" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Módulo</label>
                                    <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none" value={videoForm.module} onChange={e => setVideoForm({...videoForm, module: e.target.value})} placeholder="Ventas" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Duración</label>
                                    <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none" value={videoForm.duration} onChange={e => setVideoForm({...videoForm, duration: e.target.value})} placeholder="05:30" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">URL de YouTube</label>
                                <input type="text" className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none text-blue-600" value={videoForm.youtubeUrl} onChange={e => setVideoForm({...videoForm, youtubeUrl: e.target.value})} placeholder="https://youtube.com/watch?v=..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Descripción Corta</label>
                                <textarea className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium outline-none resize-none h-20" value={videoForm.description} onChange={e => setVideoForm({...videoForm, description: e.target.value})} placeholder="Breve descripción del contenido..." />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Color de Categoría</label>
                                <div className="flex gap-2">
                                    {['bg-blue-500', 'bg-red-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-slate-600'].map(color => (
                                        <button 
                                            key={color} 
                                            onClick={() => setVideoForm({...videoForm, categoryColor: color})}
                                            className={`w-8 h-8 rounded-full ${color} ${videoForm.categoryColor === color ? 'ring-4 ring-offset-2 ring-slate-300 dark:ring-slate-600' : ''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button onClick={handleSaveVideo} className="w-full py-4 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all">
                                Guardar Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminModule;
