-- Seed data for testing
-- This file contains sample data for testing the CRM functionality

-- Insert test user (you'll need to replace with actual user ID from auth.users)
-- For now, we'll use a placeholder UUID that should be replaced with real user ID

-- Sample contacts
INSERT INTO contacts (id, name, email, phone, company, position, status, user_id) VALUES
('11111111-1111-1111-1111-111111111111', 'João Silva', 'joao@empresa.com', '(11) 99999-9999', 'Empresa ABC', 'Gerente', 'active', '00000000-0000-0000-0000-000000000000'),
('22222222-2222-2222-2222-222222222222', 'Maria Santos', 'maria@empresa2.com', '(11) 88888-8888', 'Empresa XYZ', 'Diretora', 'active', '00000000-0000-0000-0000-000000000000'),
('33333333-3333-3333-3333-333333333333', 'Pedro Costa', 'pedro@empresa3.com', '(11) 77777-7777', 'Empresa 123', 'CEO', 'active', '00000000-0000-0000-0000-000000000000');

-- Sample leads
INSERT INTO leads (id, name, email, phone, company, source, status, interest_level, value, user_id) VALUES
('44444444-4444-4444-4444-444444444444', 'Ana Oliveira', 'ana@lead1.com', '(11) 66666-6666', 'Lead Company 1', 'website', 'new', 'quente', 5000, '00000000-0000-0000-0000-000000000000'),
('55555555-5555-5555-5555-555555555555', 'Carlos Lima', 'carlos@lead2.com', '(11) 55555-5555', 'Lead Company 2', 'referral', 'contacted', 'muito_quente', 10000, '00000000-0000-0000-0000-000000000000'),
('66666666-6666-6666-6666-666666666666', 'Lucia Ferreira', 'lucia@lead3.com', '(11) 44444-4444', 'Lead Company 3', 'social_media', 'qualified', 'morno', 7500, '00000000-0000-0000-0000-000000000000'),
('77777777-7777-7777-7777-777777777777', 'Roberto Alves', 'roberto@lead4.com', '(11) 33333-3333', 'Lead Company 4', 'email_marketing', 'lost', 'frio', 3000, '00000000-0000-0000-0000-000000000000');

-- Sample deals
INSERT INTO deals (id, title, description, value, status, contact_id, expected_close_date, user_id) VALUES
('88888888-8888-8888-8888-888888888888', 'Venda Software CRM', 'Implementação de sistema CRM completo', 25000, 'closed_won', '11111111-1111-1111-1111-111111111111', '2024-01-15', '00000000-0000-0000-0000-000000000000'),
('99999999-9999-9999-9999-999999999999', 'Consultoria Digital', 'Projeto de transformação digital', 15000, 'closed_won', '22222222-2222-2222-2222-222222222222', '2024-01-20', '00000000-0000-0000-0000-000000000000'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sistema de Gestão', 'Desenvolvimento de sistema personalizado', 35000, 'negotiation', '33333333-3333-3333-3333-333333333333', '2024-02-10', '00000000-0000-0000-0000-000000000000'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Treinamento Equipe', 'Capacitação da equipe de vendas', 8000, 'prospecting', '11111111-1111-1111-1111-111111111111', '2024-02-15', '00000000-0000-0000-0000-000000000000'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Automação Processos', 'Automatização de processos internos', 20000, 'closed_lost', '22222222-2222-2222-2222-222222222222', '2024-01-25', '00000000-0000-0000-0000-000000000000');

-- Sample activities
INSERT INTO activities (id, title, description, type, status, due_date, contact_id, deal_id, user_id) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Ligação de Follow-up', 'Acompanhar proposta enviada', 'call', 'completed', '2024-01-10 14:00:00', '11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Reunião Apresentação', 'Apresentar solução para cliente', 'meeting', 'completed', '2024-01-12 10:00:00', '22222222-2222-2222-2222-222222222222', '99999999-9999-9999-9999-999999999999', '00000000-0000-0000-0000-000000000000'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Email Proposta', 'Enviar proposta comercial detalhada', 'email', 'pending', '2024-02-05 09:00:00', '33333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '00000000-0000-0000-0000-000000000000'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'Tarefa Pesquisa', 'Pesquisar necessidades do cliente', 'task', 'pending', '2024-02-08 16:00:00', '11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '00000000-0000-0000-0000-000000000000');