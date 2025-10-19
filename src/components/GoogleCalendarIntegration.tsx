import React, { useState, useEffect } from 'react';
import { Calendar, RefreshCw, Settings, CheckCircle, XCircle, ExternalLink, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { googleCalendarService } from '../services/googleCalendarService';

interface GoogleCalendarIntegrationProps {
  onClose: () => void;
}

const GoogleCalendarIntegration: React.FC<GoogleCalendarIntegrationProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [lastSync, setLastSync] = useState<string>('');
  const [calendarId, setCalendarId] = useState('primary');
  const [calendars, setCalendars] = useState<any[]>([]);
  const [showAuth, setShowAuth] = useState(false);

  const googleService = googleCalendarService;

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    if (!user) return;

    try {
      const config = await googleService.getIntegrationConfig(user.id);
      setIsConnected(!!config);
      
      if (config) {
        setLastSync(config.last_sync || 'Nunca');
        setCalendarId(config.calendar_id);
        await loadCalendars(config.access_token);
      }
    } catch (error) {
      console.error('Erro ao verificar status da conexão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendars = async (accessToken: string) => {
    try {
      const calendarList = await googleService.listCalendars(accessToken);
      setCalendars(calendarList);
    } catch (error) {
      console.error('Erro ao carregar calendários:', error);
    }
  };

  const handleConnect = () => {
    try {
      const authUrl = googleService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
    }
  };

  const handleDisconnect = async () => {
    if (!user) return;

    try {
      await googleService.saveIntegrationConfig({
        user_id: user.id,
        sync_enabled: false,
      });
      
      setIsConnected(false);
      setLastSync('');
      setCalendars([]);
    } catch (error) {
      console.error('Erro ao desconectar:', error);
    }
  };

  const handleSync = async () => {
    if (!user) return;

    setIsSyncing(true);
    setSyncStatus('Iniciando sincronização...');

    try {
      const config = await googleService.getIntegrationConfig(user.id);
      if (!config) {
        setSyncStatus('Erro: Configuração não encontrada');
        return;
      }

      // Sincronizar do Google para o CRM
      setSyncStatus('Sincronizando eventos do Google Calendar...');
      const googleToCRM = await googleService.syncGoogleToCRM(
        user.id,
        config.access_token,
        config.calendar_id
      );

      // Sincronizar do CRM para o Google
      setSyncStatus('Sincronizando eventos do CRM...');
      const crmToGoogle = await googleService.syncCRMToGoogle(
        user.id,
        config.access_token,
        config.calendar_id
      );

      setSyncStatus(`Sincronização concluída! ${googleToCRM} eventos do Google → CRM, ${crmToGoogle} eventos do CRM → Google`);
      
      // Atualizar última sincronização
      await checkConnectionStatus();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncStatus('Erro na sincronização. Tente novamente.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCalendarChange = async (newCalendarId: string) => {
    if (!user) return;

    try {
      const config = await googleService.getIntegrationConfig(user.id);
      if (config) {
        await googleService.saveIntegrationConfig({
          user_id: user.id,
          calendar_id: newCalendarId,
        });
        setCalendarId(newCalendarId);
      }
    } catch (error) {
      console.error('Erro ao alterar calendário:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Integração Google Calendar
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Status da Conexão */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {isConnected ? 'Conectado ao Google Calendar' : 'Não conectado'}
                </p>
                {isConnected && lastSync && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={isConnected ? handleDisconnect : handleConnect}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isConnected
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isConnected ? 'Desconectar' : 'Conectar'}
            </button>
          </div>

          {/* Configurações */}
          {isConnected && (
            <>
              {/* Seleção de Calendário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Calendário para Sincronização
                </label>
                <select
                  value={calendarId}
                  onChange={(e) => handleCalendarChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {calendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sincronização Manual */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Sincronização Manual</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sincronize seus compromissos entre o CRM e Google Calendar
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                  </button>
                </div>

                {syncStatus && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">{syncStatus}</p>
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Como funciona a sincronização?
                </h4>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                              <li>• Eventos do Google Calendar → Atividades no Nuvra CRM</li>
            <li>• Atividades do Nuvra CRM → Eventos no Google Calendar</li>
                  <li>• Sincronização bidirecional automática</li>
                  <li>• Evita duplicatas através de controle interno</li>
                </ul>
              </div>
            </>
          )}

          {/* Instruções de Conexão */}
          {!isConnected && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                Como conectar com Google Calendar?
              </h4>
              <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Clique em "Conectar"</li>
                <li>2. Faça login na sua conta Google</li>
                <li>3. Autorize o acesso ao Google Calendar</li>
                <li>4. Escolha o calendário para sincronização</li>
                <li>5. Configure a sincronização automática</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarIntegration;