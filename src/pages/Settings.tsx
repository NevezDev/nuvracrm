import React, { useState, useEffect } from 'react';
import { User, Bell, Globe, Clock, Palette, Shield, Save } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import NotificationSettings from '../components/Notifications/NotificationSettings';
import { supabase } from '../lib/supabase';

const Settings: React.FC = () => {
  const { theme, toggleTheme, preferences, updatePreferences } = useTheme();
  const { user } = useAuth();
  const { translate } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [pendingChanges, setPendingChanges] = useState<{[key: string]: any}>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Profile state (name/company) stored in auth.user_metadata
  const [profileName, setProfileName] = useState<string>('');
  const [profileCompany, setProfileCompany] = useState<string>('');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSaved, setProfileSaved] = useState<boolean>(false);
  const [profileError, setProfileError] = useState<string>('');

  useEffect(() => {
    const name = (user as any)?.user_metadata?.display_name || '';
    const company = (user as any)?.user_metadata?.company || '';
    setProfileName(name);
    setProfileCompany(company);
  }, [user]);

  const tabs = [
    { id: 'profile', label: translate('settings.profile'), icon: User },
    { id: 'notifications', label: translate('settings.notifications'), icon: Bell },
    { id: 'appearance', label: translate('settings.appearance'), icon: Palette },
    { id: 'language', label: translate('settings.language'), icon: Globe },
    { id: 'security', label: translate('settings.security'), icon: Shield },
  ];

  const handlePreferenceChange = (key: string, value: any) => {
    setPendingChanges(prev => ({ ...prev, [key]: value }));
  };

  const saveChanges = async () => {
    try {
      await updatePreferences(pendingChanges);
      setPendingChanges({});
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: profileName,
          company: profileCompany,
        },
      });
      if (error) throw error;
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err: any) {
      setProfileError(err?.message || 'Erro ao salvar perfil');
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>
        <p className="text-gray-600 dark:text-gray-400">Personalize sua experiência no CRM</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {(user as any)?.user_metadata?.display_name || user?.email}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Administrador
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={profileCompany}
                    onChange={(e) => setProfileCompany(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-3">
                {profileSaved && (
                  <span className="text-sm text-green-600 dark:text-green-400">Perfil salvo com sucesso</span>
                )}
                {profileError && (
                  <span className="text-sm text-red-600 dark:text-red-400">{profileError}</span>
                )}
                <button
                  onClick={saveProfile}
                  disabled={profileSaving}
                  className={`flex items-center px-4 py-2 rounded-lg text-white ${profileSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar perfil
                </button>
              </div>

              {/* Aviso sobre migrações */}
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Nota:</strong> Para funcionalidade completa, execute as migrações do banco de dados no painel do Supabase.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <NotificationSettings />
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {translate('settings.appearance.theme')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={theme === 'dark' ? toggleTheme : () => {}}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-20 bg-white border rounded mb-2"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{translate('settings.appearance.light')}</p>
                  </button>
                  <button
                    onClick={theme === 'light' ? toggleTheme : () => {}}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-full h-20 bg-gray-800 border rounded mb-2"></div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{translate('settings.appearance.dark')}</p>
                  </button>
                </div>
                
                {/* Botão de salvar */}
                <div className="mt-6 flex justify-end">
                  {saveSuccess && (
                    <div className="mr-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                      {translate('settings.saveSuccess')}
                    </div>
                  )}
                  <button
                    onClick={saveChanges}
                    disabled={Object.keys(pendingChanges).length === 0}
                    className={`flex items-center px-4 py-2 rounded-lg text-white ${Object.keys(pendingChanges).length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {translate('settings.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {translate('settings.language.title')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translate('settings.language.language')}
                    </label>
                    <select
                      value={pendingChanges.language !== undefined ? pendingChanges.language : preferences?.language || 'pt-BR'}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {translate('settings.language.timezone')}
                    </label>
                    <select
                      value={pendingChanges.timezone !== undefined ? pendingChanges.timezone : preferences?.timezone || 'America/Sao_Paulo'}
                      onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                      <option value="America/New_York">Nova York (UTC-4)</option>
                      <option value="Europe/London">Londres (UTC+0)</option>
                    </select>
                  </div>
                </div>
                
                {/* Botão de salvar */}
                <div className="mt-6 flex justify-end">
                  {saveSuccess && (
                    <div className="mr-4 text-sm text-green-600 dark:text-green-400 flex items-center">
                      {translate('settings.saveSuccess')}
                    </div>
                  )}
                  <button
                    onClick={saveChanges}
                    disabled={Object.keys(pendingChanges).length === 0}
                    className={`flex items-center px-4 py-2 rounded-lg text-white ${Object.keys(pendingChanges).length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {translate('settings.saveChanges')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {translate('settings.security.title')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {translate('settings.security.changePassword')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {translate('settings.security.lastChanged')}
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {translate('settings.security.change')}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {translate('settings.security.twoFactor')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {translate('settings.security.twoFactorDesc')}
                      </p>
                    </div>
                    <button className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                      {translate('settings.security.configure')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;