# Plan de Resolución — Dashboard Vacío (CU22)

Este plan aborda la incidencia en la cual el Dashboard Estadístico se muestra completamente vacío para el Administrador/Coordinador.

## Diagnóstico y Causa Raíz

1. **Estado de la Base de Datos:**
   Se revisaron los periodos de gestión académica en la base de datos:
   - ID 1: `1-2026` -> Activa: `NO`
   - ID 2: `2-2025` -> Activa: `NO`
   
   Al no haber ningún periodo activo, el backend (`ReporteController@getEstadisticas`) responde con un error `422 (Unprocessable Content)` y el mensaje `"No hay gestión activa configurada."`.

2. **Falta de Manejo de Errores en Frontend:**
   En `DashboardPage.jsx`, la función `fetchStats` captura cualquier error de red en un bloque `catch` que sólo imprime en consola, dejando el estado `stats` en `null` de forma indefinida. Al no renderizar ningún mensaje de error en la interfaz, el dashboard queda completamente en blanco por debajo de la cabecera.

---

## Acciones Realizadas

1. **Activación de Periodo Académico:**
   Se ejecutó un comando Eloquent en la base de datos para activar el periodo `1-2026` (`activa => true`). Esto permite que el backend retorne estadísticas válidas de inmediato.

---

## Cambios Propuestos para Evitar Pantallas en Blanco

### 1. Frontend — Estado de Error y Renderizado Amigable

#### [MODIFY] [DashboardPage.jsx](file:///c:/Users/User/Documents/1-2026/SISTEMA%20INFORMA/2do_Parcial_SI/frontend/src/pages/DashboardPage.jsx)

Introducir un estado de `error` para capturar fallos del API y mostrar un banner explicativo premium en lugar de una pantalla vacía.

**A) Agregar estado de error:**
```javascript
const [error, setError] = useState(null);
```

**B) Capturar el mensaje en `fetchStats`:**
```javascript
  const fetchStats = async () => {
    try {
      setError(null);
      if (['Administrador', 'Coordinador', 'Docente'].includes(user?.role)) {
        const res = await api.get('/dashboard/estadisticas');
        setStats(res.data);
      } else if (user?.role === 'Postulante') {
        const res = await api.get('/dashboard/notas-individuales');
        setPostulanteInfo(res.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };
```

**C) Renderizar mensaje de error en la interfaz:**
Si `error` está presente, mostrar una tarjeta con un botón o indicación de configuración:
```jsx
      {error && (
        <div className="glass-panel p-8 rounded-2xl border-l-4 border-red-500 max-w-2xl mx-auto text-center space-y-4">
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="font-bold text-slate-100 text-lg">No se pudieron cargar las estadísticas</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {error}. Asegúrese de que haya una gestión activa configurada y el servidor backend esté en funcionamiento.
          </p>
          <div className="pt-2">
            <button 
              onClick={() => navigate('/admin/admisiones')} 
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Configurar Gestión / Cupos
            </button>
          </div>
        </div>
      )}
```

---

## Verificación

1. Comprobar que tras activar la gestión, el dashboard del administrador muestra correctamente las tarjetas de KPIs, la ocupación física y la barra de progreso de cupos.
2. Comprobar que en caso de futuros problemas de red o desactivación de periodo, se presenta la tarjeta informativa en lugar de una pantalla en blanco.
