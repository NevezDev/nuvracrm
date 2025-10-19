# Configuração das Variáveis de Ambiente

## 1. Criar arquivo `.env.local`

Crie um arquivo chamado `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration (já deve estar configurado)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Google Calendar API Configuration (NOVO - opcional)
VITE_GOOGLE_CLIENT_ID=seu_google_client_id
VITE_GOOGLE_CLIENT_SECRET=seu_google_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/integrations
```

## 2. Como obter as credenciais do Google

### Passo 1: Acesse o Google Cloud Console
- Vá para [Google Cloud Console](https://console.cloud.google.com/)
- Crie um novo projeto ou selecione um existente

### Passo 2: Ative a Google Calendar API
- Vá para "APIs & Services" > "Library"
- Procure por "Google Calendar API"
- Clique em "Enable"

### Passo 3: Configure as credenciais OAuth
- Vá para "APIs & Services" > "Credentials"
- Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
- Configure:
  - **Application type**: Web application
  - **Name**: Nuvra CRM Calendar Integration
  - **Authorized redirect URIs**: `http://localhost:5173/integrations`

### Passo 4: Copie as credenciais
- Após criar, você receberá:
  - **Client ID** (copie para `VITE_GOOGLE_CLIENT_ID`)
  - **Client Secret** (copie para `VITE_GOOGLE_CLIENT_SECRET`)

## 3. Exemplo completo do `.env.local`

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Calendar (opcional)
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/integrations
```

## 4. Importante

- **Nunca compartilhe** suas credenciais
- O arquivo `.env.local` já está no `.gitignore` (não será commitado)
- Se não configurar o Google Calendar, o Nuvra CRM funcionará normalmente sem essa integração
- Para produção, use URLs diferentes (ex: `https://seu-dominio.com/integrations`)

## 5. Teste

Após configurar:
1. Reinicie o servidor (`npm run dev`)
2. Vá para "Integrações"
3. Clique em "Conectar" no Google Calendar
4. Deve funcionar sem erros 