import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { IntegrationService } from '../services/integrationService';

export const useIntegrations = () => {
  const { user } = useAuth();
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadIntegrations();
    }
  }, [user]);

  const loadIntegrations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (!error) {
      setIntegrations(data || []);
    }
    setLoading(false);
  };

  const sendWhatsAppMessage = async (to: string, message: string) => {
    const whatsappIntegration = integrations.find(i => i.type === 'whatsapp');
    if (!whatsappIntegration) {
      throw new Error('Integração WhatsApp não configurada');
    }

    return await IntegrationService.sendWhatsAppMessage(whatsappIntegration.id, to, message);
  };

  const triggerN8nWorkflow = async (workflowId: string, data: any) => {
    const n8nIntegration = integrations.find(i => i.type === 'n8n');
    if (!n8nIntegration) {
      throw new Error('Integração n8n não configurada');
    }

    return await IntegrationService.triggerN8nWorkflow(n8nIntegration.id, workflowId, data);
  };

  const sendSlackMessage = async (channel: string, message: string) => {
    const slackIntegration = integrations.find(i => i.type === 'slack');
    if (!slackIntegration) {
      throw new Error('Integração Slack não configurada');
    }

    return await IntegrationService.sendSlackMessage(slackIntegration.id, channel, message);
  };

  const sendEmail = async (to: string, subject: string, content: string) => {
    const emailIntegration = integrations.find(i => i.type === 'sendgrid');
    if (!emailIntegration) {
      throw new Error('Integração de email não configurada');
    }

    return await IntegrationService.sendEmail(emailIntegration.id, to, subject, content);
  };

  const triggerWebhook = async (data: any) => {
    const webhookIntegrations = integrations.filter(i => i.type === 'webhook');
    
    const promises = webhookIntegrations.map(integration => {
      if (integration.type === 'zapier') {
        return IntegrationService.triggerZapierWebhook(integration.id, integration.config.webhookUrl, data);
      } else {
        // Webhook personalizado
        return fetch(integration.config.url, {
          method: integration.config.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...JSON.parse(integration.config.headers || '{}')
          },
          body: JSON.stringify(data)
        });
      }
    });

    return await Promise.allSettled(promises);
  };

  return {
    integrations,
    loading,
    sendWhatsAppMessage,
    triggerN8nWorkflow,
    sendSlackMessage,
    sendEmail,
    triggerWebhook,
    reload: loadIntegrations
  };
};