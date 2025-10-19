interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
}

interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  attendees?: string[];
}

class GoogleCalendarService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private accessToken: string | null = null;

  constructor() {
    this.clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
    this.clientSecret = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
    this.redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || '';
    
    // Debug: verificar se as variáveis estão sendo carregadas
    console.log('Google Calendar Config Debug:', {
      clientId: this.clientId ? '✅ Configurado' : '❌ Não configurado',
      clientSecret: this.clientSecret ? '✅ Configurado' : '❌ Não configurado',
      redirectUri: this.redirectUri ? '✅ Configurado' : '❌ Não configurado'
    });
  }

  // Método para verificar configuração
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret && this.redirectUri);
  }

  // Método para obter status da configuração
  getConfigStatus(): { configured: boolean; missing: string[] } {
    const missing = [];
    if (!this.clientId) missing.push('VITE_GOOGLE_CLIENT_ID');
    if (!this.clientSecret) missing.push('VITE_GOOGLE_CLIENT_SECRET');
    if (!this.redirectUri) missing.push('VITE_GOOGLE_REDIRECT_URI');
    
    return {
      configured: missing.length === 0,
      missing
    };
  }

  // Inicializar autenticação
  async initialize(): Promise<boolean> {
    try {
      const token = localStorage.getItem('google_calendar_token');
      if (token) {
        const tokenData = JSON.parse(token);
        this.accessToken = tokenData.access_token;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao inicializar Google Calendar:', error);
      return false;
    }
  }

  // Obter URL de autorização
  getAuthUrl(): string {
    // Verificar se as variáveis de ambiente estão configuradas
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new Error('Configuração do Google Calendar incompleta. Verifique as variáveis de ambiente: VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_CLIENT_SECRET, VITE_GOOGLE_REDIRECT_URI');
    }

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: scopes.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Processar código de autorização
  async handleAuthCode(code: string): Promise<boolean> {
    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Erro na resposta do Google:', errorData);
        throw new Error('Erro na troca de código por token');
      }

      const tokens = await response.json();
      this.accessToken = tokens.access_token;
      
      // Salvar token com informações de expiração
      const tokenData = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
        expires_at: Date.now() + (tokens.expires_in * 1000), // Converter para timestamp
        token_type: tokens.token_type
      };
      
      localStorage.setItem('google_calendar_token', JSON.stringify(tokenData));
      console.log('Token salvo com sucesso:', tokenData);
      return true;
    } catch (error) {
      console.error('Erro ao processar código de autorização:', error);
      return false;
    }
  }

  // Verificar se está autenticado
  isAuthenticated(): boolean {
    // Verificar se há token em memória
    if (this.accessToken) {
      return true;
    }
    
    // Verificar se há token no localStorage
    const tokenData = localStorage.getItem('google_calendar_token');
    if (tokenData) {
      try {
        const token = JSON.parse(tokenData);
        // Verificar se o token não expirou
        if (token.access_token && (!token.expires_at || Date.now() < token.expires_at)) {
          this.accessToken = token.access_token;
          return true;
        } else {
          // Token expirado, remover
          localStorage.removeItem('google_calendar_token');
        }
      } catch (error) {
        console.error('Erro ao verificar token:', error);
        localStorage.removeItem('google_calendar_token');
      }
    }
    
    return false;
  }

  // Fazer logout
  logout(): void {
    this.accessToken = null;
    localStorage.removeItem('google_calendar_token');
  }

  // Listar eventos do Google Calendar
  async listEvents(timeMin?: string, timeMax?: string): Promise<GoogleCalendarEvent[]> {
    if (!this.accessToken) {
      throw new Error('Google Calendar não inicializado');
    }

    try {
      const params = new URLSearchParams({
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao listar eventos');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Erro ao listar eventos:', error);
      throw error;
    }
  }

  // Criar evento no Google Calendar
  async createEvent(eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    if (!this.accessToken) {
      throw new Error('Google Calendar não inicializado');
    }

    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location,
        attendees: eventData.attendees?.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 30 },
          ],
        },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao criar evento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      throw error;
    }
  }

  // Atualizar evento no Google Calendar
  async updateEvent(eventId: string, eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    if (!this.accessToken) {
      throw new Error('Google Calendar não inicializado');
    }

    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: eventData.endDate,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        location: eventData.location,
        attendees: eventData.attendees?.map(email => ({ email })),
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar evento');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      throw error;
    }
  }

  // Excluir evento do Google Calendar
  async deleteEvent(eventId: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Google Calendar não inicializado');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao excluir evento');
      }
    } catch (error) {
      console.error('Erro ao excluir evento:', error);
      throw error;
    }
  }

  // Sincronizar eventos do Google Calendar com o CRM
  async syncEvents(): Promise<GoogleCalendarEvent[]> {
    try {
      const events = await this.listEvents();
      return events;
    } catch (error) {
      console.error('Erro ao sincronizar eventos:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
export type { GoogleCalendarEvent, CreateEventData }; 