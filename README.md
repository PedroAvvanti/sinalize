# Sinalize

Aplicação web **PWA** que conecta pessoas surdas a intérpretes de Libras por videochamadas agendadas. O MVP cobre cadastro, fila de atendimentos, cancelamentos moderados, videochamada embutida (Jitsi Meet gratuito), notificações in-app e avaliações mútuas.

## Pré-requisitos

- **Node.js** em uma faixa suportada: `^20.19.0 || ^22.13.0 || >=24.0.0`
- **npm**
- Um projeto no [Supabase](https://supabase.com/dashboard/projects) (Auth, PostgreSQL, Storage, Realtime)

**Vídeo:** usa o Jitsi Meet público em `meet.jit.si`, embutido no app. **Gratuito, sem conta 8x8/JaaS e sem chaves secretas de vídeo.**

## Clone e instalação

```bash
git clone <url-do-repositorio> sinalize
cd sinalize
npm install
```

Opcional — regenerar ícones PWA a partir do logo:

```bash
npm run generate:pwa-icons
```

## Configurar variáveis de ambiente

Copie o exemplo e preencha com as credenciais do seu projeto Supabase:

```bash
cp .env.example .env.local
```

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim* | Service role (somente servidor): notificações cross-user, expiração de atendimentos, uploads de certificado |
| `NEXT_PUBLIC_JITSI_DOMAIN` | Não | Domínio Jitsi (padrão: `meet.jit.si`) |

\* Sem a service role, o app funciona parcialmente; ações privilegiadas falham silenciosamente no log.

## Aplicar migrations

Execute os arquivos em `supabase/migrations/` **na ordem do nome**, no SQL Editor do Supabase ou via CLI:

1. `20260729120000_init.sql`
2. `20260730173058_harden_interpreter_applications.sql`
3. `20260731131139_enable_appointments_realtime.sql`
4. `20260731142200_cancellation_rpc.sql`
5. `20260731143000_decide_cancellation_rpc.sql`
6. `20260731144500_enable_notifications_realtime.sql`

Confirme também que o bucket `certificates` existe (criado na migration inicial) e que Realtime está habilitado nas tabelas `appointments` e `notifications`.

## Criar o primeiro administrador

1. Cadastre uma conta normal em `/signup` (usuário ou intérprete).
2. No SQL Editor, promova o perfil:

```sql
update public.profiles
set role = 'admin'
where id = '<uuid-da-conta>';
```

A autorização administrativa consulta **`profiles.role`** via `private.is_admin()`. Ela **não** usa `user_metadata` editável pelo usuário.

## Executar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

Para testar a PWA instalável, faça build de produção e sirva localmente:

```bash
npm run build
npm start
```

No navegador (Chrome/Edge), use **Instalar aplicativo** ou **Adicionar à tela inicial** no celular.

## Contas de teste sugeridas

Crie três contas de e-mail distintas para simular o fluxo completo:

| Papel | Fluxo |
|-------|--------|
| **Usuário** | Cadastro em `/signup` → solicitar atendimento em `/app/user/request` → entrar na chamada no horário |
| **Intérprete** | Cadastro como intérprete → enviar certificado em onboarding → aguardar aprovação do admin → aceitar pedidos na fila |
| **Admin** | Conta promovida via SQL acima → revisar intérpretes, cancelamentos e atendimentos |

Ordem sugerida de demonstração:

1. Admin aprova o intérprete.
2. Usuário solicita atendimento (15, 30 ou 60 min).
3. Intérprete aceita na fila ao vivo.
4. Ambos entram em `/app/meeting/[id]` na janela (10 min antes até o fim).
5. Qualquer participante encerra → avaliação mútua em `/app/review/[id]`.

## Videochamada (Jitsi Meet)

- Embed via External API apontando para `meet.jit.si`.
- Rota `/app/meeting/[appointmentId]` valida participante, status e janela de horário no servidor.
- Gravação desabilitada no embed.
- **Segurança MVP:** nome de sala opaco + gate na rota; quem souber o nome ainda poderia tentar entrar direto no Meet — aceitável para MVP acadêmico gratuito.

## Verificação

```bash
npm run lint
npm test
npm run build
```

O build usa Webpack (`--webpack`) para compatibilidade com o service worker PWA no Next.js 16.

## Limitações do MVP

- **Sem pagamento** — atendimentos gratuitos.
- **Sem e-mail, SMS ou WhatsApp** — notificações apenas dentro do app (Realtime).
- **Sem gravação** de chamadas.
- **Sem app nativo** — PWA instalável no navegador.
- **Sem vídeos em Libras** na interface — motivos em lista + texto opcional.
- **Admin manual** — não há auto-cadastro público de administrador.
- **Expiração/conclusão automática** roda ao carregar dashboards (não há cron dedicado).
- **Jitsi público** — qualidade e disponibilidade dependem do serviço gratuito `meet.jit.si`.

## Estrutura principal

- `src/app/` — rotas Next.js (App Router)
- `src/actions/` — Server Actions
- `src/lib/domain/` — regras puras testáveis
- `supabase/migrations/` — schema, RLS e RPCs
- `public/manifest.webmanifest` — manifest PWA

## Licença

Projeto acadêmico/MVP — consulte os mantenedores do repositório.
