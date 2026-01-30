import React, { useState, useMemo } from 'react';
import { ShieldCheck, History, Brain, TrendingDown, TrendingUp, Eye, X, Info, RotateCcw } from 'lucide-react';
import { InventoryHistorySession, Product } from '../types';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';

interface InventoryAuditModuleProps {
    history: InventoryHistorySession[];
    products: Product[];
}

const InventoryAuditModule: React.FC<InventoryAuditModuleProps> = ({ history, products }) => {
    const [selectedSession, setSelectedSession] = useState<InventoryHistorySession | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const stats = useMemo(() => {
        let totalLoss = 0;
        let totalExtra = 0;
        let totalItemsChecked = 0;

        history.forEach(session => {
            session.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                const cost = product?.cost || (product?.price ? product.price * 0.7 : 0);
                
                if (item.difference < 0) {
                    totalLoss += Math.abs(item.difference) * cost;
                } else if (item.difference > 0) {
                    totalExtra += item.difference * cost;
                }
                totalItemsChecked += 1;
            });
        });

        return { totalLoss, totalExtra, totalItemsChecked, netImpact: totalExtra - totalLoss };
    }, [history, products]);

    const runAiAudit = async () => {
        if (history.length === 0) return;
        setIsAnalyzing(true);
        setAiAnalysis(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const historySummary = history.slice(0, 5).map(s => ({
                fecha: s.date,
                usuario: s.user,
                resumen: s.items.map(i => `${i.productName}: DIF ${i.difference}`).join(', ')
            }));

            const prompt = `Actúa como un auditor senior de retail. Analiza estos datos de inventario: ${JSON.stringify(historySummary)}. Detecta patrones de robo hormiga, errores de recepción o riesgos de usuario. Sé directo y usa Markdown.`;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });

            setAiAnalysis(response.text || "No se pudo generar un análisis.");

        } catch (error) {
            console.error("Error AI Audit:", error);
            setAiAnalysis("## Error detectado\nNo se pudo procesar la auditoría. Verifica que la API KEY sea correcta.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingDown size={12} className="text-rose-500"/> Faltantes</p>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">- S/ {stats.totalLoss.toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 border-l-emerald-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><TrendingUp size={12} className="text-emerald-500"/> Sobrantes</p>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">+ S/ {stats.totalExtra.toFixed(2)}</div>
                </div>
                <div className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 border-l-4 ${stats.netImpact >= 0 ? 'border-l-indigo-500' : 'border-l-amber-500'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impacto Neto</p>
                    <div className={`text-2xl font-black leading-none ${stats.netImpact >= 0 ? 'text-indigo-600' : 'text-amber-600'}`}>S/ {stats.netImpact.toFixed(2)}</div>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-5 rounded-[2rem] shadow-xl border border-indigo-500/20 flex items-center justify-between group overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1 flex items-center gap-2"><Brain size={14} className="animate-pulse"/> Auditoría IA</p>
                        <button 
                            onClick={runAiAudit}
                            disabled={isAnalyzing || history.length === 0}
                            className="mt-1 bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-indigo-500 transition-all disabled:opacity-30"
                        >
                            {isAnalyzing ? 'Analizando...' : 'Iniciar Análisis IA'}
                        </button>
                    </div>
                    <Brain size={80} className="absolute -right-4 -bottom-4 text-white/5 rotate-12 group-hover:scale-110 transition-transform"/>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
                <div className="w-full lg:w-[60%] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2"><History size={16}/> Historial Cronológico</h3>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white dark:bg-slate-800 text-slate-400 font-black uppercase text-[9px] tracking-widest border-b z-20">
                                <tr>
                                    <th className="px-6 py-3">Sesión</th>
                                    <th className="px-6 py-3 text-center">Descuadres</th>
                                    <th className="px-6 py-3 text-center">Ver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                {history.map(session => (
                                    <tr key={session.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-black text-slate-800 dark:text-white text-xs uppercase">#{session.id}</div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase">{session.date}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">
                                                {session.items.filter(i => i.difference !== 0).length} Items
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => setSelectedSession(session)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Eye size={18}/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10 flex items-center justify-between">
                        <h3 className="font-black text-xs uppercase tracking-widest text-indigo-900 dark:text-indigo-200 flex items-center gap-2"><Brain size={16} className="text-indigo-600"/> Reporte IA</h3>
                        {aiAnalysis && <button onClick={() => setAiAnalysis(null)} className="text-slate-400 hover:text-red-500 transition-colors"><RotateCcw size={14}/></button>}
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {!aiAnalysis ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                <ShieldCheck size={40} className="text-indigo-100 mb-4"/>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-relaxed">Inicie el análisis para detectar patrones.</p>
                            </div>
                        ) : (
                            <div className="prose prose-slate dark:prose-invert max-w-none text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                <ReactMarkdown>
                                    {aiAnalysis}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {selectedSession && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-slate-800 font-black uppercase text-[10px] flex items-center gap-2"><X size={16}/> Cerrar</button>
                            <h3 className="font-black text-sm text-slate-800 dark:text-white uppercase">Sesión #{selectedSession.id}</h3>
                            <Info size={18} className="text-indigo-600"/>
                        </div>
                        <div className="flex-1 overflow-auto p-6 text-[11px]">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-400 font-black uppercase border-b">
                                    <tr>
                                        <th className="px-5 py-4">Artículo</th>
                                        <th className="px-5 py-4 text-center">Diferencia</th>
                                        <th className="px-5 py-4 text-right">Impacto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSession.items.map((item, i) => {
                                        const product = products.find(p => p.id === item.productId);
                                        const cost = product?.cost || (product?.price ? product.price * 0.7 : 0);
                                        const impact = item.difference * cost;
                                        return (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-700/50">
                                                <td className="px-5 py-3 font-black text-slate-700 dark:text-slate-300 uppercase">{item.productName}</td>
                                                <td className={`px-5 py-3 text-center font-black ${item.difference !== 0 ? 'text-amber-500' : 'text-slate-300'}`}>{item.difference}</td>
                                                <td className={`px-5 py-3 text-right font-black ${impact >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>S/ {impact.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAuditModule;