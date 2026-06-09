import { useState } from 'react';
import api from '../../api/axios';

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState('aprobados');
  const [dataEstructurada, setDataEstructurada] = useState(null);
  const [carreraId, setCarreraId] = useState('');
  const [estado, setEstado] = useState('');
  const [turno, setTurno] = useState('');
  const [recurrente, setRecurrente] = useState('');
  const [dataDinamica, setDataDinamica] = useState([]);
  
  // Control por Voz (CU21)
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceResults, setVoiceResults] = useState([]);
  const [extractedFilters, setExtractedFilters] = useState(null);
  const [voiceHint, setVoiceHint] = useState(null);
  const [textoComando, setTextoComando] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const tieneFiltrosVoz = extractedFilters && (
    extractedFilters.estado || extractedFilters.carrera || extractedFilters.turno
  );

  const procesarComandoVoz = async (text) => {
    const trimmed = text?.trim();
    if (!trimmed) return;

    setLoading(true);
    setMessage(null);
    setVoiceHint(null);
    setVoiceResults([]);
    setExtractedFilters(null);

    try {
      const res = await api.post('/reportes/comando-voz', { texto: trimmed });
      setVoiceResults(res.data.resultados || []);
      setExtractedFilters(res.data.filtros_extraidos || null);

      if (res.data.mensaje) {
        setVoiceHint(res.data.mensaje);
      } else if ((res.data.resultados || []).length === 0) {
        setVoiceHint('No hay postulantes que coincidan con los filtros detectados.');
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al procesar el comando de voz.',
      });
    } finally {
      setLoading(false);
    }
  };

  const getEstructurado = async () => {
    // CU19 - Paso 1: Act -> B_Int : + SeleccionarPlantillaReporte(tipo)
    setLoading(true);
    setMessage(null);
    setDataEstructurada(null);
    try {
      // CU19 - Paso 2: B_Int -> C_Ctrl : + generarPDF(request)
      const res = await api.get(`/reportes/estructurado?tipo=${tipoReporte}`);
      // CU19 - Paso 9: B_Int --> Act : + MostrarPrevisualizacionPDF()
      setDataEstructurada(res.data);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al generar el reporte estructurado.' });
    } finally {
      setLoading(false);
    }
  };

  const getDinamico = async (e) => {
    e.preventDefault();
    // CU20 - Paso 1: Act -> B_Int : + ConfigurarFiltrosYCampos(parametros)
    setLoading(true);
    setMessage(null);
    try {
      // CU20 - Paso 2: B_Int -> C_Ctrl : + generarDinamico(request)
      const res = await api.post('/reportes/dinamico', {
        carrera_id: carreraId,
        estado: estado,
        turno: turno,
        recurrente: recurrente !== '' ? (recurrente === '1') : null,
      });
      // CU20 - Paso 6: B_Int --> Act : + RenderizarDataGrid()
      setDataDinamica(res.data || []);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al consultar reporte dinámico.' });
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('La Web Speech API no está soportada en este navegador. Utilice Google Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-BO'; // Español de Bolivia
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setTranscript('Escuchando...');
      setVoiceResults([]);
      setExtractedFilters(null);
    };

    recognition.onerror = (e) => {
      console.error(e);
      setIsRecording(false);
      setTranscript('Error de grabación.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.onresult = async (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setTextoComando(text);
      await procesarComandoVoz(text);
    };

    recognition.start();
  };

  const downloadCSV = (data, filename) => {
    if (!data || data.length === 0) return;
    
    // Extraer claves primitivas de la primera fila como cabeceras del CSV
    const firstRow = data[0];
    const headers = Object.keys(firstRow).filter(
      (k) => typeof firstRow[k] !== 'object' || firstRow[k] === null
    );
    const csvRows = [headers.join(',')];

    data.forEach((row) => {
      const values = headers.map((header) => {
        const val = row[header];
        if (val === null || val === undefined) return '""';
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportarVoz = async (formato) => {
    if (!tieneFiltrosVoz) {
      setMessage({
        type: 'error',
        text: 'Primero dicte o escriba un comando con filtros reconocidos (estado, carrera o turno).',
      });
      return;
    }

    try {
      const res = await api.post('/reportes/comando-voz/exportar', {
        filtros: extractedFilters,
        formato: formato,
      }, { responseType: 'blob' });

      const contentType = res.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Error al generar el archivo.');
      }

      const ext = formato === 'pdf' ? 'pdf' : 'xlsx';
      const mime = formato === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const blob = new Blob([res.data], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_voz_${Date.now()}.${ext}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exportando:', err);
      setMessage({
        type: 'error',
        text: err.message || err.response?.data?.message || 'Error al exportar el reporte de voz.',
      });
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 space-y-8">
      {/* Encabezado */}
      <div>
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Inteligencia Analítica</span>
        <h1 className="text-2xl font-bold text-slate-100 mt-1">Generación de Reportes del Proceso</h1>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Reporte Estructurado (CU19) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">Reportes Oficiales Estructurados (CU19)</h2>
            <p className="text-xs text-slate-400 mb-6">Obtenga plantillas de reportes oficiales predefinidos con membrete institucional listos para descargar.</p>
            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-2">Plantilla del Reporte</label>
                <select
                  value={tipoReporte}
                  onChange={(e) => setTipoReporte(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
                >
                  <option value="inscritos">1. Lista General de Postulantes</option>
                  <option value="aprobados">2. Postulantes Aprobados</option>
                  <option value="reprobados">3. Postulantes Reprobados</option>
                  <option value="promedios">4. Promedios Generales</option>
                  <option value="grupos_habilitados">5. Cantidad de Grupos Habilitados</option>
                  <option value="estadisticas_materia">6. Estadísticas por Materia</option>
                  <option value="docentes_grupos">7. Docentes por Grupos</option>
                  <option value="grupos_aprobados">8. Grupos con Mayor Cantidad de Aprobados</option>
                  <option value="admisiones">9. Lista Definitiva de Admitidos a Carrera</option>
                </select>
              </div>
              <button
                onClick={getEstructurado}
                disabled={loading}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Generar Reporte
              </button>
            </div>

            {dataEstructurada && (
              <div className="bg-slate-950/45 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-200 font-semibold">{dataEstructurada.titulo}</span>
                  <span className="text-slate-500">{dataEstructurada.fecha}</span>
                </div>
                <div className="text-xs text-slate-400">
                  Total Registros: <span className="text-slate-100 font-bold">{dataEstructurada.data?.length || 0}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => downloadCSV(dataEstructurada.data, `reporte_${tipoReporte}`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold hover:bg-emerald-600/25 transition-all cursor-pointer"
                  >
                    Descargar Excel (CSV)
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    Imprimir Ficha PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reporte por Comando de Voz (CU21) */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-200 mb-2">Consulta por Comando de Voz (IA - CU21)</h2>
            <p className="text-xs text-slate-400 mb-4">
              Dicte o escriba su consulta en español. Use palabras claras: estado, carrera y turno.
            </p>
            <p className="text-[10px] text-slate-500 mb-4 leading-relaxed">
              Ejemplos: &quot;aprobados de sistemas en la tarde&quot;, &quot;preinscritos de informática&quot;, &quot;reprobados en la noche&quot;.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={textoComando}
                onChange={(e) => setTextoComando(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && procesarComandoVoz(textoComando)}
                placeholder='Ej: "aprobados de sistemas en la mañana"'
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={() => procesarComandoVoz(textoComando)}
                disabled={loading || !textoComando.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
              >
                Buscar
              </button>
            </div>
            
            <div className="flex items-center gap-6 mb-6">
              <button
                onClick={handleVoiceSearch}
                disabled={isRecording || loading}
                className={`h-16 w-16 rounded-full flex items-center justify-center border transition-all ${
                  isRecording 
                    ? 'bg-red-600/20 border-red-500/30 text-red-400 animate-pulse' 
                    : 'bg-blue-600/10 border-blue-500/20 text-blue-400 hover:bg-blue-600/20'
                } cursor-pointer`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Transcripción de voz:</span>
                <span className={`text-sm font-semibold ${transcript ? 'text-slate-200' : 'text-slate-600 italic'}`}>
                  {transcript || '"Pulse el micro y dicte ej: aprobados de informática en la tarde"'}
                </span>
              </div>
            </div>

            {extractedFilters && (
              <div className="text-[10px] text-slate-400 bg-slate-950/20 p-2 rounded-lg mb-4 flex flex-wrap gap-2 items-center">
                <span>Filtros detectados:</span>
                {extractedFilters.estado && <span className="bg-blue-600/10 text-blue-400 px-1.5 py-0.5 rounded">Estado: {extractedFilters.estado}</span>}
                {extractedFilters.carrera && <span className="bg-emerald-600/10 text-emerald-400 px-1.5 py-0.5 rounded">Carrera: {extractedFilters.carrera}</span>}
                {extractedFilters.turno && <span className="bg-purple-600/10 text-purple-400 px-1.5 py-0.5 rounded">Turno: {extractedFilters.turno}</span>}
                {!tieneFiltrosVoz && (
                  <span className="bg-amber-600/10 text-amber-400 px-1.5 py-0.5 rounded">Ninguno — reformule el comando</span>
                )}
              </div>
            )}

            {voiceHint && (
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl mb-4">
                {voiceHint}
              </div>
            )}

            {voiceResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Resultados encontrados: <strong className="text-slate-100">{voiceResults.length}</strong></span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadCSV(voiceResults, 'reporte_comando_voz')}
                      className="px-3 py-1 rounded-lg bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold hover:bg-emerald-600/25 transition-all cursor-pointer"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => exportarVoz('pdf')}
                      disabled={!tieneFiltrosVoz}
                      className="px-3 py-1 rounded-lg bg-red-600/10 text-red-400 border border-red-500/25 text-[10px] font-bold hover:bg-red-600/25 transition-all cursor-pointer disabled:opacity-40"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => exportarVoz('excel')}
                      disabled={!tieneFiltrosVoz}
                      className="px-3 py-1 rounded-lg bg-green-600/10 text-green-400 border border-green-500/25 text-[10px] font-bold hover:bg-green-600/25 transition-all cursor-pointer disabled:opacity-40"
                    >
                      Excel
                    </button>
                  </div>
                </div>

                {/* Tabla de resultados de voz */}
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                        <th className="py-2 px-2">Postulante</th>
                        <th className="py-2 px-2">CI</th>
                        <th className="py-2 px-2">Estado</th>
                        <th className="py-2 px-2">Turno</th>
                        <th className="py-2 px-2">1ra Opción</th>
                        <th className="py-2 px-2">Asignada</th>
                        <th className="py-2 px-2">Promedio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voiceResults.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-slate-300">
                          <td className="py-2 px-2 font-medium">{p.apellidos}, {p.nombres}</td>
                          <td className="py-2 px-2 font-mono">{p.ci}</td>
                          <td className="py-2 px-2">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              p.estado === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-400'
                              : p.estado === 'Reprobado' ? 'bg-red-500/10 text-red-400'
                              : 'bg-blue-500/10 text-blue-400'
                            }`}>{p.estado}</span>
                          </td>
                          <td className="py-2 px-2">{p.turno_preferencia}</td>
                          <td className="py-2 px-2 text-slate-400">{p.primeraOpcion?.nombre || '-'}</td>
                          <td className="py-2 px-2 text-slate-200 font-semibold">{p.admision?.carrera?.nombre || '-'}</td>
                          <td className="py-2 px-2 font-mono font-bold text-slate-200">{p.promedio_general || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reporte Dinámico Interactivo (CU20) */}
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-lg font-semibold text-slate-200 mb-2">Generador de Consultas Dinámicas (CU20)</h2>
        <p className="text-xs text-slate-400 mb-6">Seleccione los criterios de búsqueda para compilar un reporte interactivo personalizado.</p>
        
        <form onSubmit={getDinamico} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end mb-8 border-b border-slate-800 pb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Estado Académico</label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="">Cualquiera</option>
              <option value="Preinscrito">Preinscrito</option>
              <option value="Verificado">Verificado</option>
              <option value="Inscrito">Inscrito</option>
              <option value="En Evaluacion">En Evaluación</option>
              <option value="Aprobado">Aprobado</option>
              <option value="Reprobado">Reprobado</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Carrera Elegida (ID)</label>
            <select
              value={carreraId}
              onChange={(e) => setCarreraId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="">Cualquiera</option>
              <option value="1">Ingeniería Informática</option>
              <option value="2">Ingeniería de Sistemas</option>
              <option value="3">Ingeniería en Redes y Telecomunicaciones</option>
              <option value="4">Ingeniería en Robótica</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Turno</label>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="">Cualquiera</option>
              <option value="Manana">Mañana</option>
              <option value="Tarde">Tarde</option>
              <option value="Noche">Noche</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Tipo Postulante</label>
            <select
              value={recurrente}
              onChange={(e) => setRecurrente(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-blue-500 outline-none"
            >
              <option value="">Cualquiera</option>
              <option value="0">Nuevos</option>
              <option value="1">Recurrentes</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold text-xs py-2.5 rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Buscar Datos
          </button>
        </form>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Cargando resultados dinámicos...</div>
        ) : dataDinamica.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No hay registros que coincidan con la búsqueda.</div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4 text-xs">
              <span className="text-slate-400">Total coincidencias: <strong className="text-slate-200">{dataDinamica.length}</strong></span>
              <button
                onClick={() => downloadCSV(dataDinamica, 'reporte_dinamico')}
                className="px-3 py-1.5 bg-emerald-600/10 text-emerald-400 border border-emerald-500/25 font-bold rounded-lg hover:bg-emerald-600/20 transition-all cursor-pointer"
              >
                Descargar CSV
              </button>
            </div>
            <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-widest text-[10px] font-bold">
                    <th className="py-2 px-2">Postulante</th>
                    <th className="py-2 px-2">CI</th>
                    <th className="py-2 px-2">Estado</th>
                    <th className="py-2 px-2">Turno</th>
                    <th className="py-2 px-2">1ra Opción</th>
                    <th className="py-2 px-2">Asignada</th>
                    <th className="py-2 px-2">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {dataDinamica.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800/40 hover:bg-slate-900/10 text-slate-300">
                      <td className="py-2 px-2 font-medium">{p.apellidos}, {p.nombres}</td>
                      <td className="py-2 px-2 font-mono">{p.ci}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          p.estado === 'Aprobado' ? 'bg-emerald-500/10 text-emerald-400' 
                          : p.estado === 'Reprobado' ? 'bg-red-500/10 text-red-400' 
                          : 'bg-blue-500/10 text-blue-400'
                        }`}>{p.estado}</span>
                      </td>
                      <td className="py-2 px-2">{p.turno_preferencia}</td>
                      <td className="py-2 px-2 text-slate-400">{p.primeraOpcion?.nombre || '-'}</td>
                      <td className="py-2 px-2 text-slate-200 font-semibold">{p.admision?.carrera?.nombre || '-'}</td>
                      <td className="py-2 px-2 font-mono font-bold text-slate-200">{p.promedio_general || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
