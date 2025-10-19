-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  category TEXT NOT NULL CHECK (category IN ('lead', 'contact', 'deal', 'activity', 'system', 'integration')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN DEFAULT FALSE,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Create notification preferences table
CREATE TABLE notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  push_enabled BOOLEAN DEFAULT TRUE,
  in_app_enabled BOOLEAN DEFAULT TRUE,
  categories JSONB DEFAULT '{
    "lead": {"email": true, "push": true, "in_app": true},
    "contact": {"email": true, "push": true, "in_app": true},
    "deal": {"email": true, "push": true, "in_app": true},
    "activity": {"email": true, "push": true, "in_app": true},
    "system": {"email": true, "push": false, "in_app": true},
    "integration": {"email": false, "push": false, "in_app": true}
  }',
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification templates table
CREATE TABLE notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'reminder')),
  category TEXT NOT NULL CHECK (category IN ('lead', 'contact', 'deal', 'activity', 'system', 'integration')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  action_url_template TEXT,
  action_label TEXT,
  variables JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification templates
INSERT INTO notification_templates (name, title_template, message_template, type, category, priority, action_url_template, action_label, variables) VALUES
('new_lead', 'Novo Lead Recebido', 'Um novo lead {{lead_name}} foi adicionado ao sistema.', 'info', 'lead', 'medium', '/leads/{{lead_id}}', 'Ver Lead', '["lead_name", "lead_id"]'),
('lead_status_changed', 'Status do Lead Alterado', 'O lead {{lead_name}} teve seu status alterado para {{new_status}}.', 'info', 'lead', 'medium', '/leads/{{lead_id}}', 'Ver Lead', '["lead_name", "new_status", "lead_id"]'),
('deal_won', 'Negócio Fechado!', 'Parabéns! O negócio {{deal_title}} foi fechado com sucesso no valor de {{deal_value}}.', 'success', 'deal', 'high', '/deals/{{deal_id}}', 'Ver Negócio', '["deal_title", "deal_value", "deal_id"]'),
('deal_lost', 'Negócio Perdido', 'O negócio {{deal_title}} foi marcado como perdido.', 'warning', 'deal', 'medium', '/deals/{{deal_id}}', 'Ver Negócio', '["deal_title", "deal_id"]'),
('activity_reminder', 'Lembrete de Atividade', 'Você tem uma atividade agendada: {{activity_title}} em {{activity_date}}.', 'reminder', 'activity', 'high', '/activities/{{activity_id}}', 'Ver Atividade', '["activity_title", "activity_date", "activity_id"]'),
('activity_overdue', 'Atividade Atrasada', 'A atividade {{activity_title}} está atrasada desde {{due_date}}.', 'warning', 'activity', 'high', '/activities/{{activity_id}}', 'Ver Atividade', '["activity_title", "due_date", "activity_id"]'),
('integration_error', 'Erro na Integração', 'Ocorreu um erro na integração {{integration_name}}: {{error_message}}.', 'error', 'integration', 'high', '/integrations', 'Ver Integrações', '["integration_name", "error_message"]'),
('system_maintenance', 'Manutenção do Sistema', 'O sistema entrará em manutenção em {{maintenance_date}}.', 'warning', 'system', 'medium', null, null, '["maintenance_date"]');

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_notification_preferences_for_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create notification preferences
CREATE TRIGGER trigger_create_notification_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences_for_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_preferences_updated_at
  BEFORE UPDATE ON notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Notification preferences policies
CREATE POLICY "Users can view their own preferences" ON notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON notification_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification templates policies (read-only for users)
CREATE POLICY "Users can view notification templates" ON notification_templates
  FOR SELECT USING (active = true);

-- Comments
COMMENT ON TABLE notifications IS 'Armazena todas as notificações do sistema';
COMMENT ON TABLE notification_preferences IS 'Preferências de notificação dos usuários';
COMMENT ON TABLE notification_templates IS 'Templates para geração automática de notificações';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: info, success, warning, error, reminder';
COMMENT ON COLUMN notifications.category IS 'Categoria da notificação: lead, contact, deal, activity, system, integration';
COMMENT ON COLUMN notifications.priority IS 'Prioridade da notificação: low, medium, high, urgent';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais da notificação em formato JSON';
COMMENT ON COLUMN notification_preferences.categories IS 'Configurações de notificação por categoria';
COMMENT ON COLUMN notification_templates.variables IS 'Variáveis disponíveis no template';