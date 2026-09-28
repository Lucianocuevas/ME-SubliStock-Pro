import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Shield,
  Palette,
  ShoppingBag,
  Wrench,
  Plus,
  Trash2,
  CheckCircle,
  Key,
  Mail,
  Phone
} from 'lucide-react';
import { AppUser, UserRole } from '../../types';
import { StorageService } from '../../services/storageService';
import { ROLE_LABELS } from '../../data/initialData';

interface Props {
  users: AppUser[];
  currentUser: AppUser;
  onUsersUpdated: () => void;
  onCurrentUserChanged: (user: AppUser) => void;
}

export const UsersView: React.FC<Props> = ({
  users,
  currentUser,
  onUsersUpdated,
  onCurrentUserChanged
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('vendedor');
  const [phone, setPhone] = useState('');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    StorageService.addUser({
      name: name.trim(),
      email: email.trim(),
      role,
      phone: phone.trim() || undefined,
      avatar: initials,
      status: 'activo',
      lastLogin: new Date().toISOString()
    });

    setName('');
    setEmail('');
    setPhone('');
    setIsAddingUser(false);
    onUsersUpdated();
  };

  const handleDeleteUser = (id: string) => {
    if (users.length <= 1) {
      alert('Debe existir al menos un usuario en el sistema.');
      return;
    }
    if (id === currentUser.id) {
      alert('No puedes eliminar el usuario con el que estás conectado actualmente.');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      StorageService.deleteUser(id);
      onUsersUpdated();
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    StorageService.updateUser(userId, { role: newRole });
    onUsersUpdated();
  };

  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case 'admin':
        return Shield;
      case 'disenador':
        return Palette;
      case 'vendedor':
        return ShoppingBag;
      case 'produccion':
        return Wrench;
      default:
        return Users;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Gestión de Usuarios & Roles de Acceso</h2>
            <span className="text-xs bg-purple-500/20 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-500/30">
              RBAC Multi-Rol
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Control de permisos diferenciados para Administradores, Diseñadores/Sublimadores, Vendedores y Operadores de Taller.
          </p>
        </div>

        <button
          onClick={() => setIsAddingUser(!isAddingUser)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950/60 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{isAddingUser ? 'Cerrar Formulario' : '+ Nuevo Usuario'}</span>
        </button>
      </div>

      {/* Current Active User Session Banner */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-purple-600/30 border border-purple-500/50 flex items-center justify-center text-purple-200 font-bold text-base shadow">
            {currentUser.avatar || currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">{currentUser.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border ${ROLE_LABELS[currentUser.role]?.color}`}>
                {ROLE_LABELS[currentUser.role]?.label || currentUser.role}
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Sesión Activa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.email} • {ROLE_LABELS[currentUser.role]?.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs text-slate-400">Cambiar de usuario:</span>
          <select
            value={currentUser.id}
            onChange={e => {
              const found = users.find(u => u.id === e.target.value);
              if (found) {
                StorageService.setCurrentUser(found.id);
                onCurrentUserChanged(found);
              }
            }}
            className="bg-slate-950 border border-purple-500/40 text-purple-200 text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({ROLE_LABELS[u.role]?.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add User Modal / Inline Form */}
      {isAddingUser && (
        <form
          onSubmit={handleCreateUser}
          className="bg-slate-900 border border-purple-500/40 rounded-xl p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Alta de Nuevo Miembro del Equipo
            </h3>
            <span className="text-xs text-slate-400">Asigna las responsabilidades operativas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej: Marcos Silva"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Email de Acceso *</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="marcos@taller.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Rol Operativo *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="admin">Administrador General</option>
                <option value="disenador">Diseñador / Sublimador</option>
                <option value="vendedor">Vendedor / Mostrador</option>
                <option value="produccion">Operador de Producción</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+54 9 11 ..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddingUser(false)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold shadow-md"
            >
              Guardar Usuario
            </button>
          </div>
        </form>
      )}

      {/* Users Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {users.map(u => {
          const Icon = getRoleIcon(u.role);
          const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.vendedor;
          const isCurrent = u.id === currentUser.id;

          return (
            <div
              key={u.id}
              className={`bg-slate-900 border rounded-xl p-5 flex flex-col justify-between transition-all ${
                isCurrent
                  ? 'border-purple-500 ring-1 ring-purple-500/50 shadow-md shadow-purple-950/40'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                      {u.avatar || u.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{u.name}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border inline-block mt-0.5 ${roleMeta.color}`}>
                        {roleMeta.label}
                      </span>
                    </div>
                  </div>

                  {isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Sesión activa"></span>
                  ) : (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Eliminar usuario"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{u.phone}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                  {roleMeta.description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800/80 mt-4 flex items-center justify-between gap-2">
                <select
                  value={u.role}
                  onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                  className="bg-slate-950 border border-slate-800 text-[11px] text-slate-300 rounded px-2 py-1 focus:outline-none"
                >
                  <option value="admin">Administrador</option>
                  <option value="disenador">Diseñador</option>
                  <option value="vendedor">Vendedor</option>
                  <option value="produccion">Producción</option>
                </select>

                {!isCurrent && (
                  <button
                    onClick={() => {
                      StorageService.setCurrentUser(u.id);
                      onCurrentUserChanged(u);
                    }}
                    className="text-[11px] font-semibold text-purple-400 hover:text-purple-300 hover:underline"
                  >
                    Activar sesión
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Permission Matrix Guide */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Key className="w-4 h-4 text-purple-400" />
          Matriz de Permisos por Rol en SubliStock Pro
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                <th className="py-2 px-3">Funcionalidad</th>
                <th className="py-2 px-3 text-center">Admin</th>
                <th className="py-2 px-3 text-center">Diseñador</th>
                <th className="py-2 px-3 text-center">Vendedor</th>
                <th className="py-2 px-3 text-center">Producción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              <tr>
                <td className="py-2.5 px-3">Subir imágenes de diseño en remeras/tazas</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">Solo Ver</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Presupuestos membretados y Cotizaciones</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">Solo Ver</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Agendar en Google Calendar</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Sincronizar</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Sincronizar</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Venta directa (lisa o con diseño)</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Mover estado de producción (Plancha/Control)</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">Solo Ver</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3">Reportes de Ganancias, Costos & Proveedores</td>
                <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">✓ Total</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
                <td className="py-2.5 px-3 text-center text-slate-500">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
