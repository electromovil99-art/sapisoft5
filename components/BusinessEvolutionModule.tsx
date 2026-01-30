
import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Users, Activity, ArrowUpRight, Edit3, Calendar, Filter } from 'lucide-react';
import { Product, Client, CashMovement } from '../types';

interface BusinessEvolutionProps {
    products: Product[];
    clients: Client[];
    movements: CashMovement[];
}

type TimeFrame = '7D' | '4W' | '6M';

export const BusinessEvolutionModule: React.FC<BusinessEvolutionProps> = ({ products, clients, movements }) => {
    
    // Estado para filtros de tiempo
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('6M');
    
    // Estado para el Tooltip del gráfico (evita parpadeo CSS)
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // 1. Calcular Valores Actuales (Real Time)
    const liquidAssets = useMemo(() => 
        movements.reduce((acc, m) => m.type === 'Ingreso' ? acc + m.amount : acc - m.amount, 0),
    [movements]);

    const inventoryVal = useMemo(() => 
        products.reduce((acc, p) => acc + (p.price * p.stock), 0),
    [products]);

    const receivables = useMemo(() => 
        clients.reduce((acc, c) => acc + (c.creditUsed || 0), 0),
    [clients]);

    // Inicializamos Ctas x Pagar UNA sola vez para que sea "fijo" y no fluctúe automáticamente
    const [manualPayables, setManualPayables] = useState<number>(() => {
        // Valor inicial estimado (15% del inventario)
        return products.reduce((acc, p) => acc + (p.price * p.stock), 0) * 0.15;
    });

    // Fórmula: (Activos Liq + Inv + Cuentas Cobrar) - Cuentas Pagar
    const netGrowth = (liquidAssets + inventoryVal + receivables) - manualPayables;

    // 2. Generar Datos Históricos Simulados según el Filtro de Tiempo
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let dataPoints: { label: string, value: number }[] = [];
        
        // Configuración de etiquetas según el filtro
        if (timeFrame === '7D') {
            const days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
            const today = new Date();
            const currentDayIndex = today.getDay(); // 0 for Sunday, 1 for Monday, etc.
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                labels.push(days[d.getDay()]);
            }
        } else if (timeFrame === '4W') {
            labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4 (Act)'];
        } else {
            labels = ['Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene (Act)']; // Simplified month labels
        }

        // Generamos los datos simulados
        let baseValue = netGrowth * 0.7; // Empezamos un 30% abajo
        
        for (let i = 0; i < labels.length; i++) {
            const isLast = i === labels.length - 1;
            
            if (isLast) {
                // El último punto siempre es el dato REAL actual
                dataPoints.push({ label: labels[i], value: netGrowth });
            } else {
                // Simulación de volatilidad
                const randomFactor = 0.95 + Math.random() * 0.15; 
                // Interpolación lineal hacia el valor real
                const progress = i / labels.length;
                let interpolated = baseValue + ((netGrowth - baseValue) * progress);
                interpolated = interpolated * randomFactor;
                
                dataPoints.push({ label: labels[i], value: interpolated });
            }
        }
        return dataPoints;
    }, [netGrowth, timeFrame]);

    // 3. Configuración del Gráfico SVG
    const width = 800;
    const height = 300;
    const padding = 40;
    const maxValue = Math.max(...chartData.map(d => d.value)) * 1.1; // 10% margen arriba
    const minValue = Math.min(0, Math.min(...chartData.map(d => d.value))) * 1.1; // Margen abajo si es negativo

    const getX = (index: number) => padding + (index * (width - 2 * padding) / (chartData.length - 1));
    const getY = (value: number) => height - padding - ((value - minValue) / (maxValue - minValue) * (height - 2 * padding));

    // Generar path de la línea
    const linePath = chartData.map((d, i) => 
        `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.value)}`
    ).join(' ');

    // Generar area bajo la curva (gradiente)
    const areaPath = `${linePath} L ${getX(chartData.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

    return (
        <div className="flex flex-col gap-6 h-full pb-10">
            
            {/* Header con Fórmula */}
            <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-100 dark:border-slate-700 transition-colors">
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                                <Activity className="text-emerald-500 dark:text-emerald-400"/> Evolución Empresarial
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-2xl">
                                Salud financiera basada en activos líquidos, inventario y cuentas por cobrar vs obligaciones.
                            </p>
                        </div>
                        {/* Selector de Tiempo en el Header */}
                        <div className="bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg flex gap-1 border border-slate-200 dark:border-slate-600">
                            <button 
                                onClick={() => setTimeFrame('7D')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeFrame === '7D' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                7 Días
                            </button>
                            <button 
                                onClick={() => setTimeFrame('4W')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeFrame === '4W' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                4 Sem
                            </button>
                            <button 
                                onClick={() => setTimeFrame('6M')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${timeFrame === '6M' ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                            >
                                6 Meses
                            </button>
                        </div>
                    </div>
                    
                    {/* La Fórmula Visual */}
                    <div className="bg-slate-50 dark:bg-black/20 backdrop-blur-md p-4 rounded-xl border border-slate-200 dark:border-white/10 inline-flex flex-col md:flex-row items-center gap-4 font-mono text-sm shadow-inner w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">Crecimiento Neto</span>
                            <span className="text-slate-400">=</span>
                        </div>
                        <div className="flex flex-wrap justify-center items-center gap-2 bg-white dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                            <span className="text-blue-600 dark:text-blue-300 font-bold" title="Caja + Bancos">Activos Líquidos</span>
                            <span className="text-slate-400">+</span>
                            <span className="text-orange-600 dark:text-orange-300 font-bold" title="Valor Stock">Inventario</span>
                            <span className="text-slate-400">+</span>
                            <span className="text-purple-600 dark:text-purple-300 font-bold" title="Créditos Clientes">Cuentas x Cobrar</span>
                        </div>
                        <div className="font-bold text-xl text-slate-400">-</div>
                        <div className="bg-red-50 dark:bg-red-500/20 px-3 py-1 rounded-lg text-red-600 dark:text-red-300 font-bold border border-red-100 dark:border-red-500/30">
                            Cuentas x Pagar
                        </div>
                    </div>
                </div>
                {/* Background Decor */}
                <TrendingUp className="absolute right-0 bottom-0 text-slate-100 dark:text-white/5 w-64 h-64 -mr-10 -mb-10 pointer-events-none"/>
            </div>

            {/* Tarjetas de Variables */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Activos Líquidos */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-blue-500">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Activos Líquidos</span>
                        <DollarSign size={16} className="text-blue-500"/>
                    </div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">S/ {liquidAssets.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Caja + Bancos</div>
                </div>

                {/* Inventario */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-orange-500">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Inventario</span>
                        <Package size={16} className="text-orange-500"/>
                    </div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">S/ {inventoryVal.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Valorizado Precio Venta</div>
                </div>

                {/* Cuentas por Cobrar */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-purple-500">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">Ctas. x Cobrar</span>
                        <Users size={16} className="text-purple-500"/>
                    </div>
                    <div className="text-xl font-bold text-slate-800 dark:text-white">S/ {receivables.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Crédito Clientes</div>
                </div>

                {/* Cuentas por Pagar (Editable) */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 border-l-4 border-l-red-500 relative group">
                    <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-red-500 uppercase flex items-center gap-1">Ctas. x Pagar <Edit3 size={10}/></span>
                        <TrendingDown size={16} className="text-red-500"/>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">S/</span>
                        <input 
                            type="number" 
                            className="w-full text-xl font-bold text-slate-800 dark:text-white border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-red-500 outline-none bg-transparent p-0 transition-colors"
                            value={manualPayables}
                            onChange={(e) => setManualPayables(Number(e.target.value))}
                        />
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                         Valor Fijo (Editable)
                    </div>
                </div>
            </div>

            {/* Gráfico Principal */}
            <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                             <Calendar size={18} className="text-slate-400"/>
                             Tendencia de Crecimiento
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Vista: {timeFrame === '7D' ? 'Última Semana' : timeFrame === '4W' ? 'Último Mes' : 'Último Semestre'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-2">
                            {netGrowth >= (chartData[0]?.value || 0) ? <ArrowUpRight size={24}/> : <TrendingDown size={24}/>}
                            S/ {netGrowth.toFixed(2)}
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Actual Neto</p>
                    </div>
                </div>

                {/* Contenedor del Gráfico */}
                <div className="flex-1 w-full min-h-[300px] relative">
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
                        {/* Definiciones de Gradiente */}
                        <defs>
                            <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.1"/>
                            </filter>
                        </defs>

                        {/* Líneas de cuadrícula (Grid) */}
                        {[0, 1, 2, 3, 4].map(i => {
                            const y = height - padding - (i * (height - 2 * padding) / 4);
                            return (
                                <g key={i}>
                                    <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeOpacity="0.5" className="dark:stroke-slate-700" strokeDasharray="4 4" />
                                    <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 dark:fill-slate-500">
                                        {Math.round(minValue + (i * (maxValue - minValue) / 4) / 1000)}k
                                    </text>
                                </g>
                            );
                        })}

                        {/* Área bajo la curva */}
                        <path d={areaPath} fill="url(#gradientArea)" />

                        {/* Línea Principal */}
                        <path d={linePath} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#shadow)"/>

                        {/* Puntos Interactivos */}
                        {chartData.map((d, i) => (
                            <g 
                                key={i} 
                                // Usamos eventos React para controlar el estado
                                onMouseEnter={() => setHoveredIndex(i)}
                                onMouseLeave={() => setHoveredIndex(null)}
                                style={{ cursor: 'pointer' }}
                            >
                                {/* Zona de impacto invisible más grande para facilitar el hover */}
                                <circle 
                                    cx={getX(i)} 
                                    cy={getY(d.value)} 
                                    r="15" 
                                    fill="transparent" 
                                />
                                
                                {/* Círculo visible */}
                                <circle 
                                    cx={getX(i)} 
                                    cy={getY(d.value)} 
                                    r={hoveredIndex === i ? 7 : 5} // Se agranda si está seleccionado por estado
                                    fill="white" 
                                    className="dark:fill-slate-900"
                                    stroke="#10b981" 
                                    strokeWidth="3"
                                />

                                {/* Tooltip Controlado por Estado (Sin Parpadeo) */}
                                {hoveredIndex === i && (
                                    <g className="pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                        <rect 
                                            x={getX(i) - 45} 
                                            y={getY(d.value) - 45} 
                                            width="90" 
                                            height="34" 
                                            rx="6" 
                                            fill="#1e293b" 
                                            filter="url(#shadow)"
                                        />
                                        <text x={getX(i)} y={getY(d.value) - 24} textAnchor="middle" fill="white" className="text-xs font-bold">
                                            S/ {d.value.toFixed(0)}
                                        </text>
                                        <path d={`M ${getX(i)-6} ${getY(d.value)-12} L ${getX(i)} ${getY(d.value)-6} L ${getX(i)+6} ${getY(d.value)-12}`} fill="#1e293b"/>
                                    </g>
                                )}

                                {/* Etiqueta Eje X */}
                                <text x={getX(i)} y={height - 10} textAnchor="middle" className={`text-xs font-bold transition-colors ${hoveredIndex === i ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-slate-500 dark:fill-slate-400'}`}>
                                    {d.label}
                                </text>
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
        </div>
    );
};

export default BusinessEvolutionModule;