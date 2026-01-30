
import React, { useMemo } from 'react';
import { Brain, TrendingUp, TrendingDown, Target, AlertCircle, Lightbulb, ArrowRight } from 'lucide-react';
import { Product, CashMovement, SaleRecord } from '../types';

interface FinancialStrategyProps {
    products: Product[];
    salesHistory: SaleRecord[];
    cashMovements: CashMovement[];
    onAddCashMovement: (movement: CashMovement) => void;
}

export const FinancialStrategyModule: React.FC<FinancialStrategyProps> = ({ products, salesHistory, cashMovements }) => {
    
    // --- AI ANALYSIS LOGIC ---
    const aiInsights = useMemo(() => {
        const insights = [];
        
        // 1. Stock Stagnation Analysis
        const lowRotationProducts = products.filter(p => p.stock > 10 && p.price > 100); 
        if (lowRotationProducts.length > 0) {
            insights.push({
                type: 'warning',
                title: 'Capital Estancado Detectado',
                message: `Tienes ${lowRotationProducts.length} productos con alto stock y valor que no rotan. Considera una liquidación o combo.`,
                action: 'Crear Promoción'
            });
        }

        // 2. Best Sellers
        const productSalesCount: {[key:string]: number} = {};
        salesHistory.forEach(sale => {
            sale.items.forEach(item => {
                productSalesCount[item.id] = (productSalesCount[item.id] || 0) + item.quantity;
            });
        });
        const topProductId = Object.keys(productSalesCount).sort((a,b) => productSalesCount[b] - productSalesCount[a])[0];
        const topProduct = products.find(p => p.id === topProductId);
        
        if (topProduct) {
            insights.push({
                type: 'opportunity',
                title: 'Producto Estrella',
                message: `El producto "${topProduct.name}" es tu mayor venta. Asegura stock y negocia mejor precio con proveedores.`,
                action: 'Ver Proveedor'
            });
        }

        // 3. Fixed Costs Alert
        const fixedExpenses = cashMovements
            .filter(m => m.type === 'Egreso' && m.financialType === 'Fijo')
            .reduce((sum, m) => sum + m.amount, 0);
        
        const totalIncome = cashMovements
            .filter(m => m.type === 'Ingreso')
            .reduce((sum, m) => sum + m.amount, 0);

        if (totalIncome > 0 && (fixedExpenses / totalIncome) > 0.5) {
            insights.push({
                type: 'danger',
                title: 'Costos Fijos Altos',
                message: `Tus costos fijos representan el ${((fixedExpenses/totalIncome)*100).toFixed(0)}% de tus ingresos. Es un nivel riesgoso.`,
                action: 'Revisar Gastos'
            });
        } else {
             insights.push({
                type: 'success',
                title: 'Salud Financiera Estable',
                message: `Tus costos fijos están controlados. Tienes margen para invertir en crecimiento (Marketing o Nuevos Productos).`,
                action: 'Ver Inversiones'
            });
        }

        return insights;
    }, [products, salesHistory, cashMovements]);

    return (
        <div className="flex flex-col h-full gap-6">
            
            {/* CONTENT AREA: ONLY AI ANALYSIS */}
            <div className="flex-1 overflow-auto space-y-6 animate-in fade-in">
                <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 dark:from-indigo-950 dark:to-indigo-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                            <Brain className="text-indigo-300"/> SapiSoft Intelligence
                        </h2>
                        <p className="text-indigo-100 max-w-2xl">
                            He analizado tus movimientos de caja, inventario y ventas históricas. 
                            Aquí tienes mis recomendaciones estratégicas para mejorar la rentabilidad de tu negocio.
                        </p>
                    </div>
                    <Brain size={200} className="absolute -right-10 -bottom-20 text-white/5 rotate-12"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aiInsights.map((insight, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col group">
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-full ${
                                    insight.type === 'warning' ? 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400' :
                                    insight.type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                                    insight.type === 'opportunity' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                                    'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
                                }`}>
                                    {insight.type === 'warning' ? <AlertCircle size={24}/> :
                                        insight.type === 'danger' ? <TrendingDown size={24}/> :
                                        insight.type === 'opportunity' ? <Lightbulb size={24}/> :
                                        <TrendingUp size={24}/>}
                                </div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{insight.title}</h3>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 flex-1">
                                {insight.message}
                            </p>
                            <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all self-start">
                                {insight.action} <ArrowRight size={16}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FinancialStrategyModule;
