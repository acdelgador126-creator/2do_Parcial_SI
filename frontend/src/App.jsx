import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/Autenticacion/LoginPage';
import ForgotPasswordPage from './pages/Autenticacion/ForgotPasswordPage';
import ResetPasswordPage from './pages/Autenticacion/ResetPasswordPage';
import DashboardPage from './pages/ReportesIA/DashboardPage';
import UsersPage from './pages/Autenticacion/UsersPage';
import BusquedaPostulantesPage from './pages/RegistroPostulantes/BusquedaPostulantesPage';
import GruposPage from './pages/PlanificacionAcademica/GruposPage';
import DocentesPage from './pages/PlanificacionAcademica/DocentesPage';
import NotasAdminPage from './pages/Evaluacion/NotasAdminPage';
import AdmisionesPage from './pages/AdmisionCarreras/AdmisionesPage';
import ReportesPage from './pages/ReportesIA/ReportesPage';
import PreinscripcionPage from './pages/RegistroPostulantes/PreinscripcionPage';
import InscripcionPage from './pages/RegistroPostulantes/InscripcionPage';
import SimulacroPage from './pages/PlanificacionAcademica/SimulacroPage';
import Pago from './pages/RegistroPostulantes/Pago';
import PagoExitoso from './pages/RegistroPostulantes/PagoExitoso';
import PagoCancelado from './pages/RegistroPostulantes/PagoCancelado';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Admin/Coordinador */}
            <Route path="/admin/usuarios" element={
              <ProtectedRoute roles={['Administrador']}><UsersPage /></ProtectedRoute>
            } />
            <Route path="/admin/postulantes" element={
              <ProtectedRoute roles={['Administrador', 'Coordinador', 'Docente']}><BusquedaPostulantesPage /></ProtectedRoute>
            } />
            <Route path="/admin/grupos" element={
              <ProtectedRoute roles={['Administrador', 'Coordinador']}><GruposPage /></ProtectedRoute>
            } />
            <Route path="/admin/docentes" element={
              <ProtectedRoute roles={['Administrador', 'Coordinador']}><DocentesPage /></ProtectedRoute>
            } />
            <Route path="/admin/notas" element={
              <ProtectedRoute roles={['Administrador']}><NotasAdminPage /></ProtectedRoute>
            } />
            <Route path="/admin/admisiones" element={
              <ProtectedRoute roles={['Administrador', 'Coordinador']}><AdmisionesPage /></ProtectedRoute>
            } />
            <Route path="/admin/reportes" element={
              <ProtectedRoute roles={['Administrador', 'Coordinador']}><ReportesPage /></ProtectedRoute>
            } />

            {/* Postulante (Protegido) */}
            <Route path="/simulacro" element={
              <ProtectedRoute roles={['Postulante']}><SimulacroPage /></ProtectedRoute>
            } />
          </Route>

          {/* Rutas Publicas de Registro y Pago */}
          <Route path="/preinscripcion" element={<PreinscripcionPage />} />
          <Route path="/inscripcion" element={<InscripcionPage />} />
          <Route path="/inscripcion/pago/:postulanteId" element={<Pago />} />
          <Route path="/inscripcion/exitosa" element={<PagoExitoso />} />
          <Route path="/inscripcion/cancelada" element={<PagoCancelado />} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
