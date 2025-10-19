import React from 'react';
import { Search, Sun, Moon, User } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import NotificationBell from '../Notifications/NotificationBell';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { translate } = useLanguage();

  const displayName = (user as any)?.user_metadata?.display_name || user?.email || '';

  return (
    <header className="bg-white dark:bg-gray-900 h-16 flex items-center justify-end px-6 ml-64">
      {/* Barra de pesquisa removida e borda inferior retirada */}
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={theme === 'light' ? translate('switch_to_dark') : translate('switch_to_light')}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          ) : (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          )}
        </button>

        <NotificationBell />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {displayName}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;