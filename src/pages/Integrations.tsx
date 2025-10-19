import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { googleCalendarService } from '../services/googleCalendarService';

const Integrations: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [configStatus, setConfigStatus] = useState<{ configured: boolean; missing: string[] }>({ configured: false, missing: [] });

  useEffect(() => {
    checkConnection();
    checkConfigStatus();
    processAuthCode();
  }, []);

  const checkConnection = () => {
    const connected = googleCalendarService.isAuthenticated();
    setIsConnected(connected);
  };

  const checkConfigStatus = () => {
    const status = googleCalendarService.getConfigStatus();
    setConfigStatus(status);
    console.log('Config Status:', status);
  };

  // Processar código de autorização retornado pelo Google
  const processAuthCode = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      setSyncStatus('loading');
      setSyncMessage('Processando autorização...');
      
      try {
        const success = await googleCalendarService.handleAuthCode(code);
        if (success) {
          setIsConnected(true);
          setSyncStatus('success');
          setSyncMessage('Google Calendar conectado com sucesso!');
          // Limpar a URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setSyncStatus('error');
          setSyncMessage('Erro ao processar autorização do Google Calendar.');
        }
      } catch (error) {
        console.error('Erro ao processar código de autorização:', error);
        setSyncStatus('error');
        setSyncMessage('Erro ao processar autorização: ' + (error as Error).message);
      }
    }
  };

  const handleGoogleAuth = () => {
    try {
      const authUrl = googleCalendarService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Erro ao gerar URL de autorização:', error);
      setSyncStatus('error');
      setSyncMessage('Configuração do Google Calendar incompleta. Siga o guia de configuração.');
    }
  };

  const handleDisconnect = () => {
    googleCalendarService.logout();
    setIsConnected(false);
    setSyncMessage('Desconectado do Google Calendar');
  };

  const handleSync = async () => {
    setSyncStatus('loading');
    setSyncMessage('Sincronizando eventos...');
    
    try {
      await googleCalendarService.syncEvents();
      setSyncStatus('success');
      setSyncMessage('Sincronização concluída com sucesso!');
    } catch (error) {
      setSyncStatus('error');
      setSyncMessage('Erro na sincronização: ' + (error as Error).message);
    }
  };

  const handleCheckConnection = () => {
    checkConnection();
    setSyncMessage('Status da conexão verificado');
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Integrações</h1>
      
      {/* Status da Configuração */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Status da Configuração</h2>
          <span
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm ${
              configStatus.configured
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            }`}
          >
            {configStatus.configured ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Configurado
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                Incompleto
              </>
            )}
          </span>
        </div>

        {configStatus.configured ? (
          <div className="flex items-center gap-3 text-green-700 dark:text-green-200">
            <CheckCircle className="w-5 h-5" />
            <p>Todas as variáveis de ambiente estão configuradas.</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-200">
              <AlertTriangle className="w-5 h-5" />
              <p>Configuração incompleta. Variáveis faltando:</p>
            </div>
            <ul className="mt-3 ml-6 list-disc text-sm text-gray-700 dark:text-gray-300">
              {configStatus.missing.map((variable) => (
                <li key={variable}>{variable}</li>
              ))}
            </ul>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Verifique o arquivo <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env</code>
              e siga o guia <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">ENV_EXAMPLE.md</code>
            </div>
          </div>
        )}
      </div>

      {/* Google Calendar Integration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Google Calendar</h3>
              <p className="text-gray-600 dark:text-gray-400">Sincronize suas atividades com o Google Calendar</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
          }`}>
            {isConnected ? 'Conectado' : 'Desconectado'}
          </div>
        </div>
        
        <div className="space-y-3">
          {!isConnected ? (
            <div className="space-y-3">
              <button
                onClick={handleGoogleAuth}
                disabled={!configStatus.configured}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  configStatus.configured
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {configStatus.configured ? 'Conectar Google Calendar' : 'Configuração Necessária'}
              </button>
              <button
                onClick={handleCheckConnection}
                className="w-full py-2 px-4 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
              >
                Verificar Conexão
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleSync}
                disabled={syncStatus === 'loading'}
                className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {syncStatus === 'loading' ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
              <button
                onClick={handleDisconnect}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Desconectar
              </button>
                      </div>
                    )}

          {syncMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              syncStatus === 'error' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : syncStatus === 'success'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            }`}>
              {syncMessage}
            </div>
          )}
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">ℹ️ Informações</h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• A sincronização é bidirecional entre o CRM e Google Calendar</li>
            <li>• Atividades criadas no CRM podem ser sincronizadas automaticamente</li>
          <li>• Use o botão "Sincronizar Agora" para sincronização manual</li>
          <li>• Consulte o arquivo ENV_EXAMPLE.md para configuração</li>
        </ul>
      </div>
    </div>
  );
};

export default Integrations;