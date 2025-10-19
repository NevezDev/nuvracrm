import React from 'react';
import { FiMessageCircle, FiExternalLink } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

const CHATWOOT_URL = 'https://nuvra-chatwoot.3kuf6w.easypanel.host/'; // Altere para a URL real do seu Chatwoot

const Chat = () => {
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
      <div className="text-center p-8 max-w-md rounded-xl shadow-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <FiMessageCircle className="text-6xl mb-4 mx-auto text-blue-500 opacity-80" />
        <h2 className="text-2xl font-bold mb-2">Atendimento via Chat</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Para acessar o chat, clique no botão abaixo e acesse o chat de atendimento em uma nova aba.
        </p>
        <a
          href={CHATWOOT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg shadow transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
          <FiExternalLink size={22} />
          Acessar Chat de Atendimento
        </a>
      </div>
    </div>
  );
};

export default Chat;
