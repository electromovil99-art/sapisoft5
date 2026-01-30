
import React, { useState } from 'react';
import { History, Eye, X, Unlock, Lock, TrendingUp, TrendingDown, Landmark, Banknote } from 'lucide-react';
import { CashBoxSession, BankAccount } from '../types';

interface CashBoxHistoryProps {
    sessions: CashBoxSession[];
    bankAccounts: BankAccount[];
}

const DetailRow: React.FC<{ label: string; value: string | number; isAmount?: boolean; color?: string }> = ({ label, value, isAmount, color }) => (
    <div className="flex justify-between py-1.5">
        <span className="text-slate-500 dark:text-slate-400 text-xs">{label}:</span>
        <span className={`font-bold text-xs ${color || 'text-slate-700 dark:text-slate-200'}`}>
            {isAmount ? `S/ ${(Number(value) || 0).toFixed(2)}` : value}
        </span>
    </div>
);


const CashBoxHistoryModule: React.FC<CashBoxHistoryProps> = ({ sessions, bankAccounts }) => {
    const [selectedSession, setSelectedSession] = useState<CashBoxSession | null>(null);

    const getDiffColor = (diff: number) => {
        if (Math.abs(diff) < 0.01) return 'text-slate-500';
        return diff > 0 ? 'text-emerald-500' : 'text-red-500';
    }

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <History className="text-slate-400"/> Historial de Cajas
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Consulta el registro detallado de cada apertura y cierre de caja para auditoría.
                </p>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="h-full overflow-auto">
                    <table className="w-full modern-table text-sm">
                        <thead>
                            <tr>
                                <th>Sesión ID</th>
                                <th>Apertura</th>
                                <th>Cierre</th>
                                <th className="text-right">Dif. Apertura</th>
                                <th className="text-right">Dif. Cierre</th>
                                <th className="text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => (
                                <tr key={s.id}>
                                    <td className="font-mono text-xs text-slate-500">#{s.id.substring(2,8)}</td>
                                    <td>
                                        <div className="font-bold text-slate-700 dark:text-white">{s.openingDate}</div>
                                        <div className="text-xs text-slate-400">por {s.openingUser}</div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-slate-700 dark:text-white">{s.closingDate}</div>
                                        <div className="text-xs text-slate-400">por {s.closingUser}</div>
                                    </td>
                                    <td className={`text-right font-bold ${getDiffColor(s.openingDifference)}`}>
                                        S/ {s.openingDifference.toFixed(2)}
                                    </td>
                                    <td className={`text-right font-bold ${getDiffColor(s.cashDifferenceAtClose)}`}>
                                        S/ {s.cashDifferenceAtClose.toFixed(2)}
                                    </td>
                                    <td className="text-center">
                                        <button onClick={() => setSelectedSession(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                            <Eye size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSession && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
                        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-700 shrink-0">
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Detalle de Sesión #{selectedSession.id.substring(2,8)}</h3>
                            <button onClick={() => setSelectedSession(null)}><X size={20}/></button>
                        </div>
                        <div className="p-6 flex-1 grid grid-cols-2 gap-8 overflow-y-auto">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><Unlock size={16} className="text-primary-500"/> Apertura de Caja</h4>
                                <DetailRow label="Fecha y Hora" value={selectedSession.openingDate} />
                                <DetailRow label="Usuario" value={selectedSession.openingUser} />
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Banknote size={12}/> Resumen Efectivo</h5>
                                    <DetailRow label="Saldo Esperado" value={selectedSession.expectedOpening} isAmount />
                                    <DetailRow label="Saldo Contado" value={selectedSession.countedOpening} isAmount />
                                    <DetailRow label="Diferencia" value={selectedSession.openingDifference} isAmount color={getDiffColor(selectedSession.openingDifference)} />
                                </div>
                                {selectedSession.confirmedDigitalAtOpen && Object.keys(selectedSession.confirmedDigitalAtOpen).length > 0 && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> Saldos Bancarios Confirmados (Apertura)</h5>
                                        {Object.entries(selectedSession.confirmedDigitalAtOpen).map(([accountId, amount]) => {
                                            const account = bankAccounts.find(b => b.id === accountId);
                                            return <DetailRow key={accountId} label={account?.alias || 'Cuenta Desconocida'} value={amount} isAmount />;
                                        })}
                                    </div>
                                )}
                                {selectedSession.openingNotes && <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400"><strong>Notas:</strong> {selectedSession.openingNotes}</p>
                                </div>}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2"><Lock size={16} className="text-red-500"/> Cierre de Caja</h4>
                                <DetailRow label="Fecha y Hora" value={selectedSession.closingDate} />
                                <DetailRow label="Usuario" value={selectedSession.closingUser} />
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Banknote size={12}/> Resumen Efectivo</h5>
                                    <DetailRow label="Saldo Sistema" value={selectedSession.expectedCashAtClose} isAmount />
                                    <DetailRow label="Saldo Contado" value={selectedSession.countedCashAtClose} isAmount />
                                    <DetailRow label="Diferencia" value={selectedSession.cashDifferenceAtClose} isAmount color={getDiffColor(selectedSession.cashDifferenceAtClose)} />
                                </div>
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1"><Landmark size={12}/> Saldos Bancarios Confirmados (Cierre)</h5>
                                    {Object.entries(selectedSession.confirmedDigitalAtClose).map(([accountId, amount]) => {
                                        const account = bankAccounts.find(b => b.id === accountId);
                                        return <DetailRow key={accountId} label={account?.alias || 'Cuenta Desconocida'} value={amount} isAmount />;
                                    })}
                                </div>
                                {selectedSession.closingNotes && <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <p className="text-xs text-slate-400"><strong>Notas:</strong> {selectedSession.closingNotes}</p>
                                </div>}
                            </div>
                        </div>
                        <div className="p-4 bg-slate-100 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                            <button onClick={() => setSelectedSession(null)} className="px-6 py-2 bg-slate-600 text-white font-bold rounded-lg">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashBoxHistoryModule;
