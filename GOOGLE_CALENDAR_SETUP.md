# Configuração do Google Calendar Integration

## 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a Google Calendar API:
   - Vá para "APIs & Services" > "Library"
   - Procure por "Google Calendar API"
   - Clique em "Enable"

## 2. Configurar Credenciais OAuth 2.0

1. Vá para "APIs & Services" > "Credentials"
2. Clique em "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure o tipo de aplicação:
   - **Application type**: Web application
   - **Name**: Nuvra CRM Calendar Integration
   - **Authorized redirect URIs**: 
     - `http://localhost:5173/integrations` (desenvolvimento)
     - `https://seu-dominio.com/integrations` (produção)

## 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Calendar API Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173/integrations
```

## 4. Instalar Dependências

```bash
npm install googleapis
```

## 5. Como Usar

1. **Conectar Google Calendar**:
   - Vá para a página "Integrações"
   - Clique em "Conectar" no Google Calendar
   - Autorize o acesso à sua conta Google

2. **Sincronização**:
   - Eventos criados no Nuvra CRM podem ser sincronizados com o Google Calendar
   - Marque a opção "Sincronizar com Google Calendar" ao criar/editar atividades
   - Use o botão "Sincronizar" para atualizar eventos do Google Calendar

3. **Visualização**:
   - Eventos do Google Calendar aparecem em roxo no calendário
   - Eventos do Nuvra CRM aparecem em cores baseadas no tipo (verde, amarelo, roxo, vermelho)

## 6. Funcionalidades

- ✅ Sincronização bidirecional de eventos
- ✅ Criação de eventos no Google Calendar
- ✅ Atualização de eventos existentes
- ✅ Exclusão de eventos sincronizados
- ✅ Visualização diferenciada no calendário
- ✅ Lembretes automáticos do Google Calendar

## 7. Troubleshooting

**Erro de autorização**:
- Verifique se as credenciais OAuth estão corretas
- Confirme se a URI de redirecionamento está configurada corretamente
- Certifique-se de que a Google Calendar API está ativada

**Eventos não aparecem**:
- Verifique se o usuário está conectado ao Google Calendar
- Use o botão "Sincronizar" para forçar a atualização
- Verifique os logs do console para erros

**Problemas de CORS**:
- Em desenvolvimento, use `http://localhost:5173`
- Em produção, configure o domínio correto nas credenciais OAuth

## 8. Segurança

- Nunca compartilhe suas credenciais OAuth
- Use variáveis de ambiente para as chaves
- Configure corretamente as URIs de redirecionamento autorizadas
- Monitore o uso da API no Google Cloud Console 