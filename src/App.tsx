import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import Layout from './components/Layout'
import { AccessProvider, useAccess } from './context/AccessContext'
import { ThemeProvider } from './context/ThemeContext'
import Dashboard from './pages/Index'
import Login from './pages/Login'
import Sistemas from './pages/Sistemas'
import Usuarios from './pages/Usuarios'
import Perfil from './pages/Perfil'
import NotFound from './pages/NotFound'

function RotaProtegida() {
  const { autenticado } = useAccess()
  return autenticado ? <Layout /> : <Navigate to="/login" replace />
}

function RotaPublica() {
  const { autenticado } = useAccess()
  return autenticado ? <Navigate to="/" replace /> : <Login />
}

export default function App() {
  return (
    <ThemeProvider>
      <AccessProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<RotaPublica />} />
            <Route element={<RotaProtegida />}>
              <Route index element={<Dashboard />} />
              <Route path="/sistemas" element={<Sistemas />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/perfil" element={<Perfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AccessProvider>
    </ThemeProvider>
  )
}
