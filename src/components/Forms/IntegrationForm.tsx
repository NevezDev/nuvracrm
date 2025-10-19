import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Integration } from '../../services/integrationService';

interface IntegrationFormProps {
  integration?: Integration | null;
  onClose: () => void;
}

const IntegrationForm: React.FC<IntegrationFormProps> = ({ integration, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    type: 'whatsapp',
    config: {} as any,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (integration) {
      setFormData({
        name: integration.name,
        type: integration.type,
        config: integration.config,
      });
    }
  }, [integration]);

  const integrationTypes = [
    { value: 'whatsapp', label: 'WhatsApp Business API', icon: '💬' },
    { value: 'instagram', label: 'Instagram Business', icon: '📷' },
    { value: 'telegram', label: 'Telegram Bot', icon: '✈️' },
    { value: 'n8n', label: 'n8n Automation', icon: '🔄' },
    { value: 'zapier', label: 'Zapier Webhook', icon: '⚡' },
    { value: 'slack', label: 'Slack', icon: '💬' },
    { value: 'sendgrid', label: 'SendGrid Email', icon: '📧' },
    { value: 'webhook', label: 'Webhook Personalizado', icon: '🔗' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      const dataToSubmit = {
        name: formData.name,
        type: formData.type,
        config: formData.config,
        user_id: user.id,
        status: 'inactive' as const,
      };

      if (integration) {
        const { error } = await supabase
          .from('integrations')
          .update(dataToSubmit)
          .eq('id', integration.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('integrations')
          .insert([dataToSubmit]);

        if (error) throw error;
      }

      onClose();
    } catch (error) {
      console.error('Error saving integration:', error);
      alert('Erro ao salvar integração: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }));
  };

  const renderConfigFields = () => {
    switch (formData.type) {
      case 'whatsapp':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Token *
              </label>
              <input
                type="password"
                value={formData.config.accessToken || ''}
                onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Token de acesso do Meta Business"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number ID *
              </label>
              <input
                type="text"
                value={formData.config.phoneNumberId || ''}
                onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="ID do número no Meta Business"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Business Account ID *
              </label>
              <input
                type="text"
                value={formData.config.businessAccountId || ''}
                onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="ID da conta business no Meta"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número do WhatsApp
              </label>
              <input
                type="text"
                value={formData.config.phoneNumber || ''}
                onChange={(e) => handleConfigChange('phoneNumber', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="+5511999999999"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                value={formData.config.verifyToken || ''}
                onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Token personalizado para verificação"
              />
            </div>
            {user && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Configuração do Webhook no Meta Business:
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Callback URL:</p>
                    <code className="text-xs text-blue-700 dark:text-blue-300 break-all bg-white dark:bg-gray-800 p-1 rounded">
                      {import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-webhook?platform=whatsapp&user_id={user.id}
                    </code>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Verify Token:</p>
                    <code className="text-xs text-blue-700 dark:text-blue-300 break-all bg-white dark:bg-gray-800 p-1 rounded">
                      {formData.config.verifyToken || 'Defina um token acima'}
                    </code>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    Configure estes valores no webhook do Meta Business Manager para receber mensagens.
                  </p>
                </div>
              </div>
            )}
          </>
        );

      case 'instagram':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Token
              </label>
              <input
                type="password"
                value={formData.config.accessToken || ''}
                onChange={(e) => handleConfigChange('accessToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Token de acesso da página Instagram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Page ID
              </label>
              <input
                type="text"
                value={formData.config.pageId || ''}
                onChange={(e) => handleConfigChange('pageId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="ID da página Instagram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.config.webhookUrl || ''}
                onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="URL para receber mensagens"
              />
            </div>
          </>
        );

      case 'telegram':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={formData.config.botToken || ''}
                onChange={(e) => handleConfigChange('botToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Token do bot Telegram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Webhook URL
              </label>
              <input
                type="url"
                value={formData.config.webhookUrl || ''}
                onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="URL para receber mensagens"
              />
            </div>
          </>
        );

      case 'n8n':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL Base do n8n
              </label>
              <input
                type="url"
                value={formData.config.baseUrl || ''}
                onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://seu-n8n.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Chave da API do n8n"
              />
            </div>
          </>
        );

      case 'zapier':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Webhook URL
            </label>
            <input
              type="url"
              value={formData.config.webhookUrl || ''}
              onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="https://hooks.zapier.com/hooks/catch/..."
            />
          </div>
        );

      case 'slack':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bot Token
              </label>
              <input
                type="password"
                value={formData.config.botToken || ''}
                onChange={(e) => handleConfigChange('botToken', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="xoxb-..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Canal Padrão
              </label>
              <input
                type="text"
                value={formData.config.defaultChannel || ''}
                onChange={(e) => handleConfigChange('defaultChannel', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="#geral"
              />
            </div>
          </>
        );

      case 'sendgrid':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={formData.config.apiKey || ''}
                onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="SG...."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Remetente
              </label>
              <input
                type="email"
                value={formData.config.fromEmail || ''}
                onChange={(e) => handleConfigChange('fromEmail', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="noreply@suaempresa.com"
              />
            </div>
          </>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                URL do Webhook
              </label>
              <input
                type="url"
                value={formData.config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="https://api.exemplo.com/webhook"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Método HTTP
              </label>
              <select
                value={formData.config.method || 'POST'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Headers (JSON)
              </label>
              <textarea
                value={formData.config.headers || '{}'}
                onChange={(e) => handleConfigChange('headers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder='{"Authorization": "Bearer token", "Content-Type": "application/json"}'
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {integration ? 'Editar Integração' : 'Nova Integração'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Integração *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Ex: WhatsApp Principal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Integração *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, config: {} }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              {integrationTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          {renderConfigFields()}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntegrationForm;