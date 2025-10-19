// src/contexts/ThemeContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark';

interface Preferences {
  language: string;
  timezone: string;
  notifications: boolean;
  [key: string]: any;
}

interface ThemeContextProps {
  theme: Theme;
  toggleTheme: () => void;
  preferences: Preferences;
  updatePreferences: (newPrefs: Partial<Preferences>) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'dark'; // fallback seguro
  });
  
  const [preferences, setPreferences] = useState<Preferences>(() => {
    const stored = localStorage.getItem('preferences');
    if (stored) return JSON.parse(stored);
    return {
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: true
    };
  });

  // Aplica a classe no HTML
  const applyTheme = (t: Theme) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', t);
  };

  // Carrega preferências do Supabase (ou localStorage se não logado)
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) {
            console.error('Erro ao carregar preferências:', error);
            return;
          }

          if (data) {
            // Carrega o tema
            if (data.theme === 'light' || data.theme === 'dark') {
              setTheme(data.theme);
              applyTheme(data.theme);
            }
            
            // Carrega outras preferências
            const userPrefs: Preferences = {
              language: data.language || 'pt-BR',
              timezone: data.timezone || 'America/Sao_Paulo',
              notifications: data.notifications !== undefined ? data.notifications : true
            };
            
            setPreferences(userPrefs);
            localStorage.setItem('preferences', JSON.stringify(userPrefs));
          }
        } catch (err) {
          console.error('Erro ao processar preferências:', err);
        }
      }
    };

    loadUserPreferences();
  }, [user]);

  const toggleTheme = async () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);

    if (user) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: user.id, theme: newTheme }, { onConflict: ['user_id'] });
    }
  };
  
  const updatePreferences = async (newPrefs: Partial<Preferences>) => {
    const updatedPrefs = { ...preferences, ...newPrefs };
    setPreferences(updatedPrefs);
    localStorage.setItem('preferences', JSON.stringify(updatedPrefs));
    
    if (user) {
      await supabase
        .from('user_preferences')
        .upsert(
          { 
            user_id: user.id, 
            ...newPrefs 
          }, 
          { onConflict: ['user_id'] }
        );
    }
  };

  useEffect(() => {
    // Aplica tema salvo ao carregar (evita piscar)
    applyTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, preferences, updatePreferences }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
