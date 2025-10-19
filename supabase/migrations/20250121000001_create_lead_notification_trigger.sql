-- Função para criar notificação quando um novo lead é inserido
CREATE OR REPLACE FUNCTION create_lead_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar notificação usando o template 'new_lead'
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    category,
    priority,
    action_url,
    action_label,
    metadata,
    read,
    created_at,
    updated_at
  )
  SELECT 
    NEW.user_id,
    REPLACE(nt.title_template, '{{lead_name}}', NEW.name),
    REPLACE(nt.message_template, '{{lead_name}}', NEW.name),
    nt.type,
    nt.category,
    nt.priority,
    REPLACE(nt.action_url_template, '{{lead_id}}', NEW.id::text),
    nt.action_label,
    jsonb_build_object(
      'lead_id', NEW.id,
      'lead_name', NEW.name,
      'lead_email', NEW.email,
      'lead_source', NEW.source,
      'lead_status', NEW.status
    ),
    false,
    NOW(),
    NOW()
  FROM notification_templates nt
  WHERE nt.name = 'new_lead' AND nt.active = true;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função quando um novo lead é inserido
CREATE TRIGGER trigger_create_lead_notification
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_notification();

-- Função para criar notificação quando o status de um lead é alterado
CREATE OR REPLACE FUNCTION create_lead_status_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Verificar se o status realmente mudou
  IF OLD.status != NEW.status THEN
    -- Criar notificação usando o template 'lead_status_changed'
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      category,
      priority,
      action_url,
      action_label,
      metadata,
      read,
      created_at,
      updated_at
    )
    SELECT 
      NEW.user_id,
      REPLACE(REPLACE(nt.title_template, '{{lead_name}}', NEW.name), '{{new_status}}', NEW.status),
      REPLACE(REPLACE(nt.message_template, '{{lead_name}}', NEW.name), '{{new_status}}', NEW.status),
      nt.type,
      nt.category,
      nt.priority,
      REPLACE(nt.action_url_template, '{{lead_id}}', NEW.id::text),
      nt.action_label,
      jsonb_build_object(
        'lead_id', NEW.id,
        'lead_name', NEW.name,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      false,
      NOW(),
      NOW()
    FROM notification_templates nt
    WHERE nt.name = 'lead_status_changed' AND nt.active = true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para executar a função quando o status de um lead é alterado
CREATE TRIGGER trigger_create_lead_status_notification
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION create_lead_status_notification();