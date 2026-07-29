# Sinalize — Especificação de Design do MVP

**Data:** 2026-07-29  
**Status:** Aprovado; plano de implementação em `docs/superpowers/plans/2026-07-29-sinalize-mvp.md`  
**Produto:** Aplicação web PWA de mediação comunicativa entre pessoas surdas e intérpretes de Libras

---

## 1. Problema e objetivo

O Sinalize conecta pessoas com deficiência auditiva a intérpretes de Libras por videochamadas agendadas. O usuário descreve o motivo e escolhe data, horário e duração; intérpretes aprovados recebem a solicitação; o primeiro a aceitar assume o atendimento; após a chamada, ambos avaliam.

Objetivo do MVP acadêmico: entregar um sistema utilizável de ponta a ponta (cadastro, aprovação, fila, cancelamento, chamada, avaliação), com identidade visual própria, acessibilidade no caminho crítico e README para execução local.

---

## 2. Escopo do MVP

### Incluído

- PWA responsiva (Next.js + React), instalável no celular
- Contas: usuário surdo, intérprete, administrador
- Login/cadastro por e-mail e senha com confirmação de e-mail
- Aprovação manual de intérpretes com upload de certificado
- Solicitação disparada para vários intérpretes; primeiro aceite válido reserva
- Duração variável: 15, 30 ou 60 minutos
- Atendimentos gratuitos (sem pagamento)
- Cancelamentos com regras distintas por papel e dia
- Videochamada via Jitsi as a Service (JaaS), sem gravação
- Notificações apenas dentro do aplicativo
- Avaliação mútua: nota média pública; comentários privados (avaliado + admin)
- Tema claro/escuro com escolha manual salva no perfil
- Dashboard inicial por perfil (próxima chamada / pedidos / decisões)
- README com instruções para rodar na máquina

### Fora do MVP (explícito)

- Pagamento online
- Notificações por e-mail, WhatsApp ou push nativo
- Vídeos explicativos em Libras (estrutura futura possível; UI não depende deles)
- Gravação de chamadas
- Aplicativo nativo (React Native/Expo)
- Self-hosting de Jitsi (preparar abstração; usar JaaS no MVP)
- Menores de 18 anos

---

## 3. Arquitetura

**Stack:** Next.js (App Router) + React + Supabase (Auth, PostgreSQL, Storage, Realtime, RLS) + JaaS (IFrame API).

Um único aplicativo Next.js entrega três experiências por papel. Rotas de servidor e Server Actions concentram regras sensíveis (aprovação, cancelamento administrativo, geração de JWT/token da sala). O cliente nunca recebe `service_role` nem gera tokens JaaS.

```
[Usuário / Intérprete / Admin]
            │
            ▼
     Next.js (UI + server)
            │
     ┌──────┴──────┐
     ▼             ▼
 Supabase        JaaS
 (dados/auth)   (só na chamada)
```

### Decisões técnicas

| Tema | Decisão |
|------|----------|
| Frontend/backend | Next.js unificado (não Nest separado no MVP) |
| Banco | PostgreSQL via Supabase, RLS em todas as tabelas públicas |
| Papel do usuário | `profiles.role` + `app_metadata` para autorização; nunca `user_metadata` |
| Aceite | Update atômico `WHERE status = 'open'` |
| Vídeo | JaaS; `meet.jit.si` não é produção para embed |
| Documentos | Bucket Storage privado; URLs assinadas |

---

## 4. Papéis e permissões

### Usuário surdo (`user`)

- Criar solicitação (motivo em lista + texto opcional, data/hora, duração)
- Ver dashboard: próxima chamada, calendário da semana, pedidos
- Cancelar diretamente até a véspera do atendimento
- No dia da chamada: solicitar cancelamento (admin decide)
- Entrar na sala no horário; avaliar intérprete

### Intérprete (`interpreter`)

- Enviar certificado e aguardar aprovação
- Enquanto `pending`/`rejected`: sem fila de pedidos nem sala
- Após `approved`: ver pedidos `open` em tempo real e aceitar
- Solicitar cancelamento (sempre via admin)
- Se cancelamento do intérprete for aprovado: atendimento volta a `open` para outros
- Entrar na sala; avaliar usuário

### Administrador (`admin`)

- Aprovar/rejeitar intérpretes (com motivo na rejeição)
- Decidir cancelamentos pendentes (prioridade para urgentes do dia)
- Visão geral de atendimentos e acesso a comentários de avaliação quando necessário
- Conta admin criada de forma controlada (seed/manual), não por auto-cadastro público

### Idade

Somente 18 anos ou mais (declaração no cadastro).

---

## 5. Modelo de dados

### `profiles`

- `id` (uuid, FK `auth.users`)
- `role`: `user` | `interpreter` | `admin`
- `full_name`
- `theme_preference`: `light` | `dark`
- `average_rating` (numeric, agregado)
- `created_at` / `updated_at`

### `interpreter_applications`

- `id`, `profile_id`
- `status`: `pending` | `approved` | `rejected`
- `certificate_path` (Storage)
- `rejection_reason` (nullable)
- `reviewed_by`, `reviewed_at`

### `appointments`

- `id`, `requester_id`, `interpreter_id` (nullable até aceite)
- `status`: `open` | `accepted` | `cancel_requested` | `cancelled` | `completed` | `expired`
- `scheduled_at`, `duration_minutes` (`15` | `30` | `60`)
- `reason_code`, `reason_text` (opcional)
- `jitsi_room_name` (gerado no servidor)
- timestamps

### `cancellation_requests`

- `appointment_id`, `requested_by`, `requested_by_role` (`user` | `interpreter`)
- `reason_code`, `reason_text` (opcional)
- `status`: `pending` | `approved` | `rejected`
- `admin_decision_note` (nullable)
- `reviewed_by`, `reviewed_at`

### `reviews`

- `appointment_id`, `from_profile_id`, `to_profile_id`
- `rating` (1–5), `comment` (privado)
- Unique: um review por `(appointment_id, from_profile_id)`

### `notifications`

- `profile_id`, `type`, `title`, `body`
- `related_appointment_id` (nullable)
- `read_at` (nullable), `created_at`

### Ciclo de vida do atendimento

```
open → accepted → completed
open → expired
accepted → cancel_requested → cancelled
accepted → cancel_requested → accepted (admin rejeita)
accepted → cancel_requested → open (cancelamento do intérprete aprovado; limpa interpreter_id)
user cancel direto (antes do dia) → cancelled
```

Enquanto `cancel_requested`: atendimento permanece agendado para os participantes.

---

## 6. Fluxos principais

### 6.1 Cadastro e aprovação de intérprete

1. Usuário escolhe perfil intérprete no cadastro
2. Envia certificado (PDF/imagem)
3. Status `pending`; notificação interna ao admin
4. Admin aprova ou rejeita com motivo
5. Intérprete recebe notificação no app; se rejeitado, pode reenviar

### 6.2 Solicitação e aceite

1. Usuário cria appointment `open`
2. Realtime/lista mostra para intérpretes aprovados
3. Aceite: `UPDATE ... SET status='accepted', interpreter_id=$1 WHERE id=$2 AND status='open'`
4. Zero linhas afetadas → “Esse pedido já foi aceito”
5. Notificações internas para as partes

### 6.3 Cancelamento

| Quem | Quando | Comportamento |
|------|--------|----------------|
| Usuário | Antes do dia do atendimento | Cancela direto → `cancelled` |
| Usuário | No dia | Cria `cancellation_requests`; appointment → `cancel_requested` |
| Intérprete | Sempre | Cria solicitação; admin decide |
| Admin aprova cancelamento do intérprete | — | Volta a `open`, remove intérprete, reaparece na fila |
| Admin rejeita solicitação | — | Volta a `accepted` |

Motivos: lista pronta (`reason_code`) + texto opcional. Ícones/rótulos simples; não depender só de escrita livre.

Motivos de atendimento (exemplos fixos no MVP): `saude`, `educacao`, `trabalho`, `servicos_publicos`, `comercio`, `outro`.

Motivos de cancelamento (exemplos fixos no MVP): `imprevisto`, `doenca`, `conflito_horario`, `problema_tecnico`, `outro`.

### 6.4 Videochamada

1. Perto do horário, servidor gera/valida token JaaS e nome da sala
2. UI embute IFrame; gravação desabilitada
3. Falha de mídia/API: mensagem clara + “Tentar de novo”
4. Conclusão no MVP: qualquer participante pode marcar “chamada encerrada”; se ninguém marcar, o sistema passa para `completed` após `scheduled_at + duration_minutes`. Em seguida, abre o fluxo de avaliação

### 6.5 Avaliação

- Ambos podem avaliar após `completed`
- Média atualiza `profiles.average_rating` (visível)
- Comentário só para avaliado e admin (RLS)

---

## 7. Interface e identidade visual

### Direção

- **Tema claro:** base “Clareza em movimento” (leitura confortável, azul do logo)
- **Tema escuro:** base “Gesto em foco” (alto contraste, presença)
- Usuário escolhe manualmente; preferência em `profiles.theme_preference`
- Logo (mão no círculo azul) é âncora de marca e Motivo de formas circulares/gestuais — não decoração genérica
- Evitar layouts “dashboard de métricas” como conteúdo principal para o usuário surdo

### Navegação por perfil

**Usuário:** Início · Pedidos · Histórico · Perfil  
**Intérprete:** Início (disponíveis + próxima) · Agenda · Histórico · Perfil (+ estado da candidatura)  
**Admin:** Painel · Intérpretes · Cancelamentos · Atendimentos

### Dashboard do usuário (aprovado)

- Saudação + CTA “Solicitar intérprete”
- Bloco dominante: próxima chamada (data, motivo, duração, estado, entrar/detalhes)
- Calendário da semana + link para mês completo
- Lista curta de pedidos (confirmado / buscando)
- Sem cartões “Total / Ativos / Concluídos” como foco principal

### Acessibilidade (caminho crítico)

- Contraste WCAG nos dois temas
- Navegação por teclado nos fluxos principais
- Erros e vazios com texto + ícone (nunca só cor)
- Linguagem simples; motivos em lista
- UI utilizável sem vídeos em Libras

---

## 8. Tratamento de erros (resumo)

| Cenário | Resposta |
|---------|----------|
| Aceite concorrente | Segundo perde; mensagem clara; lista atualiza |
| Cancelamento pendente | Continua agendado; status “em análise” |
| Falha JaaS/câmera | Erro + tentar de novo |
| Intérprete não aprovado | App acessível; fila/sala bloqueadas |
| Sem chamadas | Empty state + CTA solicitar |
| Certificado rejeitado | Motivo + reenvio |
| Sem aceite até o horário | `expired` + aviso para nova solicitação |
| Sessão expirada | Login e retorno seguro à tela anterior |

---

## 9. Validação

### Automatizado

- Aceite atômico
- Regras de cancelamento e retorno à fila
- Permissões por papel / intérprete pendente
- Reviews (unicidade, privacidade do comentário)

### Manual / demonstração

- Cadastro → aprovação
- Solicitação → aceite
- Entrada na sala JaaS sem gravação
- Tema e uso PWA no celular

### Acessibilidade

- Contraste, teclado, motivos prontos, feedback não só por cor

---

## 10. Entregas de implementação (ordem sugerida)

1. Fundação: Next.js, Supabase, auth, profiles, tema, README
2. Aprovação de intérpretes (Storage + admin)
3. Solicitações, Realtime, aceite atômico
4. Cancelamentos e regras de dia
5. Integração JaaS e sala
6. Avaliações, histórico, polish de acessibilidade/PWA

---

## 11. Supabase e ambiente

- Projeto Supabase já existente e acessível via MCP (autenticado)
- Variáveis: URL, anon/publishable key no cliente; service role só no servidor
- Secrets JaaS só no servidor
- Migrations versionadas no repositório

---

## 12. Critérios de sucesso do MVP

1. Usuário cria solicitação e um intérprete aprovado a aceita sem race condition
2. Admin consegue aprovar intérprete e decidir cancelamento sensível
3. Ambos entram em videochamada funcional no horário
4. Avaliações registram nota pública e comentário privado
5. Aplicação roda localmente seguindo o README
6. Identidade visual coerente (logo + claro/escuro) sem aparência genérica de template
