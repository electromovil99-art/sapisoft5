
import React, { useMemo } from 'react';
import { SaleRecord } from '../types';
import { BarChart, DollarSign, Package, TrendingUp, ArrowRight, ShoppingCart } from 'lucide-react';

const DailySalesChart: React.FC<{ data: { day: string; total: number }[] }> = ({ data }) => {
    const maxSale = Math.max(...data.map(d => d.total), 1);
    
    return (
        <div className="h-64 flex items-end gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="relative w-full h-full flex items-end">
                        <div 
                            className="w-full bg-primary-100 dark:bg-primary-900/20 rounded-t-md group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-all"
                            style={{ height: `${(d.total / maxSale) * 100}%` }}
                        ></div>
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            S/ {d.total.toFixed(2)}
                        </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">{d.day}</span>
                </div>
            ))}
        </div>
    );
};

const SalesReportModule: React.FC<{ salesHistory: SaleRecord[] }> = ({ salesHistory }) => {
    
    const salesData = useMemo(() => {
        const totalSales = salesHistory.reduce((acc, sale) => acc + sale.total, 0);
        const totalTransactions = salesHistory.length;
        const averageTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;
        const totalItemsSold = salesHistory.flatMap(s => s.items).reduce((acc, item) => acc + item.quantity, 0);

        const today = new Date();
        const salesByDay: { [key: string]: number } = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dayKey = d.toLocaleDateString('es-PE');
            salesByDay[dayKey] = 0;
        }

        salesHistory.forEach(sale => {
            if (salesByDay[sale.date] !== undefined) {
                salesByDay[sale.date] += sale.total;
            }
        });
        
        const chartData = Object.keys(salesByDay).map(dateKey => {
            const date = new Date(dateKey.split('/').reverse().join('-'));
            return {
                day: date.toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
                total: salesByDay[dateKey]
            };
        });

        const dayOfMonth = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const monthlyProjection = (totalSales / (dayOfMonth || 1)) * daysInMonth;

        return { totalSales, averageTicket, totalItemsSold, chartData, monthlyProjection };
    }, [salesHistory]);

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TrendingUp className="text-primary-500"/> Reporte de Ventas
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Análisis del rendimiento comercial y tendencias de ventas.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-5 rounded-xl border border-primary-100 dark:border-primary-800"><div className="text-primary-700 dark:text-primary-300 text-xs font-bold uppercase">Ventas Totales</div><div className="text-3xl font-bold text-primary-600 dark:text-primary-400">S/ {salesData.totalSales.toFixed(2)}</div></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700"><div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Ticket Promedio</div><div className="text-3xl font-bold text-slate-800 dark:text-white">S/ {salesData.averageTicket.toFixed(2)}</div></div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700"><div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Items Vendidos</div><div className="text-3xl font-bold text-slate-800 dark:text-white">{salesData.totalItemsSold}</div></div>
                <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 flex flex-col justify-center">
                    <div className="text-slate-400 text-xs font-bold uppercase flex items-center gap-1"><BarChart size={12}/> Proyección Mensual</div>
                    <div className="text-3xl font-bold text-white mt-1">S/ {salesData.monthlyProjection.toFixed(0)}</div>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-white mb-4">Ventas Últimos 7 Días</h3>
                    <DailySalesChart data={salesData.chartData} />
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden">
                    <h3 className="font-bold text-slate-700 dark:text-white p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">Ventas Recientes</h3>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-xs">
                            <tbody>
                                {salesHistory.slice(0, 10).map(sale => (
                                    <tr key={sale.id} className="border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                        <td className="p-3">
                                            <div className="font-bold text-slate-600 dark:text-slate-200">{sale.clientName}</div>
                                            <div className="text-slate-400 font-mono">#{sale.id} - {sale.date}</div>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="font-bold text-primary-600 dark:text-primary-400">S/ {sale.total.toFixed(2)}</div>
                                            <div className="text-slate-400">{sale.items.length} items</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReportModule;
