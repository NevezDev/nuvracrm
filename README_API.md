# Nuvra CRM API Documentation

Esta documentação descreve os endpoints REST disponíveis para integração externa com o sistema Nuvra CRM.

## Base URL
```
https://seu-projeto.supabase.co/functions/v1/
```

## Autenticação
Todos os endpoints requerem autenticação via header Authorization:
```
Authorization: Bearer SEU_SUPABASE_JWT_TOKEN
```

## Endpoints Disponíveis

### 1. Contatos (`/contacts`)

#### GET /contacts
Lista todos os contatos do usuário com filtros opcionais.

**Filtros disponíveis:**
- `name` - Filtro por nome (busca parcial)
- `email` - Filtro por email (busca parcial)
- `company` - Filtro por empresa (busca parcial)
- `status` - Filtro por status (`active` ou `inactive`)
- `created_after` - Contatos criados após esta data (ISO 8601)
- `created_before` - Contatos criados antes desta data (ISO 8601)

**Exemplo:**
```bash
GET /contacts?name=João&status=active&created_after=2023-01-01
```

**Resposta:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "João Silva",
      "email": "joao@empresa.com",
      "phone": "+5511999999999",
      "company": "Empresa XYZ",
      "position": "Gerente",
      "status": "active",
      "created_at": "2023-01-01T10:00:00Z",
      "updated_at": "2023-01-01T10:00:00Z",
      "user_id": "uuid"
    }
  ],
  "count": 1
}
```

#### GET /contacts/:id
Busca um contato específico por ID.

**Resposta:**
```json
{
  "id": "uuid",
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+5511999999999",
  "company": "Empresa XYZ",
  "position": "Gerente",
  "status": "active",
  "created_at": "2023-01-01T10:00:00Z",
  "updated_at": "2023-01-01T10:00:00Z",
  "user_id": "uuid"
}
```

#### POST /contacts
Cria um novo contato.

**Campos obrigatórios:**
- `name` (string)
- `email` (string, formato válido)
- `user_id` (string, UUID do usuário)

**Campos opcionais:**
- `phone` (string)
- `company` (string)
- `position` (string)
- `status` (string: "active" ou "inactive", padrão: "active")

**Exemplo:**
```json
{
  "name": "João Silva",
  "email": "joao@empresa.com",
  "phone": "+5511999999999",
  "company": "Empresa XYZ",
  "position": "Gerente",
  "status": "active",
  "user_id": "uuid-do-usuario"
}
```

### 2. Leads (`/leads`)

#### GET /leads
Lista todos os leads com filtros opcionais.

**Filtros disponíveis:**
- `name` - Filtro por nome (busca parcial)
- `email` - Filtro por email (busca parcial)
- `company` - Filtro por empresa (busca parcial)
- `source` - Filtro por origem (busca parcial)
- `status` - Filtro por status (`new`, `contacted`, `qualified`, `lost`)
- `value_min` - Valor mínimo
- `value_max` - Valor máximo
- `created_after` - Leads criados após esta data
- `created_before` - Leads criados antes desta data

#### GET /leads/:id
Busca um lead específico por ID.

#### POST /leads
Cria um novo lead.

**Campos obrigatórios:**
- `name` (string)
- `email` (string, formato válido)
- `source` (string)
- `user_id` (string, UUID do usuário)

**Campos opcionais:**
- `phone` (string)
- `company` (string)
- `status` (string: "new", "contacted", "qualified", "lost", padrão: "new")
- `value` (number, padrão: 0)

### 3. Oportunidades (`/deals`)

#### GET /deals
Lista todas as oportunidades com filtros opcionais.

**Filtros disponíveis:**
- `title` - Filtro por título (busca parcial)
- `status` - Filtro por status (`prospecting`, `negotiation`, `closed_won`, `closed_lost`)
- `contact_id` - Filtro por ID do contato
- `value_min` - Valor mínimo
- `value_max` - Valor máximo
- `expected_close_after` - Data de fechamento esperada após
- `expected_close_before` - Data de fechamento esperada antes
- `created_after` - Oportunidades criadas após esta data
- `created_before` - Oportunidades criadas antes desta data

**Resposta inclui dados do contato relacionado:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Venda Sistema CRM",
      "description": "Implementação completa",
      "value": 50000,
      "status": "negotiation",
      "contact_id": "uuid",
      "expected_close_date": "2023-12-31",
      "created_at": "2023-01-01T10:00:00Z",
      "updated_at": "2023-01-01T10:00:00Z",
      "user_id": "uuid",
      "contacts": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@empresa.com",
        "company": "Empresa XYZ"
      }
    }
  ],
  "count": 1
}
```

#### GET /deals/:id
Busca uma oportunidade específica por ID.

#### POST /deals
Cria uma nova oportunidade.

**Campos obrigatórios:**
- `title` (string)
- `value` (number, deve ser positivo)
- `user_id` (string, UUID do usuário)

**Campos opcionais:**
- `description` (string)
- `status` (string: "prospecting", "negotiation", "closed_won", "closed_lost", padrão: "prospecting")
- `contact_id` (string, UUID de contato existente)
- `expected_close_date` (string, formato ISO 8601)

### 4. Atividades (`/activities`)

#### GET /activities
Lista todas as atividades com filtros opcionais.

**Filtros disponíveis:**
- `title` - Filtro por título (busca parcial)
- `type` - Filtro por tipo (`call`, `email`, `meeting`, `task`)
- `status` - Filtro por status (`pending`, `completed`, `cancelled`)
- `contact_id` - Filtro por ID do contato
- `deal_id` - Filtro por ID da oportunidade
- `due_after` - Atividades com vencimento após esta data
- `due_before` - Atividades com vencimento antes desta data
- `created_after` - Atividades criadas após esta data
- `created_before` - Atividades criadas antes desta data

**Resposta inclui dados do contato e oportunidade relacionados:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Ligar para cliente",
      "description": "Acompanhar proposta",
      "type": "call",
      "status": "pending",
      "due_date": "2023-12-31T14:00:00Z",
      "contact_id": "uuid",
      "deal_id": "uuid",
      "created_at": "2023-01-01T10:00:00Z",
      "updated_at": "2023-01-01T10:00:00Z",
      "user_id": "uuid",
      "contacts": {
        "id": "uuid",
        "name": "João Silva",
        "email": "joao@empresa.com",
        "company": "Empresa XYZ"
      },
      "deals": {
        "id": "uuid",
        "title": "Venda Sistema CRM",
        "value": 50000
      }
    }
  ],
  "count": 1
}
```

#### GET /activities/:id
Busca uma atividade específica por ID.

#### POST /activities
Cria uma nova atividade.

**Campos obrigatórios:**
- `title` (string)
- `type` (string: "call", "email", "meeting", "task")
- `user_id` (string, UUID do usuário)

**Campos opcionais:**
- `description` (string)
- `status` (string: "pending", "completed", "cancelled", padrão: "pending")
- `due_date` (string, formato ISO 8601)
- `contact_id` (string, UUID de contato existente)
- `deal_id` (string, UUID de oportunidade existente)

### 5. Integrações (`/integrations`)

#### GET /integrations
Lista todas as integrações com filtros opcionais.

**Filtros disponíveis:**
- `name` - Filtro por nome (busca parcial)
- `type` - Filtro por tipo (`whatsapp`, `n8n`, `zapier`, `slack`, `sendgrid`, `webhook`)
- `status` - Filtro por status (`active`, `inactive`, `error`)
- `created_after` - Integrações criadas após esta data
- `created_before` - Integrações criadas antes desta data

#### GET /integrations/:id
Busca uma integração específica por ID.

#### POST /integrations
Cria uma nova integração.

**Campos obrigatórios:**
- `name` (string)
- `type` (string: "whatsapp", "n8n", "zapier", "slack", "sendgrid", "webhook")
- `user_id` (string, UUID do usuário)

**Campos opcionais:**
- `config` (object, configurações específicas da integração)
- `status` (string: "active", "inactive", "error", padrão: "inactive")

### 6. Relatórios (`/reports`)

#### GET /reports
Gera relatórios consolidados do Nuvra CRM.

**Parâmetros obrigatórios:**
- `user_id` - UUID do usuário

**Parâmetros opcionais:**
- `type` - Tipo do relatório (padrão: "overview")
- `days` - Período em dias (padrão: "30")

**Exemplo:**
```bash
GET /reports?user_id=uuid-do-usuario&days=90
```

**Resposta:**
```json
{
  "period": {
    "start_date": "2023-10-01T00:00:00Z",
    "end_date": "2023-12-31T23:59:59Z",
    "days": 90
  },
  "summary": {
    "total_contacts": 150,
    "total_leads": 75,
    "total_deals": 25,
    "total_activities": 200,
    "total_revenue": 500000,
    "pipeline_value": 300000,
    "conversion_rate": 33.33,
    "avg_deal_value": 20000
  },
  "leads": {
    "total": 75,
    "by_status": {
      "new": 20,
      "contacted": 30,
      "qualified": 15,
      "lost": 10
    },
    "by_source": {
      "Website": 30,
      "Google Ads": 20,
      "Indicação": 15,
      "LinkedIn": 10
    }
  },
  "deals": {
    "total": 25,
    "by_status": {
      "prospecting": 10,
      "negotiation": 8,
      "closed_won": 5,
      "closed_lost": 2
    },
    "total_value": 800000
  },
  "activities": {
    "total": 200,
    "by_type": {
      "call": 80,
      "email": 60,
      "meeting": 40,
      "task": 20
    },
    "by_status": {
      "pending": 50,
      "completed": 140,
      "cancelled": 10
    }
  },
  "monthly_data": [
    {
      "month": "2023-10",
      "contacts": 50,
      "leads": 25,
      "deals": 8,
      "revenue": 160000
    }
  ],
  "funnel": {
    "leads": 75,
    "qualified_leads": 15,
    "deals": 25,
    "won_deals": 5
  }
}
```

## Códigos de Status HTTP

- `200` - Sucesso (GET)
- `201` - Criado com sucesso (POST)
- `400` - Erro de validação ou parâmetros inválidos
- `404` - Recurso não encontrado
- `405` - Método não permitido
- `500` - Erro interno do servidor

## Exemplos de Uso com n8n

### 1. Criar um novo lead via webhook:
```javascript
// No n8n, use o nó HTTP Request
{
  "method": "POST",
  "url": "https://seu-projeto.supabase.co/functions/v1/leads",
  "headers": {
    "Authorization": "Bearer SEU_JWT_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {
    "name": "{{ $json.nome }}",
    "email": "{{ $json.email }}",
    "phone": "{{ $json.telefone }}",
    "company": "{{ $json.empresa }}",
    "source": "Website",
    "user_id": "seu-user-id"
  }
}
```

### 2. Buscar contatos por empresa:
```javascript
{
  "method": "GET",
  "url": "https://seu-projeto.supabase.co/functions/v1/contacts?company=Empresa XYZ",
  "headers": {
    "Authorization": "Bearer SEU_JWT_TOKEN"
  }
}
```

### 3. Criar atividade de follow-up:
```javascript
{
  "method": "POST",
  "url": "https://seu-projeto.supabase.co/functions/v1/activities",
  "headers": {
    "Authorization": "Bearer SEU_JWT_TOKEN",
    "Content-Type": "application/json"
  },
  "body": {
    "title": "Follow-up com {{ $json.nome }}",
    "description": "Acompanhar proposta enviada",
    "type": "call",
    "due_date": "{{ $now.plus({days: 3}).toISO() }}",
    "contact_id": "{{ $json.contact_id }}",
    "user_id": "seu-user-id"
  }
}
```

## CORS
Todos os endpoints têm CORS habilitado para permitir requisições de qualquer origem. Em produção, recomenda-se configurar origens específicas por segurança.