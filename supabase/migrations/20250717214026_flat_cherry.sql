/*
  # Sistema de Integrações de APIs

  1. New Tables
    - `integrations`
      - `id` (uuid, primary key)
      - `name` (text) - Nome da integração
      - `type` (text) - Tipo da integração (whatsapp, n8n, zapier, etc)
      - `config` (jsonb) - Configurações da integração
      - `status` (text) - Status da integração
      - `user_id` (uuid) - ID do usuário
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `integration_logs`
      - `id` (uuid, primary key)
      - `integration_id` (uuid) - ID da integração
      - `action` (text) - Ação executada
      - `status` (text) - Status da execução
      - `request_data` (jsonb) - Dados da requisição
      - `response_data` (jsonb) - Dados da resposta
      - `error_message` (text) - Mensagem de erro se houver
      - `created_at` (timestamp)

    - `webhooks`
      - `id` (uuid, primary key)
      - `name` (text) - Nome do webhook
      - `url` (text) - URL do webhook
      - `events` (text[]) - Eventos que disparam o webhook
      - `secret` (text) - Chave secreta para validação
      - `active` (boolean) - Se o webhook está ativo
      - `user_id` (uuid) - ID do usuário
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own integrations
*/

CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  config jsonb DEFAULT '{}',
  status text DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error')),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'pending')),
  request_data jsonb DEFAULT '{}',
  response_data jsonb DEFAULT '{}',
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  events text[] DEFAULT '{}',
  secret text,
  active boolean DEFAULT true,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Policies for integrations
CREATE POLICY "Users can create own integrations"
  ON integrations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own integrations"
  ON integrations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own integrations"
  ON integrations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own integrations"
  ON integrations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for integration_logs
CREATE POLICY "Users can read own integration logs"
  ON integration_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_logs.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert integration logs"
  ON integration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM integrations 
      WHERE integrations.id = integration_logs.integration_id 
      AND integrations.user_id = auth.uid()
    )
  );

-- Policies for webhooks
CREATE POLICY "Users can create own webhooks"
  ON webhooks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own webhooks"
  ON webhooks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own webhooks"
  ON webhooks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhooks"
  ON webhooks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS integrations_user_id_idx ON integrations(user_id);
CREATE INDEX IF NOT EXISTS integrations_type_idx ON integrations(type);
CREATE INDEX IF NOT EXISTS integration_logs_integration_id_idx ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS integration_logs_created_at_idx ON integration_logs(created_at);
CREATE INDEX IF NOT EXISTS webhooks_user_id_idx ON webhooks(user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();