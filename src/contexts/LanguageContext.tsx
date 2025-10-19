// src/contexts/LanguageContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';

// Definição de tipos para as traduções
type TranslationKey = string;
type TranslationValue = string;
type TranslationDictionary = Record<TranslationKey, TranslationValue>;
type LanguageCode = 'pt-BR' | 'en-US' | 'es-ES';

// Interface para o contexto de idioma
interface LanguageContextProps {
  currentLanguage: LanguageCode;
  translate: (key: TranslationKey) => string;
}

// Criação do contexto
const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

// Traduções disponíveis
const translations: Record<LanguageCode, TranslationDictionary> = {
  'pt-BR': {
    // Cabeçalho e navegação
    'app.title': 'Nuvra CRM',
    'nav.dashboard': 'Dashboard',
    'nav.contacts': 'Contatos',
    'nav.leads': 'Leads',
    'nav.deals': 'Negócios',
    'nav.activities': 'Atividades',
    'nav.reports': 'Relatórios',
    'nav.settings': 'Configurações',
    'nav.chat': 'Chat',
    'nav.integrations': 'Integrações',
    
    // Sidebar
    'dashboard': 'Dashboard',
    'contacts': 'Contatos',
    'leads': 'Leads',
    'opportunities': 'Oportunidades',
    'activities': 'Atividades',
    'agenda': 'Agenda',
    'chat': 'Chat',
    'integrations': 'Integrações',
    'reports': 'Relatórios',
    'settings': 'Configurações',
    'logout': 'Sair',
    
    // Header
    'search_placeholder': 'Pesquisar contatos, leads...',
    'switch_to_dark': 'Mudar para tema escuro',
    'switch_to_light': 'Mudar para tema claro',
    
    // Configurações
    'settings.profile': 'Perfil',
    'settings.notifications': 'Notificações',
    'settings.appearance': 'Aparência',
    'settings.language': 'Idioma',
    'settings.security': 'Segurança',
    'settings.notifications.title': 'Notificações',
    'settings.notifications.description': 'Configure quando e como receber notificações',
    'settings.notifications.newLeads': 'Novos leads',
    'settings.notifications.newLeadsDesc': 'Notificar quando novos leads chegarem',
    'settings.notifications.overdueActivities': 'Atividades vencidas',
    'settings.notifications.overdueActivitiesDesc': 'Notificar sobre atividades em atraso',
    'settings.notifications.closedDeals': 'Oportunidades fechadas',
    'settings.notifications.closedDealsDesc': 'Notificar quando oportunidades forem fechadas',
    'settings.appearance.theme': 'Tema',
    'settings.appearance.light': 'Claro',
    'settings.appearance.dark': 'Escuro',
    'settings.language.title': 'Idioma e Região',
    'settings.language.language': 'Idioma',
    'settings.language.timezone': 'Fuso Horário',
    'settings.security.title': 'Segurança',
    'settings.security.changePassword': 'Alterar senha',
    'settings.security.lastChanged': 'Última alteração: há 30 dias',
    'settings.security.twoFactor': 'Autenticação em dois fatores',
    'settings.security.twoFactorDesc': 'Adicione uma camada extra de segurança',
    'settings.security.configure': 'Configurar',
    'settings.security.change': 'Alterar',
    'settings.saveChanges': 'Salvar alterações',
    'settings.saveSuccess': 'Preferências salvas com sucesso!',
  },
  'en-US': {
    // Header and navigation
    'app.title': 'Nuvra CRM',
    'nav.dashboard': 'Dashboard',
    'nav.contacts': 'Contacts',
    'nav.leads': 'Leads',
    'nav.deals': 'Deals',
    'nav.activities': 'Activities',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.chat': 'Chat',
    'nav.integrations': 'Integrations',
    
    // Sidebar
    'dashboard': 'Dashboard',
    'contacts': 'Contacts',
    'leads': 'Leads',
    'opportunities': 'Opportunities',
    'activities': 'Activities',
    'agenda': 'Calendar',
    'chat': 'Chat',
    'integrations': 'Integrations',
    'reports': 'Reports',
    'settings': 'Settings',
    'logout': 'Logout',
    
    // Header
    'search_placeholder': 'Search contacts, leads...',
    'switch_to_dark': 'Switch to dark theme',
    'switch_to_light': 'Switch to light theme',
    
    // Settings
    'settings.profile': 'Profile',
    'settings.notifications': 'Notifications',
    'settings.appearance': 'Appearance',
    'settings.language': 'Language',
    'settings.security': 'Security',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.description': 'Configure when and how to receive notifications',
    'settings.notifications.newLeads': 'New leads',
    'settings.notifications.newLeadsDesc': 'Notify when new leads arrive',
    'settings.notifications.overdueActivities': 'Overdue activities',
    'settings.notifications.overdueActivitiesDesc': 'Notify about overdue activities',
    'settings.notifications.closedDeals': 'Closed deals',
    'settings.notifications.closedDealsDesc': 'Notify when deals are closed',
    'settings.appearance.theme': 'Theme',
    'settings.appearance.light': 'Light',
    'settings.appearance.dark': 'Dark',
    'settings.language.title': 'Language and Region',
    'settings.language.language': 'Language',
    'settings.language.timezone': 'Timezone',
    'settings.security.title': 'Security',
    'settings.security.changePassword': 'Change password',
    'settings.security.lastChanged': 'Last changed: 30 days ago',
    'settings.security.twoFactor': 'Two-factor authentication',
    'settings.security.twoFactorDesc': 'Add an extra layer of security',
    'settings.security.configure': 'Configure',
    'settings.security.change': 'Change',
    'settings.saveChanges': 'Save changes',
    'settings.saveSuccess': 'Preferences saved successfully!',
  },
  'es-ES': {
    // Encabezado y navegación
    'app.title': 'Nuvra CRM',
    'nav.dashboard': 'Panel',
    'nav.contacts': 'Contactos',
    'nav.leads': 'Prospectos',
    'nav.deals': 'Negocios',
    'nav.activities': 'Actividades',
    'nav.reports': 'Informes',
    'nav.settings': 'Configuración',
    'nav.chat': 'Chat',
    'nav.integrations': 'Integraciones',
    
    // Sidebar
    'dashboard': 'Panel',
    'contacts': 'Contactos',
    'leads': 'Prospectos',
    'opportunities': 'Oportunidades',
    'activities': 'Actividades',
    'agenda': 'Agenda',
    'chat': 'Chat',
    'integrations': 'Integraciones',
    'reports': 'Informes',
    'settings': 'Configuración',
    'logout': 'Cerrar sesión',
    
    // Header
    'search_placeholder': 'Buscar contactos, prospectos...',
    'switch_to_dark': 'Cambiar a tema oscuro',
    'switch_to_light': 'Cambiar a tema claro',
    
    // Configuración
    'settings.profile': 'Perfil',
    'settings.notifications': 'Notificaciones',
    'settings.appearance': 'Apariencia',
    'settings.language': 'Idioma',
    'settings.security': 'Seguridad',
    'settings.notifications.title': 'Notificaciones',
    'settings.notifications.description': 'Configure cuándo y cómo recibir notificaciones',
    'settings.notifications.newLeads': 'Nuevos prospectos',
    'settings.notifications.newLeadsDesc': 'Notificar cuando lleguen nuevos prospectos',
    'settings.notifications.overdueActivities': 'Actividades vencidas',
    'settings.notifications.overdueActivitiesDesc': 'Notificar sobre actividades vencidas',
    'settings.notifications.closedDeals': 'Negocios cerrados',
    'settings.notifications.closedDealsDesc': 'Notificar cuando se cierren negocios',
    'settings.appearance.theme': 'Tema',
    'settings.appearance.light': 'Claro',
    'settings.appearance.dark': 'Oscuro',
    'settings.language.title': 'Idioma y Región',
    'settings.language.language': 'Idioma',
    'settings.language.timezone': 'Zona horaria',
    'settings.security.title': 'Seguridad',
    'settings.security.changePassword': 'Cambiar contraseña',
    'settings.security.lastChanged': 'Último cambio: hace 30 días',
    'settings.security.twoFactor': 'Autenticación de dos factores',
    'settings.security.twoFactorDesc': 'Añada una capa extra de seguridad',
    'settings.security.configure': 'Configurar',
    'settings.security.change': 'Cambiar',
    'settings.saveChanges': 'Guardar cambios',
    'settings.saveSuccess': '¡Preferencias guardadas con éxito!',
  },
};

// Provider do contexto de idioma
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { preferences } = useTheme();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('pt-BR');

  // Atualiza o idioma quando as preferências mudarem
  useEffect(() => {
    if (preferences?.language) {
      setCurrentLanguage(preferences.language as LanguageCode);
    }
  }, [preferences]);

  // Função para traduzir textos
  const translate = (key: TranslationKey): string => {
    const dictionary = translations[currentLanguage] || translations['pt-BR'];
    return dictionary[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook para usar o contexto de idioma
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};