import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarService } from '../services/googleCalendarService';

interface GoogleCalendarConfig {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  calendar_id: string;
  sync_enabled: boolean;
  last_sync: string;
  created_at: string;
  updated_at: string;
}

export const useGoogleCalendar = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<GoogleCalendarConfig | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [lastSync, setLastSync] = useState<string>('');

  const googleService = googleCalendarService;

  // Verificar status da conexão
  const checkConnection = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const userConfig = await googleService.getIntegrationConfig(user.id);
      
      setIsConnected(!!userConfig);
      setConfig(userConfig);
      
      if (userConfig) {
        setLastSync(userConfig.last_sync || 'Nunca');
        await loadCalendars(userConfig.access_token);
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [user, googleService]);

  // Carregar calendários
  const loadCalendars = useCallback(async (accessToken: string) => {
    try {
      const calendarList = await googleService.listCalendars(accessToken);
      setCalendars(calendarList);
    } catch (error) {
      console.error('Erro ao carregar calendários:', error);
      setCalendars([]);
    }
  }, [googleService]);

  // Sincronizar eventos
  const syncEvents = useCallback(async (): Promise<{ googleToCRM: number; crmToGoogle: number }> => {
    if (!user || !config) {
      throw new Error('Usuário não autenticado ou configuração não encontrada');
    }

    try {
      // Sincronizar do Google para o CRM
      const googleToCRM = await googleService.syncGoogleToCRM(
        user.id,
        config.access_token,
        config.calendar_id
      );

      // Sincronizar do CRM para o Google
      const crmToGoogle = await googleService.syncCRMToGoogle(
        user.id,
        config.access_token,
        config.calendar_id
      );

      // Atualizar última sincronização
      await googleService.saveIntegrationConfig({
        user_id: user.id,
        last_sync: new Date().toISOString(),
      });

      // Recarregar configuração
      await checkConnection();

      return { googleToCRM, crmToGoogle };
    } catch (error) {
      console.error('Erro na sincronização:', error);
      throw error;
    }
  }, [user, config, googleService, checkConnection]);

  // Conectar com Google Calendar
  const connect = useCallback(() => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || 'your-google-client-id';
    const redirectUri = `${window.location.origin}/google-callback`;
    const scope = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
    
    window.location.href = authUrl;
  }, []);

  // Desconectar
  const disconnect = useCallback(async () => {
    if (!user) return;

    try {
      await googleService.saveIntegrationConfig({
        user_id: user.id,
        sync_enabled: false,
      });
      
      setIsConnected(false);
      setConfig(null);
      setLastSync('');
      setCalendars([]);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  }, [user, googleService]);

  // Alterar calendário
  const changeCalendar = useCallback(async (newCalendarId: string) => {
    if (!user) return;

    try {
      await googleService.saveIntegrationConfig({
        user_id: user.id,
        calendar_id: newCalendarId,
      });
      
      if (config) {
        setConfig({ ...config, calendar_id: newCalendarId });
      }
    } catch (error) {
      console.error('Erro ao alterar calendário:', error);
    }
  }, [user, config, googleService]);

  // Verificar conexão na inicialização
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  return {
    isConnected,
    isLoading,
    config,
    calendars,
    lastSync,
    connect,
    disconnect,
    syncEvents,
    changeCalendar,
    checkConnection,
  };
}; 