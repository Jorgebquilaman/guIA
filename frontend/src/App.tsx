import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AdminGuard from './components/layout/AdminGuard'
import PublicHome from './pages/public/PublicHome'
import PublicSearchResults from './pages/public/PublicSearchResults'
import AcercaDelRepositorio from './pages/public/AcercaDelRepositorio'
import Relaciones from './pages/public/Relaciones'
import ForgotPassword from './pages/public/ForgotPassword'
import ResetPassword from './pages/public/ResetPassword'
import RequestAccess from './pages/public/RequestAccess'
import Home from './pages/Home'
import Search from './pages/Search'
import Browse from './pages/Browse'
import DocumentView from './pages/DocumentView'
import Upload from './pages/Upload'
import DocumentBrowseView from './pages/DocumentBrowseView'
import Login from './pages/auth/Login'
import Dashboard from './pages/admin/Dashboard'
import DocumentsAdmin from './pages/admin/DocumentsAdmin'
import CollectionsAdmin from './pages/admin/Collections'
import UsersAdmin from './pages/admin/Users'
import AiSettings from './pages/admin/AiSettings'
import SiteConfig from './pages/admin/SiteConfig'
import SmtpConfig from './pages/admin/SmtpConfig'
import DocumentTypes from './pages/admin/DocumentTypes'
import Departments from './pages/admin/Departments'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/buscar" element={<PublicSearchResults />} />
      <Route path="/acerca-del-repositorio" element={<AcercaDelRepositorio />} />
      <Route path="/relaciones" element={<Relaciones />} />
      <Route path="/login" element={<Login />} />
      <Route path="/olvide-mi-contrasena" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/solicitar-acceso" element={<RequestAccess />} />
      <Route path="/documentos/:id" element={<DocumentView />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/app" element={<Home />} />
          <Route path="/app/search" element={<Search />} />
          <Route path="/app/browse" element={<Browse />} />
          <Route path="/app/browse/:id" element={<DocumentBrowseView />} />
          <Route path="/app/documents/:id" element={<DocumentView />} />
          <Route path="/app/upload" element={<Upload />} />
          <Route path="/app/admin" element={<AdminGuard><Dashboard /></AdminGuard>} />
          <Route path="/app/admin/documents" element={<AdminGuard><DocumentsAdmin /></AdminGuard>} />
          <Route path="/app/admin/collections" element={<AdminGuard><CollectionsAdmin /></AdminGuard>} />
          <Route path="/app/admin/users" element={<AdminGuard><UsersAdmin /></AdminGuard>} />
          <Route path="/app/admin/ai-settings" element={<AdminGuard><AiSettings /></AdminGuard>} />
          <Route path="/app/admin/site-config" element={<AdminGuard><SiteConfig /></AdminGuard>} />
          <Route path="/app/admin/smtp-config" element={<AdminGuard><SmtpConfig /></AdminGuard>} />
          <Route path="/app/admin/document-types" element={<AdminGuard><DocumentTypes /></AdminGuard>} />
          <Route path="/app/admin/departments" element={<AdminGuard><Departments /></AdminGuard>} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
