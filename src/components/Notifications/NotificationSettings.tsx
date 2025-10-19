import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Monitor, Clock, Save, RefreshCw } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { NotificationPreferences } from '../../types/notification';

const NotificationSettings: React.FC = () => {
  const { preferences, updatePreferences, loading } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState<Partial<NotificationPreferences>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincronizar com as preferências carregadas
  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        email_enabled: preferences.email_enabled,
        push_enabled: preferences.push_enabled,
        in_app_enabled: preferences.in_app_enabled,
        categories: preferences.categories,
        quiet_hours_start: preferences.quiet_hours_start,
        quiet_hours_end: preferences.quiet_hours_end,
        timezone: preferences.timezone
      });
    }
  }, [preferences]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    try {
      await updatePreferences(localPreferences);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleGlobalToggle = (type: 'email_enabled' | 'push_enabled' | 'in_app_enabled', enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [type]: enabled
    }));
  };

  const handleCategoryToggle = (
    category: string, 
    channel: 'email' | 'push' | 'in_app', 
    enabled: boolean
  ) => {
    setLocalPreferences(prev => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: {
          ...prev.categories?.[category],
          [channel]: enabled
        }
      }
    }));
  };

  const handleTimeChange = (field: 'quiet_hours_start' | 'quiet_hours_end', value: string) => {
    setLocalPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = [
    { key: 'lead', label: 'Leads', description: 'Novos leads e mudanças de status' },
    { key: 'contact', label: 'Contatos', description: 'Atualizações de contatos' },
    { key: 'deal', label: 'Negócios', description: 'Negócios fechados, perdidos e atualizações' },
    { key: 'activity', label: 'Atividades', description: 'Lembretes e atividades atrasadas' },
    { key: 'system', label: 'Sistema', description: 'Manutenções e atualizações do sistema' },
    { key: 'integration', label: 'Integrações', description: 'Erros e status das integrações' }
  ];

  const timezones = [
    { value: 'America/Sao_Paulo', label: 'Brasília (UTC-3)' },
    { value: 'America/New_York', label: 'Nova York (UTC-5)' },
    { value: 'Europe/London', label: 'Londres (UTC+0)' },
    { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
    { value: 'Asia/Tokyo', label: 'Tóquio (UTC+9)' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600 dark:text-gray-400">Carregando preferências...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações de Notificações</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure como e quando você deseja receber notificações
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            saved
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-primary-600 text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <>
              <Save className="w-4 h-4" />
              <span>Salvo!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </>
          )}
        </button>
      </div>

      {/* Configurações Globais */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2" />
          Configurações Gerais
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificações por Email
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Receber notificações no seu email
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.email_enabled || false}
                onChange={(e) => handleGlobalToggle('email_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificações Push
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notificações do navegador
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.push_enabled || false}
                onChange={(e) => handleGlobalToggle('push_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="w-5 h-5 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Notificações no App
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notificações dentro do sistema
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.in_app_enabled || false}
                onChange={(e) => handleGlobalToggle('in_app_enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Configurações por Categoria */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notificações por Categoria
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Categoria</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Email</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Push</th>
                <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">No App</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.key} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{category.label}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{category.description}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.categories?.[category.key]?.email || false}
                        onChange={(e) => handleCategoryToggle(category.key, 'email', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.categories?.[category.key]?.push || false}
                        onChange={(e) => handleCategoryToggle(category.key, 'push', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.categories?.[category.key]?.in_app || false}
                        onChange={(e) => handleCategoryToggle(category.key, 'in_app', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Horário Silencioso */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Horário Silencioso
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Início
            </label>
            <input
              type="time"
              value={localPreferences.quiet_hours_start || '22:00'}
              onChange={(e) => handleTimeChange('quiet_hours_start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fim
            </label>
            <input
              type="time"
              value={localPreferences.quiet_hours_end || '08:00'}
              onChange={(e) => handleTimeChange('quiet_hours_end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fuso Horário
            </label>
            <select
              value={localPreferences.timezone || 'America/Sao_Paulo'}
              onChange={(e) => setLocalPreferences(prev => ({ ...prev, timezone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
          Durante o horário silencioso, você não receberá notificações push ou por email.
          As notificações no app continuarão funcionando normalmente.
        </p>
      </div>
    </div>
  );
};

export default NotificationSettings;