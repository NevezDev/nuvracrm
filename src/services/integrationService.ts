import { supabase } from '../lib/supabase';

export interface Integration {
  id: string;
  name: string;
  type: string;
  config: any;
  status: 'active' | 'inactive' | 'error';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationLog {
  id: string;
  integration_id: string;
  action: string;
  status: 'success' | 'error' | 'pending';
  request_data: any;
  response_data: any;
  error_message: string | null;
  created_at: string;
}

export class IntegrationService {
  // WhatsApp Integration
  static async sendWhatsAppMessage(integrationId: string, to: string, message: string) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('type', 'whatsapp')
        .single();

      if (!integration || integration.status !== 'active') {
        throw new Error('Integração WhatsApp não encontrada ou inativa');
      }

      const { accessToken, phoneNumberId } = integration.config;
      
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: { body: message }
        }),
      });

      const result = await response.json();

      // Log da integração
      await this.logIntegrationAction(integrationId, 'send_message', {
        to,
        message,
        status: response.ok ? 'success' : 'error',
        response: result
      });

      return result;
    } catch (error) {
      await this.logIntegrationAction(integrationId, 'send_message', {
        to,
        message,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Cadastro de integração WhatsApp Cloud API
  static async createWhatsAppIntegration(userId: string, accessToken: string, phoneNumberId: string, verifyToken: string) {
    const integration = {
      name: 'WhatsApp Cloud',
      type: 'whatsapp',
      user_id: userId,
      config: {
        accessToken,
        phoneNumberId,
        verifyToken,
      },
      status: 'active',
    };
    const { data, error } = await supabase.from('integrations').insert([integration]).select();
    if (error) throw new Error('Erro ao criar integração WhatsApp: ' + error.message);
    return data?.[0];
  }

  // n8n Integration
  static async triggerN8nWorkflow(integrationId: string, workflowId: string, data: any) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('type', 'n8n')
        .single();

      if (!integration || integration.status !== 'active') {
        throw new Error('Integração n8n não encontrada ou inativa');
      }

      const { baseUrl, apiKey } = integration.config;
      
      const response = await fetch(`${baseUrl}/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: {
          'X-N8N-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      await this.logIntegrationAction(integrationId, 'trigger_workflow', {
        workflowId,
        data,
        status: response.ok ? 'success' : 'error',
        response: result
      });

      return result;
    } catch (error) {
      await this.logIntegrationAction(integrationId, 'trigger_workflow', {
        workflowId,
        data,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Zapier Integration
  static async triggerZapierWebhook(integrationId: string, webhookUrl: string, data: any) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.text();

      await this.logIntegrationAction(integrationId, 'trigger_webhook', {
        webhookUrl,
        data,
        status: response.ok ? 'success' : 'error',
        response: result
      });

      return result;
    } catch (error) {
      await this.logIntegrationAction(integrationId, 'trigger_webhook', {
        webhookUrl,
        data,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Slack Integration
  static async sendSlackMessage(integrationId: string, channel: string, message: string) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('type', 'slack')
        .single();

      if (!integration || integration.status !== 'active') {
        throw new Error('Integração Slack não encontrada ou inativa');
      }

      const { botToken } = integration.config;
      
      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channel: channel,
          text: message
        }),
      });

      const result = await response.json();

      await this.logIntegrationAction(integrationId, 'send_message', {
        channel,
        message,
        status: result.ok ? 'success' : 'error',
        response: result
      });

      return result;
    } catch (error) {
      await this.logIntegrationAction(integrationId, 'send_message', {
        channel,
        message,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Email Integration (SendGrid)
  static async sendEmail(integrationId: string, to: string, subject: string, content: string) {
    try {
      const { data: integration } = await supabase
        .from('integrations')
        .select('*')
        .eq('id', integrationId)
        .eq('type', 'sendgrid')
        .single();

      if (!integration || integration.status !== 'active') {
        throw new Error('Integração SendGrid não encontrada ou inativa');
      }

      const { apiKey, fromEmail } = integration.config;
      
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: to }]
          }],
          from: { email: fromEmail },
          subject: subject,
          content: [{
            type: 'text/html',
            value: content
          }]
        }),
      });

      const result = response.status === 202 ? { success: true } : await response.json();

      await this.logIntegrationAction(integrationId, 'send_email', {
        to,
        subject,
        status: response.status === 202 ? 'success' : 'error',
        response: result
      });

      return result;
    } catch (error) {
      await this.logIntegrationAction(integrationId, 'send_email', {
        to,
        subject,
        status: 'error',
        error: error.message
      });
      throw error;
    }
  }

  // Log de ações das integrações
  static async logIntegrationAction(integrationId: string, action: string, data: any) {
    try {
      await supabase
        .from('integration_logs')
        .insert({
          integration_id: integrationId,
          action: action,
          status: data.status,
          request_data: { ...data, status: undefined, response: undefined, error: undefined },
          response_data: data.response || {},
          error_message: data.error || null
        });
    } catch (error) {
      console.error('Erro ao salvar log da integração:', error);
    }
  }

  // Testar integração
  static async testIntegration(integration: Integration) {
    try {
      switch (integration.type) {
        case 'whatsapp':
          const { accessToken, phoneNumberId } = integration.config;
          const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: 'seu_numero_teste', // coloque seu número de teste aqui
              type: 'text',
              text: { body: 'Teste de integração WhatsApp Cloud API' },
            }),
          });
          return {
            success: response.ok,
            message: response.ok ? 'Mensagem enviada com sucesso' : 'Falha ao enviar mensagem'
          };

        case 'n8n':
          const { baseUrl, apiKey } = integration.config;
          const n8nResponse = await fetch(`${baseUrl}/api/v1/workflows`, {
            headers: { 'X-N8N-API-KEY': apiKey }
          });
          return {
            success: n8nResponse.ok,
            message: n8nResponse.ok ? 'Conexão bem-sucedida' : 'Falha na conexão'
          };

        case 'slack':
          const { botToken } = integration.config;
          const slackResponse = await fetch('https://slack.com/api/auth.test', {
            headers: { 'Authorization': `Bearer ${botToken}` }
          });
          const slackResult = await slackResponse.json();
          return {
            success: slackResult.ok,
            message: slackResult.ok ? 'Conexão bem-sucedida' : slackResult.error
          };

        default:
          return { success: false, message: 'Tipo de integração não suportado para teste' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}
