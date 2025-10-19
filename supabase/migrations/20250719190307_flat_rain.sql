/*
  # Sistema de Chat Integrado

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `contact_name` (text) - Nome do contato
      - `contact_phone` (text) - Telefone/ID do contato
      - `contact_avatar` (text) - URL do avatar do contato
      - `platform` (text) - Plataforma (whatsapp, instagram, telegram, internal)
      - `platform_contact_id` (text) - ID do contato na plataforma
      - `last_message` (text) - Última mensagem
      - `last_message_time` (timestamp) - Hora da última mensagem
      - `unread_count` (integer) - Contador de mensagens não lidas
      - `status` (text) - Status da conversa (active, archived, blocked)
      - `contact_id` (uuid) - Referência para tabela contacts (opcional)
      - `user_id` (uuid) - ID do usuário
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `chat_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid) - ID da conversa
      - `content` (text) - Conteúdo da mensagem
      - `sender_type` (text) - Tipo do remetente (user, contact)
      - `sender_name` (text) - Nome do remetente
      - `sender_id` (text) - ID do remetente
      - `message_type` (text) - Tipo da mensagem (text, image, file, audio, video)
      - `platform` (text) - Plataforma de origem
      - `platform_message_id` (text) - ID da mensagem na plataforma
      - `metadata` (jsonb) - Metadados adicionais
      - `read` (boolean) - Se a mensagem foi lida
      - `user_id` (uuid) - ID do usuário
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own conversations and messages
*/

-- Tabela de conversas
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_avatar text,
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'telegram', 'internal')),
  platform_contact_id text,
  last_message text DEFAULT '',
  last_message_time timestamptz DEFAULT now(),
  unread_count integer DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'contact')),
  sender_name text NOT NULL,
  sender_id text,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video')),
  platform text NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'telegram', 'internal')),
  platform_message_id text,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas para conversations
CREATE POLICY "Users can read own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para chat_messages
CREATE POLICY "Users can read own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_platform_idx ON conversations(platform);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations(status);
CREATE INDEX IF NOT EXISTS conversations_last_message_time_idx ON conversations(last_message_time);
CREATE INDEX IF NOT EXISTS conversations_platform_contact_idx ON conversations(platform, platform_contact_id);

CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS chat_messages_user_id_idx ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS chat_messages_platform_idx ON chat_messages(platform);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_messages_read_idx ON chat_messages(read);
CREATE INDEX IF NOT EXISTS chat_messages_platform_message_idx ON chat_messages(platform, platform_message_id);

-- Trigger para atualizar updated_at em conversations
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Função para atualizar estatísticas da conversa quando uma nova mensagem é adicionada
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar última mensagem e contador de não lidas
  UPDATE conversations 
  SET 
    last_message = NEW.content,
    last_message_time = NEW.created_at,
    unread_count = CASE 
      WHEN NEW.sender_type = 'contact' AND NEW.read = false 
      THEN unread_count + 1 
      ELSE unread_count 
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar estatísticas da conversa
CREATE TRIGGER update_conversation_stats_trigger
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_stats();

-- Função para resetar contador de não lidas quando mensagens são marcadas como lidas
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Se a mensagem foi marcada como lida, recalcular contador
  IF OLD.read = false AND NEW.read = true THEN
    UPDATE conversations 
    SET unread_count = (
      SELECT COUNT(*) 
      FROM chat_messages 
      WHERE conversation_id = NEW.conversation_id 
      AND read = false 
      AND sender_type = 'contact'
    )
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para resetar contador de não lidas
CREATE TRIGGER reset_unread_count_trigger
  AFTER UPDATE ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION reset_unread_count();