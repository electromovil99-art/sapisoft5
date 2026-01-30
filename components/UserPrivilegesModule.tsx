
import React, { useState } from 'react';
import { User, Shield, Check, Lock, Plus, Trash2, Edit2, Search, Users } from 'lucide-react';
import { SystemUser, UserRole } from '../types';

interface UserPrivilegesModuleProps {
    users: SystemUser[];
    onAddUser: (u: SystemUser) => void;
    onUpdateUser: (u: SystemUser) => void;
    onDeleteUser: (id: string) => void;
}

const ALL_PERMISSIONS = {
    VENTAS: ['Acceso Módulo', 'Realizar Venta', 'Anular Venta', 'Ver Historial'],
    INVENTARIO: ['Acceso Módulo', 'Ver Stock', 'Agregar Productos', 'Eliminar Productos'],
    CAJA: ['Acceso Módulo', 'Ver Saldos', 'Registrar Movimiento', 'Cerrar Caja']
};

export const UserPrivilegesModule: React.FC<UserPrivilegesModuleProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser }) => {
    const [selectedUser, setSelectedUser] = useState<SystemUser | null>(users[0] || null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<Partial<SystemUser>>({ fullName: '', username: '', password: '', role: 'VENDEDOR' });

    const handleSaveUser = () => {
        if (!formData.username || !formData.fullName) return alert("Complete datos");
        onAddUser({ id: Math.random().toString(), fullName: formData.fullName!, username: formData.username!, password: formData.password || '123', role: formData.role!, active: true, permissions: [] } as SystemUser);
        setShowModal(false);
    };

    const togglePermission = (perm: string) => {
        if (!selectedUser) return;
        const newPerms = selectedUser.permissions.includes(perm) ? selectedUser.permissions.filter(p => p !== perm) : [...selectedUser.permissions, perm];
        onUpdateUser({ ...selectedUser, permissions: newPerms });
    };

    return (
        <div className="flex h-full gap-6">
            <div className="w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-slate-50 dark:bg-slate-900"><h3 className="font-bold flex gap-2"><Users size={18}/> Usuarios</h3></div>
                <div className="flex-1 overflow-y-auto p-2">
                    {users.map(user => (
                        <button key={user.id} onClick={() => setSelectedUser(user)} className={`w-full flex items-center gap-3 p-3 rounded-xl text-left ${selectedUser?.id === user.id ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50'}`}>
                            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">{user.fullName[0]}</div>
                            <div><div className="font-bold text-sm text-slate-700">{user.fullName}</div><div className="text-xs text-slate-400">{user.role}</div></div>
                        </button>
                    ))}
                </div>
                <div className="p-4"><button onClick={() => setShowModal(true)} className="w-full py-2 bg-slate-800 text-white rounded-lg font-bold text-sm flex justify-center gap-2"><Plus size={16}/> Nuevo Usuario</button></div>
            </div>
            {selectedUser && (
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex gap-3 items-center"><div className="w-10 h-10 bg-indigo-600 rounded-lg text-white flex items-center justify-center">{selectedUser.fullName[0]}</div>{selectedUser.fullName}</h2>
                        <button onClick={() => onDeleteUser(selectedUser.id)} className="text-red-500 hover:bg-red-50 px-3 py-1 rounded border border-red-200 text-sm font-bold flex gap-2"><Trash2 size={16}/> Eliminar Usuario</button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        {Object.entries(ALL_PERMISSIONS).map(([module, perms]) => (
                            <div key={module} className="border rounded-xl p-4">
                                <h4 className="font-bold text-slate-700 mb-3 border-b pb-2">{module}</h4>
                                <div className="space-y-2">
                                    {perms.map(perm => (
                                        <label key={perm} className="flex items-center gap-3 cursor-pointer">
                                            <input type="checkbox" checked={selectedUser.permissions.includes(perm) || selectedUser.role === 'ADMIN'} onChange={() => togglePermission(perm)} disabled={selectedUser.role === 'ADMIN'} className="w-4 h-4 text-indigo-600 rounded"/>
                                            <span className="text-sm text-slate-600">{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-[400px] p-6 space-y-4">
                        <h3 className="font-bold text-lg">Nuevo Usuario</h3>
                        <input className="w-full p-2 border rounded" placeholder="Nombre Completo" onChange={e => setFormData({...formData, fullName: e.target.value})}/>
                        <input className="w-full p-2 border rounded" placeholder="Usuario" onChange={e => setFormData({...formData, username: e.target.value})}/>
                        <input className="w-full p-2 border rounded" placeholder="Contraseña" type="password" onChange={e => setFormData({...formData, password: e.target.value})}/>
                        <select className="w-full p-2 border rounded" onChange={e => setFormData({...formData, role: e.target.value as UserRole})}><option value="VENDEDOR">Vendedor</option><option value="ADMIN">Admin</option></select>
                        <button onClick={handleSaveUser} className="w-full py-2 bg-indigo-600 text-white font-bold rounded">Crear</button>
                        <button onClick={() => setShowModal(false)} className="w-full py-2 text-slate-500">Cancelar</button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default UserPrivilegesModule;
