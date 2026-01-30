
import React, { useMemo, useState } from 'react';
import { SaleRecord, CashMovement, Product } from '../types';
import { PieChart, BarChart, Award, Lightbulb, Brain, RefreshCw, Info, Target } from 'lucide-react';
// FIX: Use correctly named SDK import from @google/genai
import { GoogleGenAI } from "@google/genai";

const DailyProfitChart: React.FC<{ data: { day: string; profit: number }[] }> = ({ data }) => {
    const maxProfit = Math.max(...data.map(d => d.profit), 1);
    const minProfit = Math.min(...data.map(d => d.profit), 0);
    const range = maxProfit - minProfit;

    return (
        <div className="h-64 flex items-end gap-3 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-inner">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full h-full flex items-end">
                        <div 
                            className={`w-full rounded-t-xl group-hover:brightness-110 transition-all duration-500 ${d.profit >= 0 ? 'bg-emerald-500/20 dark:bg-emerald-500/10 border-t-4 border-emerald-500' : 'bg-rose-500/20 dark:bg-rose-500/10 border-t-4 border-rose-500'}`}
                            style={{ height: `${(Math.abs(d.profit) / range) * 100}%`, transform: d.profit < 0 ? `translateY(-${(minProfit / range) * 100}%)` : '' }}
                        ></div>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 shadow-xl z-10 whitespace-nowrap">
                            S/ {d.profit.toFixed(2)}
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{d.day}</span>
                </div>
            ))}
        </div>
    );
};

const ProfitReportModule: React.FC<{ salesHistory: SaleRecord[], cashMovements: CashMovement[], products: Product[] }> = ({ salesHistory, cashMovements, products }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string | null>(null);

    const profitData = useMemo(() => {
        const totalSales = salesHistory.reduce((acc, sale) => acc + sale.total, 0);

        const cmv = salesHistory.flatMap(s => s.items).reduce((acc, item) => {
            const product = products.find(p => p.id === item.id);
            const productCost = product?.cost || item.price * 0.7; 
            return acc + (productCost * item.quantity);
        }, 0);
        
        const operatingExpenses = cashMovements
            .filter(m => m.type === 'Egreso' && m.category !== 'Compra' && m.category !== 'DEVOLUCION')
            .reduce((acc, m) => acc + m.amount, 0);
            
        const netProfit = totalSales - cmv - operatingExpenses;
        const profitMargin = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

        const productProfit: { [key: string]: { name: string, profit: number, margin: number } } = {};
        salesHistory.forEach(sale => {
            sale.items.forEach(item => {
                if (!productProfit[item.id]) {
                    productProfit[item.id] = { name: item.name, profit: 0, margin: 0 };
                }
                const cost = products.find(p => p.id === item.id)?.cost || item.price * 0.7;
                const gain = (item.price - cost) * item.quantity;
                productProfit[item.id].profit += gain;
                productProfit[item.id].margin = item.price > 0 ? ((item.price - cost) / item.price) * 100 : 0;
            });
        });

        const topProfitableProducts = Object.values(productProfit)
            .sort((a, b) => b.profit - a.profit)
            .slice(0, 5);

        const today = new Date();
        const dailyData: { [key: string]: { sales: number, cmv: number } } = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            dailyData[d.toLocaleDateString('es-PE')] = { sales: 0, cmv: 0 };
        }

        salesHistory.forEach(s => {
            if (dailyData[s.date] !== undefined) {
                dailyData[s.date].sales += s.total;
                dailyData[s.date].cmv += s.items.reduce((acc, item) => {
                    const product = products.find(p => p.id === item.id);
                    return acc + ((product?.cost || item.price * 0.7) * item.quantity);
                }, 0);
            }
        });

        const profitChartData = Object.keys(dailyData).map(dateKey => {
            const dateParts = dateKey.split('/');
            const date = new Date(+dateParts[2], +dateParts[1] - 1, +dateParts[0]);
            const data = dailyData[dateKey];
            return {
                day: date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.',''),
                profit: data.sales - data.cmv 
            };
        });
        
        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthlyProfitProjection = (netProfit / (dayOfMonth || 1)) * daysInMonth;

        return { totalSales, cmv, operatingExpenses, netProfit, profitMargin, topProfitableProducts, profitChartData, monthlyProfitProjection };
    }, [salesHistory, cashMovements, products]);

    // --- LÓGICA DE IA GEMINI CORREGIDA ---
    const runAiAnalysis = async () => {
        setIsAnalyzing(true);
        setAiInsight(null);
        try {
            // FIX: Initialize GoogleGenAI with named parameter using process.env.API_KEY
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const prompt = `Analiza estos datos financieros de mi negocio:
            - Ventas Totales: S/ ${profitData.totalSales.toFixed(2)}
            - Costo de Mercadería (CMV): S/ ${profitData.cmv.toFixed(2)}
            - Gastos Operativos: S/ ${profitData.operatingExpenses.toFixed(2)}
            - Utilidad Neta: S/ ${profitData.netProfit.toFixed(2)}
            - Margen Neto: ${profitData.profitMargin.toFixed(2)}%
            
            Dame 3 consejos estratégicos muy breves y directos para aumentar la utilidad. Sé profesional.`;

            // FIX: Use ai.models.generateContent instead of deprecated getGenerativeModel
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: prompt,
            });
            
            // FIX: Extract text directly from property
            setAiInsight(response.text || "No se pudo generar un análisis.");
        } catch (error) {
            console.error("Error IA:", error);
            setAiInsight("Error al conectar con la IA. Verifique su API_KEY y la instalación de @google/genai.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-5 animate-in fade-in duration-500">
            {/* Header y Acción IA */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                        <PieChart size={24}/>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">Reporte de Utilidades</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análisis de rentabilidad neta y CMV</p>
                    </div>
                </div>
                <button 
                    onClick={runAiAnalysis}
                    disabled={isAnalyzing}
                    className="bg-slate-900 dark:bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                >
                    {isAnalyzing ? <RefreshCw size={14} className="animate-spin"/> : <Brain size={14} className="text-indigo-400 dark:text-white"/>}
                    Diagnóstico IA
                </button>
            </div>

            {/* KPIs Principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm border-l-4 border-l-blue-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas Brutas</p>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">S/ {profitData.totalSales.toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm border-l-4 border-l-orange-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Costo (CMV)</p>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">- S/ {profitData.cmv.toFixed(2)}</div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm border-l-4 border-l-rose-500">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Gasto Operativo</p>
                    <div className="text-2xl font-black text-slate-800 dark:text-white">- S/ {profitData.operatingExpenses.toFixed(2)}</div>
                </div>
                <div className="bg-emerald-600 text-white p-6 rounded-[2.5rem] shadow-xl shadow-emerald-600/20 flex flex-col justify-center border border-white/10 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-1">Utilidad Neta</p>
                        <div className="text-3xl font-black">S/ {profitData.netProfit.toFixed(2)}</div>
                        <div className="mt-2 flex items-center gap-1.5">
                            <span className="bg-white/20 px-2 py-0.5 rounded-lg text-[10px] font-black">{profitData.profitMargin.toFixed(1)}% Margen</span>
                        </div>
                    </div>
                    <Target size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-12"/>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-5 min-h-0">
                {/* Gráfico Tendencia */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-8 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-white flex items-center gap-2">Tendencia de Utilidad Diaria</h3>
                        <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Proyección Mensual</span>
                            <p className="text-lg font-black text-emerald-600">S/ {profitData.monthlyProfitProjection.toFixed(2)}</p>
                        </div>
                    </div>
                    <DailyProfitChart data={profitData.profitChartData} />
                </div>

                {/* Inteligencia y Top */}
                <div className="flex flex-col gap-5">
                    <div className={`bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl transition-all duration-500 border border-white/10 ${aiInsight ? 'h-auto' : 'h-32 flex items-center justify-center'}`}>
                        {aiInsight ? (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Lightbulb size={14}/> Diagnóstico de IA</h4>
                                <p className="text-xs font-bold leading-relaxed italic text-indigo-50">"{aiInsight}"</p>
                            </div>
                        ) : (
                            <div className="text-center opacity-50">
                                <Brain size={32} className="mx-auto mb-2 text-indigo-400"/>
                                <p className="text-[9px] font-black uppercase tracking-widest">IA en espera de análisis...</p>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Award size={16} className="text-amber-500"/> Top Artículos por Ganancia</h4>
                        <div className="flex-1 space-y-3">
                            {profitData.topProfitableProducts.map((p, i) => (
                                <div key={i} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 transition-all">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase truncate pr-2">{p.name}</p>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Margen: {p.margin.toFixed(0)}%</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9px] font-black text-emerald-600 block">+S/ {p.profit.toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shrink-0">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm text-slate-400"><Info size={16}/></div>
                <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed tracking-tighter max-w-2xl">
                    Este reporte calcula la utilidad neta restando el costo promedio de inventario (CMV) y los gastos registrados en caja.
                </p>
            </div>
        </div>
    );
};

export default ProfitReportModule;
