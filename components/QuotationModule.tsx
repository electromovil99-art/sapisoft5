
import React from 'react';
import { ClipboardList, Trash2, Upload, FileText } from 'lucide-react';
import { Quotation } from '../types';

interface QuotationModuleProps {
    quotations: Quotation[];
    onLoadQuotation: (quotation: Quotation) => void;
    onDeleteQuotation: (id: string) => void;
}

const QuotationModule: React.FC<QuotationModuleProps> = ({ quotations, onLoadQuotation, onDeleteQuotation }) => {
    
    const handleDelete = (id: string, name: string) => {
        if(confirm(`¿Estás seguro de que deseas eliminar la cotización de "${name}"? Esta acción no se puede deshacer.`)) {
            onDeleteQuotation(id);
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardList className="text-blue-500"/> Cotizaciones Guardadas
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Recupera ventas no finalizadas o guarda proformas para tus clientes.
                </p>
            </div>

            {quotations.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <FileText size={48} strokeWidth={1}/>
                    <p className="mt-4 font-medium">No hay cotizaciones guardadas.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto space-y-4">
                    {quotations.map(q => (
                        <div key={q.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center group">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <FileText size={20}/>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-white">Cotización #{q.id.substring(0, 6)}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        {q.date} {q.time} - {q.clientName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 text-right">Total</p>
                                    <p className="font-bold text-lg text-blue-600 dark:text-blue-400">S/ {q.total.toFixed(2)}</p>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
                                <button onClick={() => onLoadQuotation(q)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors">
                                    <Upload size={16}/> Cargar Venta
                                </button>
                                <button onClick={() => handleDelete(q.id, q.clientName)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuotationModule;
