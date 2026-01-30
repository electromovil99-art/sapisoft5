
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Zap, Globe, Landmark, Smartphone, Radio, Webhook, Link, Key, Signal, Database, 
    CreditCard, ShieldAlert, Cpu, Activity, Server, Activity as ActivityIcon, 
    Terminal, RefreshCw, CheckCircle2, AlertCircle, Copy, ExternalLink, ShieldCheck, RotateCcw
} from 'lucide-react';

export const GatewayConfigModule: React.FC = () => {
    // --- CONFIGURACIÓN HELIO WEB3 ---
    const [helioConfig, setHelioConfig] = useState({
        apiKeyPublic: 'pk_live_helio_sdk_abc123', 
        apiKeySecret: 'sk_live_helio_send_xyz789', 
        webhookSecret: 'whsec_helio_v4_987654',     
        prices: { 'BASICO': 'h_b_1', 'INTERMEDIO': 'h_i_2', 'FULL': 'h_f_3' }
    });

    // --- CONFIGURACIÓN PADDLE GLOBAL ---
    const [paddleConfig, setPaddleConfig] = useState({
        vendorId: '12345',
        clientToken: 'ptp_live_sample_5566',
        webhookSecret: 'whsec_paddle_445',
    });

    // --- ESTADO DE MONITOREO EN TIEMPO REAL ---
    const [monitors, setMonitors] = useState({
        helio: { status: 'ONLINE', latency: '42ms', heartbeat: true, block: '284,122,091' },
        paddle: { status: 'STABLE', latency: '120ms', heartbeat: true, block: 'N/A' },
        payme: { status: 'STANDBY', latency: '85ms', heartbeat: false, block: 'N/A' }
    });

    const [webhookLogs, setWebhookLogs] = useState<{id: string, time: string, gateway: string, event: string, status: 'SUCCESS' | 'ERROR'}[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            setMonitors(prev => ({
                helio: { 
                    ...prev.helio, 
                    latency: `${Math.floor(Math.random() * 15) + 30}ms`, 
                    heartbeat: !prev.helio.heartbeat,
                    block: (parseInt(prev.helio.block.replace(/,/g, '')) + 1).toLocaleString()
                },
                paddle: { ...prev.paddle, latency: `${Math.floor(Math.random() * 40) + 110}ms`, heartbeat: !prev.paddle.heartbeat },
                payme: { ...prev.payme, latency: `${Math.floor(Math.random() * 20) + 80}ms`, heartbeat: !prev.payme.heartbeat }
            }));

            if (Math.random() > 0.85) {
                const gateways = ['HELIO', 'PADDLE', 'PAYME'];
                const events = ['subscription.created', 'payment.succeeded', 'invoice.paid'];
                const newLog = {
                    id: Math.random().toString(36).substring(7).toUpperCase(),
                    time: new Date().toLocaleTimeString('es-PE', { hour12: false }),
                    gateway: gateways[Math.floor(Math.random() * gateways.length)],
                    event: events[Math.floor(Math.random() * events.length)],
                    status: (Math.random() > 0.1 ? 'SUCCESS' : 'ERROR') as any
                };
                setWebhookLogs(prev => [newLog, ...prev].slice(0, 10));
            }
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const webhookUrl = useMemo(() => {
        return `${window.location.origin}/api/v1/gateways/webhooks/incoming`;
    }, []);

    return (
        <div className="flex flex-col gap-4 h-full animate-in fade-in duration-500 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 shrink-0">
                {[
                    { id: 'helio', label: 'Helio Web3 API', data: monitors.helio, icon: Zap },
                    { id: 'paddle', label: 'Paddle MoR Proxy', data: monitors.paddle, icon: Globe },
                    { id: 'payme', label: 'PayMe Alif API', data: monitors.payme, icon: Landmark }
                ].map(m => (
                    <div key={m.id} className="bg-slate-900 text-white p-4 rounded-[1.8rem] shadow-xl border border-white/10 relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><m.icon size={50}/></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{m.label}</h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className={`w-2 h-2 rounded-full ${m.data.heartbeat ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-red-50'}`}></div>
                                    <span className={`text-[10px] font-black uppercase ${m.data.heartbeat ? 'text-emerald-400' : 'text-red-400'}`}>{m.data.status}</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] font-black uppercase text-white/40 block">LATENCIA</span>
                                <span className="text-[11px] font-mono text-white/90">{m.data.latency}</span>
                            </div>
                        </div>
                        {m.id === 'helio' && (
                            <div className="mt-3 relative z-10 flex justify-between items-end border-t border-white/5 pt-2">
                                <span className="text-[8px] font-black text-slate-500 uppercase">SOLANA_HEIGHT</span>
                                <span className="text-[10px] font-mono text-purple-400">{m.data.block}</span>
                            </div>
                        )}
                    </div>
                ))}
                
                <div className="bg-white dark:bg-slate-800 p-4 rounded-[1.8rem] border border-slate-200 dark:border-slate-700 flex flex-col justify-center shadow-sm relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-1.5">
                        <Webhook size={14} className="text-primary-500"/>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Master Webhook URL</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                        <code className="text-[9px] font-mono text-slate-500 truncate mr-2">{webhookUrl}</code>
                        <button onClick={() => { navigator.clipboard.writeText(webhookUrl); alert("Copiado"); }} className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg text-primary-500 transition-all active:scale-90 shadow-sm"><Copy size={12}/></button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                <div className="flex-[2] grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar pb-10">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] border border-slate-200 dark:border-slate-700 p-7 shadow-sm flex flex-col gap-5 group h-fit">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg shadow-purple-200 dark:shadow-none transition-transform group-hover:scale-105"><Zap size={22}/></div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Helio Web3 Checkout</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Crypto Payments Ready</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Public API Key</label>
                                <input type="password" value={helioConfig.apiKeyPublic} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-mono outline-none" readOnly />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-[2.2rem] border border-slate-200 dark:border-slate-700 p-7 shadow-sm flex flex-col gap-5 group h-fit">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition-transform group-hover:scale-105"><Globe size={22}/></div>
                            <div>
                                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">Paddle Global (MoR)</h3>
                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Merchant of Record</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block ml-1">Client Token</label>
                                <input type="password" value={paddleConfig.clientToken} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-[10px] font-mono outline-none" readOnly />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-black rounded-[2.2rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Terminal size={14} className="text-emerald-500"/> Webhook Live Monitor</h3>
                        </div>
                        <button onClick={() => setWebhookLogs([])} className="text-[9px] font-black text-slate-500 hover:text-slate-300 uppercase flex items-center gap-1.5"><RotateCcw size={12}/> Clear</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 font-mono no-scrollbar">
                        {webhookLogs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-20 text-emerald-500 text-center p-10">
                                <ActivityIcon size={40} className="mb-4 animate-pulse"/>
                                <span className="text-[10px] uppercase font-black tracking-[0.3em]">Listening for cloud events...</span>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {webhookLogs.map(log => (
                                    <div key={log.id} className="text-[9px] animate-in slide-in-from-left-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-600">[{log.time}]</span>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{log.status}</span>
                                            <span className="text-primary-400 font-bold">{log.gateway}</span>
                                        </div>
                                        <div className="mt-1 pl-4 border-l border-slate-800 text-slate-300">→ Event: <span className="text-amber-400">{log.event}</span></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GatewayConfigModule;
