import { HiArrowRightOnRectangle, HiCog6Tooth, HiHome, HiMicrophone, HiPhoto, HiMusicalNote } from 'react-icons/hi2'
import { NavLink, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'sonner'
import { logout } from '../../../store/slices/authSlice'
import { clearUser } from '../../../store/slices/userSlice'
import { fetchLogout } from '../../../lib/api'

interface PatientNavbarProps {
  userName: string
  userEmail?: string | null
}

const navItems = [
  { label: 'Dashboard', path: '/paciente/dashboard', icon: HiHome },
  { label: 'Mis Fotos', path: '/paciente/fotos', icon: HiPhoto },
  { label: 'Mis Grabaciones', path: '/paciente/grabaciones', icon: HiMicrophone },
  { label: 'Mi Música', path: '/paciente/musica', icon: HiMusicalNote },
  { label: 'Configuración', path: '/paciente/configuracion', icon: HiCog6Tooth },
]

export const PatientNavbar = ({ userName, userEmail }: PatientNavbarProps) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      dispatch(logout({}))
      dispatch(clearUser())
      await fetchLogout()
      toast.success('Sesión cerrada correctamente')
      navigate('/login')
    } catch (error) {
      toast.error('No se pudo cerrar la sesión, intenta nuevamente')
    }
  }

  return (
    <header className="relative px-6 lg:px-12 py-6 text-white">
      <div className="absolute inset-0 patient-gradient-bg opacity-90 rounded-3xl blur-2xl" />

      <div className="relative flex flex-col gap-6 glass-panel px-6 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/60 shadow-lg">
              <img src="/defProfile.jpg" alt="Perfil" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/70">Paciente</p>
              <h1 className="text-2xl font-semibold tracking-tight">{userName || 'Paciente Alzheon'}</h1>
              <span className="text-sm text-white/70">{userEmail}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 glass-button rounded-full px-6 py-2 text-sm font-semibold text-white"
          >
            Cerrar sesión
            <HiArrowRightOnRectangle className="text-xl" />
          </button>
        </div>

        <nav className="flex flex-wrap gap-4 justify-between">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold tracking-wide transition-all duration-200',
                  'glass-button',
                  isActive ? 'bg-white/30 text-[#0E192F]' : 'text-white/80 hover:text-white',
                ].join(' ')
              }
            >
              <item.icon className="text-xl" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
