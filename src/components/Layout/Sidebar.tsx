import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Users,
  UserPlus,
  Target,
  CheckSquare,
  Calendar,
  BarChart3,
  Zap,
  MessageCircle,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NuvraLogo from '../NuvraLogo';

const Sidebar: React.FC = () => {
  const { signOut } = useAuth();
  const { translate } = useLanguage();

  const menuItems = [
    { icon: Home, label: translate('dashboard'), path: '/' },
    { icon: Users, label: translate('contacts'), path: '/contacts' },
    { icon: UserPlus, label: translate('leads'), path: '/leads' },
    { icon: Target, label: translate('opportunities'), path: '/deals' },
    { icon: CheckSquare, label: translate('activities'), path: '/activities' },
    { icon: Calendar, label: translate('agenda'), path: '/agenda' },
    { icon: MessageCircle, label: translate('chat'), path: '/chat' },
    { icon: Bell, label: 'Notificações', path: '/notifications' },
    { icon: Zap, label: translate('integrations'), path: '/integrations' },
    { icon: BarChart3, label: translate('reports'), path: '/reports' },
    { icon: Settings, label: translate('settings'), path: '/settings' },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 h-screen fixed left-0 top-0 z-10 flex flex-col">
      {/* Header mais compacto */}
      <div className="p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
          <NuvraLogo size={28} />
        </h1>
      </div>

      {/* Navegação compacta: menos espaçamento e padding */}
      <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap text-sm ${
                isActive
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Botão de Sair fixo no rodapé (compacto) */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors text-sm"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className="truncate">{translate('logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
