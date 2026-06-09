import { useState, useEffect } from 'react';
import api from '../../api/axios';

/**
 * CU04 - Gestionar Perfiles de Usuario CRUD
 * 
 * Interfaz de administración de usuarios que implementa el flujo
 * del diagrama de secuencia para creación, edición y desactivación.
 */
export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Coordinador');
  const [active, setActive] = useState(true);

  // Temporary password modal state (shown after successful creation)
  const [createdPassword, setCreatedPassword] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');

  // Error/Success state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load users with search, role, active, and page parameters
  // CU04 - Paso 8: UI -> Act : ActualizarListaUsuarios()
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== '') params.active = statusFilter === 'true';

      const { data } = await api.get('/users', { params });
      setUsers(data.data || []);
      setTotalPages(data.last_page || 1);
    } catch (err) {
      setError('Error al cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // CU04 - Paso 1: Act -> B_Int : + RegistrarNuevoUsuario(datos)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // CU04 - Paso 2: B_Int -> C_Ctrl : + store(request)
      const response = await api.post('/users', { name, email, role });

      // CU04 - Paso 7: C_Ctrl --> B_Int : + RetornarExito()
      setSuccess('Usuario creado exitosamente.');
      setCreatedPassword(response.data.temp_password);
      setCreatedEmail(response.data.user.email);
      
      // Reset form
      setName('');
      setEmail('');
      setRole('Coordinador');
      setIsCreateOpen(false);

      // CU04 - Paso 8: B_Int --> Act : + ActualizarListaUsuarios()
      fetchUsers();
    } catch (err) {
      // CU04 - Paso 5 [alt duplicado]: NotificarErrorDuplicado("El correo ya existe")
      // CU04 - Paso 6: UI -> Act : MostrarMensajeError()
      setError(err.response?.data?.message || 'Error al crear el usuario. Verifique si el correo ya existe.');
    }
  };

  // CU04 - Solicitar Editar Usuario
  const openEditModal = (user) => {
    setCurrentUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setActive(user.active);
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await api.put(`/users/${currentUser.id}`, { name, email, role, active });
      setSuccess('Usuario actualizado correctamente.');
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al actualizar el usuario.');
    }
  };

  // CU04 - Desactivar Usuario (Soft Delete)
  const handleDeactivate = async (user) => {
    if (!confirm(`¿Está seguro que desea desactivar al usuario ${user.name}? Se invalidarán todas sus sesiones.`)) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      // Llama a destroy que realiza active=false y elimina tokens en el backend
      await api.delete(`/users/${user.id}`);
      setSuccess(`El usuario ${user.name} ha sido desactivado exitosamente.`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al desactivar el usuario.');
    }
  };

  return (
    <div className="py-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest font-mono">Seguridad</span>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">Gestión de Usuarios (CU04)</h1>
        </div>
        <button
          onClick={() => {
            setName('');
            setEmail('');
            setRole('Coordinador');
            setError('');
            setIsCreateOpen(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-300 btn-premium flex items-center gap-2 cursor-pointer self-start"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Usuario
        </button>
      </div>

      {/* Alertas */}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl mb-6 text-sm flex justify-between items-center">
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}
      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-300 p-4 rounded-xl mb-6 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      {/* Panel de Filtros */}
      <div className="glass-panel rounded-2xl p-4 mb-6 border border-slate-700/30">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Búsqueda rápida</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Filtrar por Rol</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos los roles</option>
              <option value="Administrador">Administrador</option>
              <option value="Coordinador">Coordinador</option>
              <option value="Docente">Docente</option>
              <option value="Postulante">Postulante</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Estado de Cuenta</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="">Cualquiera</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer flex justify-center items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar
          </button>
        </form>
      </div>

      {/* Tabla de Usuarios */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-slate-400 text-sm">Cargando registros de usuarios...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-700/30">
          <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-slate-400 text-sm">No se encontraron usuarios que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl border border-slate-700/30">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider">Nombre Completo</th>
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider">Correo Electrónico</th>
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider">Rol de Sistema</th>
                  <th className="p-4 text-left text-xs font-bold uppercase tracking-wider">Estado</th>
                  <th className="p-4 text-center text-xs font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/55">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/20 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-200">{u.name}</td>
                    <td className="p-4 text-sm text-slate-400">{u.email}</td>
                    <td className="p-4 text-sm text-slate-300 font-semibold">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-semibold ${
                        u.role === 'Administrador' ? 'bg-indigo-500/10 text-indigo-400' :
                        u.role === 'Coordinador' ? 'bg-blue-500/10 text-blue-400' :
                        u.role === 'Docente' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        u.active 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-2 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 border border-slate-700/50"
                          title="Editar"
                        >
                          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Editar
                        </button>
                        {u.active && (
                          <button
                            onClick={() => handleDeactivate(u)}
                            className="bg-red-950/20 hover:bg-red-900/40 text-red-400 p-2 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 border border-red-500/20"
                            title="Desactivar"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                            Desactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div className="bg-slate-900/90 p-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO USUARIO */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-700/40 relative">
            <button 
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Crear Nuevo Usuario</h2>
            <p className="text-xs text-slate-400 mb-4">Ingrese la información básica del perfil. Se autogenerará una clave temporal.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan Perez"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@uagrm.edu.bo"
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rol del Sistema</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Docente">Docente</option>
                  <option value="Postulante">Postulante</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-300 btn-premium shadow-lg shadow-blue-600/10 cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR USUARIO */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-700/40 relative">
            <button 
              onClick={() => setIsEditOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 text-lg cursor-pointer"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Editar Usuario</h2>
            <p className="text-xs text-slate-400 mb-4">Actualice la configuración del perfil seleccionado.</p>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Rol del Sistema</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Coordinador">Coordinador</option>
                  <option value="Docente">Docente</option>
                  <option value="Postulante">Postulante</option>
                </select>
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                />
                <label htmlFor="userActive" className="text-sm font-semibold text-slate-300 cursor-pointer">
                  Estado de cuenta Activo
                </label>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-300 btn-premium shadow-lg shadow-blue-600/10 cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONTRASENA TEMPORAL AUTOGENERADA */}
      {createdPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl p-6 border border-emerald-500/30 relative">
            <div className="text-center mb-4">
              <div className="inline-block bg-emerald-500/10 text-emerald-400 p-3 rounded-full mb-3">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-100">Usuario Creado Exitosamente</h2>
              <p className="text-xs text-slate-400 mt-1">Por favor copie las credenciales provisorias del usuario.</p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3 font-mono text-sm mb-6">
              <div>
                <span className="text-xs text-slate-500 block">CORREO:</span>
                <span className="text-slate-200">{createdEmail}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">CLAVE TEMPORAL:</span>
                <span className="text-yellow-400 font-bold select-all">{createdPassword}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCreatedPassword('');
                setCreatedEmail('');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm transition-all cursor-pointer"
            >
              Entendido y Copiado
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
