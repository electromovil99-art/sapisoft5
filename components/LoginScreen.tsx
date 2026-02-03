
import React, { useState, useEffect } from 'react';
import { 
    Lock, User, ArrowRight, ShieldCheck, Mail, CheckCircle, ArrowLeft, Key, BellRing, X, AlertOctagon, 
    Twitter, Github, Linkedin, Briefcase, Users, BarChart, Headset, ShoppingCart, Wrench, FileText, Package, Check, Archive,
    Globe, ShieldAlert, RotateCcw, Info, MapPin, Phone, ExternalLink, Zap, PlayCircle, Youtube, Tv, Menu
} from 'lucide-react';
import { SystemUser, Tenant, VideoTutorial } from '../types';

// *** CAMBIO: Eliminamos el import de Helio para usar el SDK del index.html ***

interface LoginScreenProps {
    onLogin: (user: SystemUser) => void;
    onResetPassword?: (userId: string, newPass: string) => void;
    users: SystemUser[];
    tenants: Tenant[];
    heroImage?: string; 
    featureImage?: string;
    videoTutorials?: VideoTutorial[]; // NEW PROP
}

type PublicPage = 'HOME' | 'PRICING' | 'VIDEOS' | 'TERMS' | 'PRIVACY' | 'REFUND';

// *** CAMBIO: Movemos la config de Helio dentro de una función de activación ***

const LegalView = ({ title, content }: { title: string, content: React.ReactNode }) => (
    <div className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 p-10 md:p-16 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-8 uppercase tracking-tighter border-b-4 border-primary pb-4 inline-block">{title}</h2>
            <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 font-medium leading-relaxed space-y-6">
                {content}
            </div>
        </div>
    </div>
);

const PricingView = ({ onSelectPlan }: { onSelectPlan: (plan: string) => void }) => (
    <div className="py-20 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nuestros Planes</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs">Escalabilidad total para tu negocio</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
            {[
                { name: 'BASICO', price: 'S/39', desc: 'Para emprendedores', features: ['Gestión de Ventas', 'Inventario Básico', '1 Usuario'], color: 'slate' },
                { name: 'INTERMEDIO', price: 'S/69', desc: 'Negocios en crecimiento', features: ['Todo lo Básico', 'Servicio Técnico', 'Billetera Clientes', '3 Usuarios'], color: 'primary', popular: true },
                { name: 'FULL', price: 'S/99', desc: 'Gestión total SaaS', features: ['Acceso Ilimitado', 'Análisis IA', 'Multi-sucursal', 'Soporte Premium'], color: 'indigo' }
            ].map((plan) => (
                <div key={plan.name} className={`relative rounded-[2.5rem] p-10 border-2 transition-all hover:-translate-y-2 ${plan.popular ? 'border-primary bg-white dark:bg-slate-800 shadow-2xl shadow-primary/20 scale-105' : 'border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50'}`}>
                    {plan.popular && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Más Popular</div>}
                    <h3 className={`text-xl font-black uppercase tracking-tight ${plan.popular ? 'text-primary' : 'text-slate-700 dark:text-white'}`}>{plan.name}</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase mt-1">{plan.desc}</p>
                    <div className="mt-8 flex items-baseline gap-1">
                        <span className="text-5xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                        <span className="text-slate-400 font-bold text-sm">/mes</span>
                    </div>
                    <ul className="mt-10 space-y-4">
                        {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                                <CheckCircle size={18} className="text-emerald-500 shrink-0"/> {f}
                            </li>
                        ))}
                    </ul>
                    <button onClick={() => onSelectPlan(plan.name)} className={`w-full mt-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${plan.popular ? 'bg-primary text-white shadow-xl hover:bg-primary-dark' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                        Empezar Ahora
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const TutorialsView = ({ videos = [] }: { videos?: VideoTutorial[] }) => {
    // FALLBACK IF NO VIDEOS PROVIDED
    const displayVideos = videos.length > 0 ? videos : [
        { 
            id: '1', 
            title: 'Cómo Realizar una Venta', 
            module: 'Punto de Venta', 
            description: 'Aprende a procesar ventas rápidas, agregar clientes y manejar el carrito.',
            duration: '3:45',
            categoryColor: 'bg-blue-500',
            youtubeUrl: '#'
        },
        // ... more fallback data if needed
    ];

    const getYoutubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    return (
        <div className="py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 mb-6">
                    <Youtube size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Centro de Aprendizaje</span>
                </div>
                <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Tutoriales del Sistema</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-4 font-bold uppercase tracking-widest text-xs max-w-2xl mx-auto">
                    Domina cada módulo de SapiSoft con nuestra guía paso a paso en video.
                </p>
            </div>

            <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayVideos.map((video) => {
                    const youtubeId = getYoutubeId(video.youtubeUrl);
                    const thumbUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;

                    return (
                        <div key={video.id} onClick={() => window.open(video.youtubeUrl, '_blank')} className="group bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer">
                            {/* Video Thumbnail Area */}
                            <div className={`h-48 ${video.categoryColor} relative flex items-center justify-center overflow-hidden`}>
                                {thumbUrl && <img src={thumbUrl} alt={video.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />}
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                <PlayCircle size={64} className="text-white opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all z-10" />
                                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded-md text-[10px] font-black z-20">
                                    {video.duration}
                                </div>
                                {!thumbUrl && <Tv size={120} className="absolute -bottom-10 -left-10 text-white/10 rotate-12" />}
                            </div>
                            
                            <div className="p-8">
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[9px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest ${video.categoryColor}`}>
                                        {video.module}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                    {video.title}
                                </h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3">
                                    {video.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const StatsSection = () => (
    <section className="bg-slate-50 dark:bg-slate-900 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-x-8 gap-y-12 text-center sm:grid-cols-2 md:grid-cols-4">
                <div>
                    <h3 className="text-4xl font-bold text-primary dark:text-primary-400 sm:text-5xl">500+</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Empresas Activas</p>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-primary dark:text-primary-400 sm:text-5xl">10k+</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Usuarios Diarios</p>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-primary dark:text-primary-400 sm:text-5xl">99.9%</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Garantizado</p>
                </div>
                <div>
                    <h3 className="text-4xl font-bold text-primary dark:text-primary-400 sm:text-5xl">24/7</h3>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">Soporte Técnico</p>
                </div>
            </div>
        </div>
    </section>
);

const FeaturesSection = () => (
    <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-widest text-primary dark:text-primary-400">Módulos Integrales</p>
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Todo lo que necesitas en una <span className="text-primary dark:text-primary-400">sola plataforma.</span></h2>
                <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">SapiSoft unifica las operaciones críticas de tu negocio para que dejes de usar múltiples hojas de cálculo y software desconectado.</p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="inline-block rounded-xl bg-primary-100 dark:bg-primary-900/30 p-4 text-primary dark:text-primary-300"><ShoppingCart size={24} /></div>
                    <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Gestión de Ventas</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Agiliza tu punto de venta con una interfaz táctil intuitiva, manejo de cajas y reportes en tiempo real.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="inline-block rounded-xl bg-primary-100 dark:bg-primary-900/30 p-4 text-primary dark:text-primary-300"><Wrench size={24} /></div>
                    <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Servicio Técnico</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Gestiona órdenes de reparación, estados de servicio y comunicación automática con clientes vía WhatsApp.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="inline-block rounded-xl bg-primary-100 dark:bg-primary-900/30 p-4 text-primary dark:text-primary-300"><Archive size={24} /></div>
                    <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Almacen</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Control de stock, inventario, estrategia de abastecimiento a tiempo justo.</p>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                    <div className="inline-block rounded-xl bg-primary-100 dark:bg-primary-900/30 p-4 text-primary dark:text-primary-300"><BarChart size={24} /></div>
                    <h3 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">Análisis de Stock</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Reportes de rotación, alertas de stock bajo y valorización de inventario para tomar mejores decisiones.</p>
                </div>
            </div>
        </div>
    </section>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onResetPassword, users, tenants, heroImage, featureImage, videoTutorials }) => {
    const [currentPage, setCurrentPage] = useState<PublicPage>('HOME');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [isRecovery, setIsRecovery] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    // *** CAMBIO: Nueva función de pago que no usa el componente blanco ***
    const handleHelioPayment = () => {
        const helio = (window as any).helioCheckout;
        const checkoutUrl = "https://app.helio.xyz/pay/694f910c5fedc6e9c8cccce6";

        if (helio) {
            try {
                helio({
                    paylinkId: "694f910c5fedc6e9c8cccce6",
                    network: 'mainnet',
                    theme: {"themeMode":"dark"},
                    primaryColor: "#6400CC",
                    display: 'modal', 
                });
            } catch (e) {
                window.open(checkoutUrl, '_blank');
            }
        } else {
            window.open(checkoutUrl, '_blank');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const cleanUsername = username.trim();
        const cleanPassword = password.trim();

        setTimeout(() => {
            const foundUser = users.find(u => 
                u.username.toLowerCase() === cleanUsername.toLowerCase() && 
                (u.password === cleanPassword || (u.password === undefined && cleanPassword === '123')) &&
                u.active
            );

            if (foundUser) {
                if (foundUser.role === 'SUPER_ADMIN') { onLogin(foundUser); return; }
                const myTenant = tenants.find(t => t.companyName === foundUser.companyName);
                if (!myTenant || myTenant.status === 'INACTIVE') {
                    setError('Error de acceso: Empresa inactiva.');
                    setLoading(false);
                    return;
                }
                onLogin(foundUser);
            } else {
                setError('Credenciales incorrectas.');
                setLoading(false);
            }
        }, 800);
    };

    const handleSelectPlan = (plan: string) => {
        setSelectedPlan(plan);
        setShowCheckoutModal(true);
    };

    const renderContent = () => {
        switch(currentPage) {
            case 'PRICING': return <PricingView onSelectPlan={handleSelectPlan} />;
            case 'VIDEOS': return <TutorialsView videos={videoTutorials} />;
            case 'TERMS': return (
                <LegalView title="Términos de Servicio" content={
                    <>
                        <p>Al utilizar SapiSoft Cloud ERP, usted acepta quedar vinculado por los siguientes términos y condiciones:</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">1. Uso del Servicio</h4>
                        <p>SapiSoft es una plataforma SaaS para la gestión empresarial. El usuario es responsable de la integridad de los datos ingresados y del cumplimiento de las normativas fiscales de su país.</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">2. Propiedad Intelectual</h4>
                        <p>Todo el software, diseño y marcas comerciales son propiedad de SapiSoft. No se permite la ingeniería inversa ni la copia del sistema.</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">3. Limitación de Responsabilidad</h4>
                        <p>SapiSoft no se hace responsable por pérdidas de datos debidas a negligencia del usuario o interrupciones de servicios de terceros.</p>
                    </>
                }/>
            );
            case 'PRIVACY': return (
                <LegalView title="Política de Privacidad" content={
                    <>
                        <p>Su privacidad es fundamental para nosotros. Esta política detalla cómo manejamos sus datos:</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">1. Datos Recopilados</h4>
                        <p>Almacenamos información comercial necesaria para el funcionamiento del ERP: inventarios, ventas, datos de clientes y registros financieros.</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">2. Seguridad de la Información</h4>
                        <p>Utilizamos cifrado de extremo a extremo y servidores seguros provistos por infraestructuras líderes a nivel mundial (AWS/Google Cloud).</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">3. No Compartición de Datos</h4>
                        <p>SapiSoft nunca venderá ni compartirá sus datos comerciales con terceros para fines publicitarios.</p>
                    </>
                }/>
            );
            case 'REFUND': return (
                <LegalView title="Política de Reembolso" content={
                    <>
                        <p>Queremos que esté satisfecho con SapiSoft. Nuestra política de devoluciones es la siguiente:</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">1. Periodo de Evaluación</h4>
                        <p>Ofrecemos una demo gratuita para que evalúe el sistema antes de realizar cualquier pago.</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">2. Suscripciones</h4>
                        <p>Dado que es un servicio basado en la nube (SaaS), los pagos realizados por meses ya iniciados no son reembolsables. Puede cancelar su suscripción en cualquier momento para evitar futuros cargos.</p>
                        <h4 className="font-black text-slate-800 dark:text-white uppercase text-sm">3. Fallos Técnicos</h4>
                        <p>En caso de indisponibilidad del servicio comprobada por más de 48 horas continuas, se podrá emitir un crédito a favor del usuario para su próxima renovación.</p>
                    </>
                }/>
            );
            default: return (
                <>
                    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
                        <div className="ambient-glow -top-20 -left-20 bg-[radial-gradient(circle,rgba(147,51,234,0.15)_0%,rgba(0,0,0,0)_70%)]"></div>
                        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div className="flex flex-col gap-6 text-center lg:text-left">
                                    <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-text-dark dark:text-white sm:text-5xl lg:text-6xl">Tu negocio, bajo <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-primary-400">control total.</span></h1>
                                    <p className="mx-auto lg:mx-0 max-w-lg text-base text-gray-600 dark:text-gray-300 font-medium leading-relaxed">Controla ventas e inventario desde cualquier lugar. Recibe notificaciones en tiempo real y optimiza tu rentabilidad con SapiSoft Cloud ERP.</p>
                                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                                        <button onClick={() => setShowLoginModal(true)} className="flex min-w-[220px] items-center justify-center rounded-[1.2rem] bg-primary h-14 px-8 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20">Empezar ahora</button>
                                        <button onClick={() => setCurrentPage('PRICING')} className="flex min-w-[220px] items-center justify-center rounded-[1.2rem] border-2 border-slate-200 dark:border-slate-800 bg-transparent h-14 px-8 text-[11px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 transition-all hover:bg-slate-50 dark:hover:bg-slate-900">Ver Planes</button>
                                    </div>
                                </div>
                                <div className="relative flex justify-center items-center group max-w-md mx-auto lg:max-w-none">
                                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full scale-75"></div>
                                    <div className="animate-float relative z-10 w-full">
                                        <div className="glass-panel p-1.5 rounded-[2rem] shadow-2xl border-4 border-white/20 overflow-hidden">
                                            <img alt="SapiSoft Interface" className="object-cover w-full h-full rounded-2xl" src={heroImage || "https://images.unsplash.com/photo-1556155092-490a1ba16284?q=80&w=2670&auto=format&fit=crop"} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <StatsSection />
                    <FeaturesSection />
                </>
            );
        }
    };

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-dark dark:text-gray-100 font-display transition-colors duration-300 min-h-screen flex flex-col">
            
            {/* PUBLIC NAVBAR */}
            <header className="sticky top-0 z-[100] w-full px-4 py-3 sm:px-6 lg:px-8">
                <div className="glass-panel mx-auto max-w-7xl rounded-full px-4 py-3 shadow-sm flex items-center justify-between border border-white/10">
                    <button onClick={() => setCurrentPage('HOME')} className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-lg group-hover:scale-110 transition-transform"><span className="text-xl font-black">S</span></div>
                        <span className="text-lg font-black tracking-tighter text-slate-800 dark:text-white uppercase hidden md:inline">SapiSoft</span>
                    </button>
                    
                    {/* UPDATED: Nav Links Visible on Mobile */}
                    <div className="flex flex-1 items-center justify-center gap-3 md:gap-8 overflow-x-auto no-scrollbar mask-gradient mx-4">
                        {['HOME', 'PRICING', 'VIDEOS'].map((page) => (
                            <button 
                                key={page}
                                onClick={() => setCurrentPage(page as PublicPage)}
                                className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${currentPage === page ? 'text-primary' : 'text-slate-500 hover:text-primary'}`}
                            >
                                {page === 'HOME' ? 'Inicio' : page === 'PRICING' ? 'Planes' : 'Videos'}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                        <button onClick={() => setShowLoginModal(true)} className="rounded-full bg-slate-900 dark:bg-white px-4 md:px-6 py-2.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white dark:text-black shadow-xl hover:scale-105 transition-all active:scale-95">Ingresar</button>
                    </div>
                </div>
            </header>
            
            <main className="flex-1">
                {renderContent()}
            </main>
            
            {/* PUBLIC FOOTER */}
            <footer className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 mt-auto">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-12">
                        <div className="md:col-span-2 lg:col-span-2 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white"><span className="text-2xl font-black">S</span></div>
                                <span className="text-xl font-black tracking-tighter text-slate-800 dark:text-white uppercase">SapiSoft ERP</span>
                            </div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 max-w-xs uppercase tracking-tight">El sistema ERP moderno y ágil para empresas que miran al futuro. Gestión completa en la nube.</p>
                            <div className="space-y-2 pt-4">
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter"><MapPin size={16} className="text-primary"/> Av. de la Tecnología 404, Ciudad ERP, PE</div>
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter"><Phone size={16} className="text-primary"/> +51 987 654 321</div>
                                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-tighter"><Mail size={16} className="text-primary"/> contacto@sapisoft.com</div>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Navegación</h3>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => setCurrentPage('HOME')} className="text-slate-600 hover:text-primary transition-colors">Inicio</button></li>
                                <li><button onClick={() => setCurrentPage('PRICING')} className="text-slate-600 hover:text-primary transition-colors">Planes</button></li>
                                <li><button onClick={() => setCurrentPage('VIDEOS')} className="text-slate-600 hover:text-primary transition-colors">Videos</button></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Legal</h3>
                            <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                                <li><button onClick={() => setCurrentPage('TERMS')} className="text-slate-600 hover:text-primary transition-colors">Términos</button></li>
                                <li><button onClick={() => setCurrentPage('PRIVACY')} className="text-slate-600 hover:text-primary transition-colors">Privacidad</button></li>
                                <li><button onClick={() => setCurrentPage('REFUND')} className="text-slate-600 hover:text-primary transition-colors">Reembolsos</button></li>
                            </ul>
                        </div>
                        <div className="flex flex-col justify-between items-end">
                            <div className="flex gap-4">
                                <a href="#" className="text-slate-400 hover:text-primary transition-all"><Twitter size={20}/></a>
                                <a href="#" className="text-slate-400 hover:text-primary transition-all"><Linkedin size={20}/></a>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-right">
                                <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Merchant of Record</p>
                                <p className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-tighter">Powered by Paddle & SapiSoft</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">&copy; {new Date().getFullYear()} SapiSoft Inc. Todos los derechos reservados.</p>
                        <div className="flex items-center gap-4"><Globe size={14} className="text-slate-300"/><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cloud Servers: Coverage Active</span></div>
                    </div>
                </div>
            </footer>

            {/* LOGIN MODAL */}
            {showLoginModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowLoginModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <button onClick={() => setShowLoginModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 z-10 transition-colors"><X size={24}/></button>
                        <div className="p-8 md:p-10">
                            <div className="flex flex-col items-center mb-10">
                                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-2xl mb-4"><span className="text-white font-black text-2xl">S</span></div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Acceso al Sistema</h2>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-1">Gestión Empresarial Inteligente</p>
                            </div>
                            {!isRecovery ? (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Usuario / Email</label>
                                        <div className="relative group">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input type="text" className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-primary outline-none transition-all" placeholder="ADMIN" value={username} onChange={(e) => setUsername(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Contraseña</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input type="password" className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-primary outline-none transition-all" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                                        </div>
                                    </div>
                                    {error && (<div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-[10px] font-black uppercase tracking-tight"><AlertOctagon size={18} /> {error}</div>)}
                                    <button type="submit" disabled={loading} className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 uppercase tracking-widest text-[11px] active:scale-95 hover:bg-primary-600">
                                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>Ingresar ahora <ArrowRight size={18} /></>}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center space-y-6 animate-in fade-in">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Recuperar Acceso</h3>
                                    <form className="space-y-4"><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold outline-none focus:border-primary" placeholder="Usuario o correo..."/><button type="button" className="w-full py-4 bg-primary text-white font-black rounded-2xl uppercase tracking-widest text-xs">Enviar código</button></form>
                                    <button onClick={() => setIsRecovery(false)} className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest flex items-center justify-center gap-2 w-full"><ArrowLeft size={14}/> Volver</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* *** CAMBIO: MODAL HELIO REDISEÑADO PARA EVITAR PANEL BLANCO *** */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl animate-in fade-in" onClick={() => setShowCheckoutModal(false)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 border border-white/10 flex flex-col">
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck size={40} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter dark:text-white">Plan {selectedPlan}</h3>
                            <p className="text-slate-400 font-bold text-[10px] uppercase mt-2 mb-8 tracking-widest">Suscripción Segura vía Helio</p>
                            
                            <button 
                                onClick={handleHelioPayment}
                                className="w-full py-5 bg-primary text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all uppercase tracking-widest text-[11px]"
                            >
                                ACTIVAR AHORA CON HELIO
                            </button>

                            <button onClick={() => setShowCheckoutModal(false)} className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary transition-colors">Cancelar</button>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-center shrink-0">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">merchant of record secured by web3 rails</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;
