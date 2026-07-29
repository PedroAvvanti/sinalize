# Sinalize MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar o MVP do Sinalize — PWA Next.js que conecta usuários surdos a intérpretes de Libras via solicitações, aceite atômico, cancelamentos moderados, videochamada JaaS e avaliação mútua.

**Architecture:** Um app Next.js (App Router) com UI React, Server Actions para regras sensíveis, Supabase (Auth, PostgreSQL + RLS, Storage, Realtime) e JaaS apenas na sala. Papéis `user` | `interpreter` | `admin` em `profiles` + `app_metadata`.

**Tech Stack:** Next.js 16.2.12, React 19.2.8, TypeScript, Tailwind CSS, `@supabase/ssr`, `@supabase/supabase-js`, Vitest, jose (JWT JaaS), next-pwa ou `@ducanh2912/next-pwa`.

**Spec:** `docs/superpowers/specs/2026-07-29-sinalize-mvp-design.md`

## Global Constraints

- Somente adultos (18+); declaração obrigatória no cadastro
- Sem pagamento, e-mail/WhatsApp, gravação de chamada ou app nativo
- Notificações só dentro do app
- `meet.jit.si` não embutir em produção — usar JaaS
- Nunca expor `service_role` no cliente; nunca autorizar via `user_metadata`
- Aceite atômico: `UPDATE … WHERE status = 'open'`
- Temas claro/escuro manuais; azul do logo `#0878FF` como primária
- UI utilizável sem vídeos em Libras; motivos em lista + texto opcional
- Linguagem simples; erros com texto + ícone; nunca só cor
- README deve permitir rodar o projeto na máquina local
- Implementação autorizada diretamente na branch `main` pelo usuário em 2026-07-29

---

## File Structure

```
sinalize/
├── README.md
├── .env.example
├── package.json
├── vitest.config.ts
├── public/
│   ├── logo.png
│   ├── icons/ (PWA)
│   └── manifest.webmanifest
├── supabase/
│   └── migrations/
│       └── 20260729120000_init.sql
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # landing
│   │   ├── globals.css
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── (auth)/confirm/page.tsx
│   │   ├── app/layout.tsx              # shell autenticado
│   │   ├── app/page.tsx                # redirect por role
│   │   ├── app/user/...
│   │   ├── app/interpreter/...
│   │   ├── app/admin/...
│   │   └── api/jaas-token/route.ts
│   ├── components/
│   │   ├── brand/Logo.tsx
│   │   ├── layout/AppShell.tsx
│   │   ├── layout/BottomNav.tsx
│   │   ├── theme/ThemeToggle.tsx
│   │   ├── appointments/...
│   │   ├── admin/...
│   │   └── ui/...                      # Button, EmptyState, StatusBanner
│   ├── lib/
│   │   ├── supabase/client.ts
│   │   ├── supabase/server.ts
│   │   ├── supabase/admin.ts           # service role (server only)
│   │   ├── auth/roles.ts
│   │   ├── domain/reasons.ts
│   │   ├── domain/appointments.ts      # pure rules
│   │   ├── domain/cancellations.ts
│   │   ├── domain/reviews.ts
│   │   └── jaas/token.ts
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── interpreters.ts
│   │   ├── appointments.ts
│   │   ├── cancellations.ts
│   │   └── reviews.ts
│   └── types/database.ts
└── tests/
    ├── domain/appointments.test.ts
    ├── domain/cancellations.test.ts
    └── domain/reviews.test.ts
```

---

### Task 1: Scaffold Next.js, design tokens, logo e README base

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `public/logo.png`, `.env.example`, `README.md`, `vitest.config.ts`
- Test: smoke via `npm run build` (sem domínio ainda)

**Interfaces:**
- Consumes: nada
- Produces: app Next.js bootável; CSS vars `--color-primary: #0878FF`; README com pré-requisitos

- [ ] **Step 1: Criar o app Next.js TypeScript no diretório do projeto**

Run (na raiz vazia, sem sobrescrever `docs/`):

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --yes
```

Se o CLI reclamar de arquivos existentes, criar em pasta temp e mover `src/`, configs e `package.json` mantendo `docs/` e `.gitignore`.

- [ ] **Step 2: Copiar o logo para `public/logo.png`**

Fonte: asset do brainstorm / workspace `assets/...image-c1e73a5f....png` → `public/logo.png`.

- [ ] **Step 3: Definir tokens em `src/app/globals.css`**

```css
:root {
  --color-primary: #0878ff;
  --color-primary-ink: #ffffff;
  --color-bg: #f5f8ff;
  --color-surface: #ffffff;
  --color-ink: #14213d;
  --color-muted: #65738c;
  --color-accent-soft: #20ad9e;
  --color-warning: #c98a14;
  --color-danger: #c44747;
  --radius-lg: 18px;
  --font-display: "Segoe UI", system-ui, sans-serif;
}

[data-theme="dark"] {
  --color-bg: #13182d;
  --color-surface: #1d2440;
  --color-ink: #f8f9ff;
  --color-muted: #bfc7e0;
  --color-primary: #0878ff;
  --color-primary-ink: #ffffff;
  --color-accent-soft: #ffcb36;
}
```

Não usar paleta cream/terracotta genérica; manter identidade do logo.

- [ ] **Step 4: Landing mínima em `src/app/page.tsx`**

Marca Sinalize + logo + CTA “Entrar” / “Criar conta” + uma frase. Sem cards de métricas.

- [ ] **Step 5: `.env.example` e README base**

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JAAS_APP_ID=
JAAS_API_KEY_ID=
JAAS_PRIVATE_KEY=
JAAS_DOMAIN=
```

README: Node 20+, `npm install`, copiar `.env.example`, link ao projeto Supabase, `npm run dev`.

- [ ] **Step 6: Instalar Vitest e configurar**

```bash
npm install -D vitest @vitejs/plugin-react jsdom
```

`package.json`: `"test": "vitest run"`.

- [ ] **Step 7: Verificar build**

Run: `npm run build`  
Expected: sucesso.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with Sinalize design tokens"
```

---

### Task 2: Schema Supabase, RLS e helpers de cliente

**Files:**
- Create: `supabase/migrations/20260729120000_init.sql`, `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/types/database.ts`, `src/lib/auth/roles.ts`
- Test: aplicar migration via MCP/`supabase` e checar tabelas

**Interfaces:**
- Consumes: env vars Supabase
- Produces: `createClient()` browser/server; `createAdminClient()`; tipos `ProfileRole`; tabelas da spec

- [ ] **Step 1: Escrever migration completa**

Incluir enums/checks e tabelas: `profiles`, `interpreter_applications`, `appointments`, `cancellation_requests`, `reviews`, `notifications`.

Trecho crítico do aceite (função RPC):

```sql
create schema if not exists private;

create or replace function private.accept_appointment(p_appointment_id uuid)
returns public.appointments
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if not exists (
    select 1 from public.interpreter_applications ia
    where ia.profile_id = v_uid and ia.status = 'approved'
  ) then
    raise exception 'interpreter not approved';
  end if;

  update public.appointments a
  set status = 'accepted',
      interpreter_id = v_uid,
      updated_at = now()
  where a.id = p_appointment_id
    and a.status = 'open'
  returning * into v_row;

  if v_row.id is null then
    raise exception 'already accepted';
  end if;

  return v_row;
end;
$$;

create or replace function public.accept_appointment(p_appointment_id uuid)
returns public.appointments
language sql
security invoker
set search_path = ''
as $$
  select private.accept_appointment(p_appointment_id);
$$;
```

Trigger após signup:

```sql
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, theme_preference)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' = 'interpreter' then 'interpreter'
      else 'user'
    end,
    'light'
  );
  return new;
end;
$$;
```

**Importante:** o trigger nunca aceita `admin` vindo de metadata editável; somente `user` ou `interpreter`, com fallback para `user`. Admin é promovido de forma controlada. Depois do insert, uma Server Action pode espelhar `role` em `auth.users.raw_app_meta_data` via admin client, mas RLS não deve depender de metadata. Preferir policies baseadas em:

```sql
create function private.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid();
$$;
```

RLS: dono lê/escreve próprio perfil; intérpretes aprovados leem `appointments` com `status = 'open'`; participantes leem seus appointments; admin lê tudo via `private.current_role() = 'admin'`. Reviews inteiras são visíveis somente ao autor, avaliado ou admin; a exposição pública é somente `profiles.average_rating`, evitando fingir segurança em nível de coluna. Storage bucket `certificates` privado.

- [ ] **Step 2: Aplicar migration no projeto Supabase**

Usar MCP `apply_migration` ou CLI `supabase db push` no projeto `iohpmiabxwltsabxvsky` (confirmar ref atual).

- [ ] **Step 3: Implementar clients**

`src/lib/supabase/server.ts` com `@supabase/ssr` cookies; `admin.ts` com `createClient(url, SERVICE_ROLE)` sem cookies.

- [ ] **Step 4: Tipar `ProfileRole`**

```ts
export type ProfileRole = "user" | "interpreter" | "admin";
```

- [ ] **Step 5: Commit**

```bash
git add supabase src/lib/supabase src/types src/lib/auth
git commit -m "feat: add Supabase schema, RLS and clients"
```

---

### Task 3: Auth (cadastro, login, middleware, redirect por papel)

**Files:**
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/(auth)/confirm/page.tsx`, `src/middleware.ts`, `src/actions/auth.ts`, `src/app/app/layout.tsx`, `src/app/app/page.tsx`
- Test: fluxo manual + unitário de `homePathForRole`

**Interfaces:**
- Consumes: Supabase Auth + `profiles`
- Produces: `signUpAction`, `signInAction`, `signOutAction`, `homePathForRole(role: ProfileRole): string`

- [ ] **Step 1: Teste de rota por papel**

```ts
// tests/domain/roles.test.ts
import { describe, expect, it } from "vitest";
import { homePathForRole } from "@/lib/auth/roles";

describe("homePathForRole", () => {
  it("routes each role", () => {
    expect(homePathForRole("user")).toBe("/app/user");
    expect(homePathForRole("interpreter")).toBe("/app/interpreter");
    expect(homePathForRole("admin")).toBe("/app/admin");
  });
});
```

- [ ] **Step 2: Run test — fail**

Run: `npm test -- tests/domain/roles.test.ts`  
Expected: FAIL module not found

- [ ] **Step 3: Implementar `homePathForRole` e signup**

Signup fields: nome, e-mail, senha, papel (`user`|`interpreter`), checkbox “Tenho 18 anos ou mais” obrigatório.

```ts
// src/actions/auth.ts (trecho)
export async function signUpAction(formData: FormData) {
  const adult = formData.get("is_adult") === "on";
  if (!adult) return { error: "É preciso ter 18 anos ou mais." };
  const role = String(formData.get("role"));
  if (role !== "user" && role !== "interpreter") {
    return { error: "Escolha um tipo de conta válido." };
  }
  // supabase.auth.signUp({ email, password, options: { data: { full_name, role } } })
  // admin: updateUserById app_metadata: { role }
}
```

Admin **não** aparece no signup público.

- [ ] **Step 4: Middleware protege `/app/**`**

Não autenticado → `/login?next=…`. Autenticado em `/login` → home do papel.

- [ ] **Step 5: Run tests**

Run: `npm test -- tests/domain/roles.test.ts`  
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git commit -am "feat: add email auth, role routing and age gate"
```

---

### Task 4: Tema claro/escuro persistido

**Files:**
- Create: `src/components/theme/ThemeToggle.tsx`, `src/components/theme/ThemeProvider.tsx`
- Modify: `src/app/app/layout.tsx`, `src/actions/auth.ts` ou `src/actions/profile.ts`
- Test: manual

**Interfaces:**
- Produces: `updateThemePreference(theme: "light" | "dark")`; aplica `data-theme` no `<html>`

- [ ] **Step 1: Provider lê `profiles.theme_preference` e aplica atributo**
- [ ] **Step 2: Toggle salva no banco e atualiza DOM imediatamente**
- [ ] **Step 3: Commit**

```bash
git commit -am "feat: persist manual light/dark theme preference"
```

---

### Task 5: Candidatura de intérprete + Storage

**Files:**
- Create: `src/app/app/interpreter/onboarding/page.tsx`, `src/actions/interpreters.ts`, `src/components/interpreters/CertificateUpload.tsx`
- Modify: middleware/redirect intérprete sem approved → onboarding
- Test: manual upload + RLS

**Interfaces:**
- Produces: `submitInterpreterApplication(file: File)` → cria row `pending` e path `certificates/{userId}/{uuid}.pdf`

- [ ] **Step 1: Criar bucket `certificates` (privado) na migration ou dashboard**
- [ ] **Step 2: Action faz upload com client autenticado e insert em `interpreter_applications`**
- [ ] **Step 3: Tela de status: pending / rejected (motivo) / botão reenviar**
- [ ] **Step 4: Bloquear `/app/interpreter` (fila) se não `approved`**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: interpreter certificate application flow"
```

---

### Task 6: Admin aprova/rejeita intérpretes

**Files:**
- Create: `src/app/app/admin/interpreters/page.tsx`, `src/components/admin/InterpreterReviewCard.tsx`
- Modify: `src/actions/interpreters.ts`
- Test: unitário de mensagem de rejeição obrigatória

**Interfaces:**
- Produces: `reviewInterpreterApplication({ id, decision: "approved" | "rejected", rejectionReason?: string })`
- Também cria `notifications` para o intérprete

- [ ] **Step 1: Teste**

```ts
import { assertRejectionReason } from "@/lib/domain/interpreters";
import { describe, expect, it } from "vitest";

describe("assertRejectionReason", () => {
  it("requires reason on reject", () => {
    expect(() => assertRejectionReason("rejected", "")).toThrow();
    expect(() => assertRejectionReason("approved", "")).not.toThrow();
  });
});
```

- [ ] **Step 2: Implementar helper + action (admin only via `current_role`)**
- [ ] **Step 3: UI lista `pending` com link assinado do certificado**
- [ ] **Step 4: Seed documentado no README para promover um user a admin:**

```sql
update profiles set role = 'admin' where id = '<uuid>';
-- e espelhar app_metadata via dashboard Auth
```

- [ ] **Step 5: Commit**

```bash
git commit -am "feat: admin interpreter approval queue"
```

---

### Task 7: Domínio de agendamento + criar solicitação

**Files:**
- Create: `src/lib/domain/reasons.ts`, `src/lib/domain/appointments.ts`, `tests/domain/appointments.test.ts`, `src/app/app/user/request/page.tsx`, `src/actions/appointments.ts`
- Test: Vitest razões e geração de room name

**Interfaces:**
- Produces:
  - `APPOINTMENT_REASONS`, `CANCEL_REASONS`
  - `buildJitsiRoomName(appointmentId: string): string`
  - `createAppointmentAction(input: { scheduledAt: string; durationMinutes: 15|30|60; reasonCode: string; reasonText?: string })`

- [ ] **Step 1: Testes**

```ts
import { buildJitsiRoomName, isValidDuration } from "@/lib/domain/appointments";
import { describe, expect, it } from "vitest";

describe("appointments domain", () => {
  it("allows only 15/30/60", () => {
    expect(isValidDuration(15)).toBe(true);
    expect(isValidDuration(20)).toBe(false);
  });
  it("builds stable room names", () => {
    expect(buildJitsiRoomName("abc")).toMatch(/^sinalize-abc$/);
  });
});
```

- [ ] **Step 2: Run — fail; implementar; run — pass**
- [ ] **Step 3: Form usuário com selects de motivo/duração e datetime local futuro**
- [ ] **Step 4: Insert `status='open'`, `jitsi_room_name=buildJitsiRoomName(id)` (atualizar após insert se id só existe depois)**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: user appointment request form"
```

---

### Task 8: Fila do intérprete, Realtime e aceite atômico

**Files:**
- Create: `src/app/app/interpreter/page.tsx`, `src/components/appointments/OpenRequestCard.tsx`, `src/components/appointments/OpenRequestsList.tsx`
- Modify: `src/actions/appointments.ts` (`acceptAppointmentAction`)
- Test: documentar teste manual de corrida; unitário mapeia erro `already accepted`

**Interfaces:**
- Produces: `acceptAppointmentAction(appointmentId: string): Promise<{ ok: true } | { ok: false; message: string }>`
- Mensagem fixa se já aceito: `"Esse pedido já foi aceito por outra pessoa"`

- [ ] **Step 1: Teste de mapeamento de erro**

```ts
import { mapAcceptError } from "@/lib/domain/appointments";
import { describe, expect, it } from "vitest";

it("maps already accepted", () => {
  expect(mapAcceptError({ message: "already accepted" })).toBe(
    "Esse pedido já foi aceito por outra pessoa",
  );
});
```

- [ ] **Step 2: Action chama `supabase.rpc('accept_appointment', { p_appointment_id })`**
- [ ] **Step 3: Lista `status=open` + Realtime `postgres_changes`**
- [ ] **Step 4: Notificar requester e interpreter via insert em `notifications`**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: atomic appointment accept with realtime queue"
```

---

### Task 9: Dashboard do usuário (próxima chamada + calendário)

**Files:**
- Create: `src/app/app/user/page.tsx`, `src/components/appointments/NextCallHero.tsx`, `src/components/appointments/WeekStrip.tsx`, `src/components/appointments/RequestStatusList.tsx`, `src/components/layout/BottomNav.tsx`, `src/components/ui/EmptyState.tsx`
- Test: manual conforme mock aprovado

**Interfaces:**
- Consumes: appointments do requester
- Produces: UI Início sem métricas Total/Ativos/Concluídos

- [ ] **Step 1: Query próxima (`accepted` ou `open` mais próxima no futuro)**
- [ ] **Step 2: Hero com CTA Entrar (link sala se accepted e na janela) + Solicitar intérprete**
- [ ] **Step 3: Week strip + empty state “Nenhuma chamada” + CTA**
- [ ] **Step 4: Bottom nav User: Início · Pedidos · Histórico · Perfil**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: user home dashboard with next call focus"
```

---

### Task 10: Cancelamentos (regras de dia + motivos)

**Files:**
- Create: `src/lib/domain/cancellations.ts`, `tests/domain/cancellations.test.ts`, `src/actions/cancellations.ts`, `src/components/appointments/CancelDialog.tsx`
- Test: Vitest para cancel direto vs solicitação

**Interfaces:**
- Produces:
  - `canUserCancelDirectly(scheduledAt: Date, now: Date): boolean` — true se data civil de `now` < data civil de `scheduledAt` (timezone `America/Sao_Paulo`)
  - `requestOrCancelAppointmentAction(...)`

- [ ] **Step 1: Testes**

```ts
import { canUserCancelDirectly } from "@/lib/domain/cancellations";
import { describe, expect, it } from "vitest";

describe("canUserCancelDirectly", () => {
  it("allows before the calendar day", () => {
    const scheduled = new Date("2026-08-10T18:00:00-03:00");
    const now = new Date("2026-08-09T23:00:00-03:00");
    expect(canUserCancelDirectly(scheduled, now)).toBe(true);
  });
  it("blocks on the same calendar day", () => {
    const scheduled = new Date("2026-08-10T18:00:00-03:00");
    const now = new Date("2026-08-10T09:00:00-03:00");
    expect(canUserCancelDirectly(scheduled, now)).toBe(false);
  });
});
```

- [ ] **Step 2: Implementar com `Intl`/`Temporal` ou formatação `en-CA` em `America/Sao_Paulo`**
- [ ] **Step 3: User direto → `cancelled`; senão / interpreter → `cancellation_requests` + `cancel_requested`**
- [ ] **Step 4: Dialog com `CANCEL_REASONS` + texto opcional**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: cancellation rules with preset reasons"
```

---

### Task 11: Admin decide cancelamentos (retorno à fila)

**Files:**
- Create: `src/app/app/admin/cancellations/page.tsx`, `src/app/app/admin/page.tsx`
- Modify: `src/actions/cancellations.ts`
- Test: unitário do efeito pós-aprovação

**Interfaces:**
- Produces: `decideCancellationAction({ requestId, decision: "approved" | "rejected", note?: string })`
- Se approved e `requested_by_role === "interpreter"`: appointment → `open`, `interpreter_id = null`
- Se approved e role `user`: appointment → `cancelled`
- Se rejected: appointment → `accepted`

- [ ] **Step 1: Teste `nextAppointmentStatusAfterCancellationDecision`**
- [ ] **Step 2: Implementar action atômica (transaction via RPC SQL preferível)**
- [ ] **Step 3: Painel admin destaca urgentes do dia**
- [ ] **Step 4: Commit**

```bash
git commit -am "feat: admin cancellation decisions and requeue"
```

---

### Task 12: Notificações in-app

**Files:**
- Create: `src/components/notifications/NotificationBell.tsx`, `src/app/app/notifications/page.tsx`, `src/actions/notifications.ts`
- Modify: actions existentes para inserir notificações nos eventos-chave
- Test: manual

**Interfaces:**
- Produces: `listNotifications`, `markNotificationRead`
- Eventos: candidatura, aprovação/rejeição, aceite, cancelamento, decisão admin

- [ ] **Step 1: Bell no shell + lista**
- [ ] **Step 2: Realtime opcional em `notifications` filtrado por `profile_id`**
- [ ] **Step 3: Commit**

```bash
git commit -am "feat: in-app notifications for key events"
```

---

### Task 13: JaaS — token no servidor e sala embutida

**Files:**
- Create: `src/lib/jaas/token.ts`, `src/app/api/jaas-token/route.ts`, `src/app/app/meeting/[appointmentId]/page.tsx`, `src/components/meeting/JaaSEmbed.tsx`
- Test: unitário de claims do JWT (sem chave real: mock private key em teste)

**Interfaces:**
- Produces: `createJaasJwt({ roomName, userId, userName, moderator: boolean }): string`
- `GET /api/jaas-token?appointmentId=` valida participante + status `accepted`/`cancel_requested` e janela de horário (ex.: 10 min antes até fim)

**Regras:**
- Gravação desabilitada nas `configOverwrite` / `interfaceConfigOverwrite`
- Erro de load: banner “Não foi possível abrir a sala” + botão Tentar de novo

- [ ] **Step 1: Implementar JWT RS256 com `jose` conforme docs JaaS**
- [ ] **Step 2: Route handler autoriza só requester/interpreter do appointment**
- [ ] **Step 3: Embed `external_api.js` do domínio JaaS (não meet.jit.si)**
- [ ] **Step 4: Documentar variáveis JaaS no README**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: embed JaaS meeting room with server JWT"
```

---

### Task 14: Encerrar chamada, expirar opens e avaliações

**Files:**
- Create: `src/lib/domain/reviews.ts`, `tests/domain/reviews.test.ts`, `src/actions/reviews.ts`, `src/app/app/review/[appointmentId]/page.tsx`
- Modify: `src/actions/appointments.ts` (`completeAppointmentAction`, `expireStaleAppointments`)
- Test: Vitest média e unicidade lógica

**Interfaces:**
- Produces:
  - `completeAppointmentAction(appointmentId)` — participante marca encerrada → `completed`
  - Job/rota cron simples ou chamada no dashboard: `open` com `scheduled_at < now` → `expired`
  - Auto-complete: se `now > scheduled_at + duration` e ainda `accepted` → `completed` (mesma rotina)
  - `submitReviewAction({ appointmentId, rating, comment? })` atualiza `average_rating`

- [ ] **Step 1: Testes de `computeAverageRating(ratings: number[]): number`**
- [ ] **Step 2: RLS review comment privado; unique constraint**
- [ ] **Step 3: UI avaliação 1–5 + comentário opcional**
- [ ] **Step 4: Commit**

```bash
git commit -am "feat: complete appointments and mutual reviews"
```

---

### Task 15: Histórico, perfil e shells dos outros papéis

**Files:**
- Create: `src/app/app/user/history/page.tsx`, `src/app/app/user/profile/page.tsx`, `src/app/app/interpreter/agenda/page.tsx`, `src/app/app/admin/appointments/page.tsx`
- Test: manual navegação por papel

**Interfaces:**
- Produces: listagens filtradas; perfil edita nome + tema; mostra `average_rating`

- [ ] **Step 1: Histórico completed/cancelled/expired**
- [ ] **Step 2: Agenda intérprete (accepted)**
- [ ] **Step 3: Admin appointments overview**
- [ ] **Step 4: Commit**

```bash
git commit -am "feat: history, profile and role shells"
```

---

### Task 16: PWA, acessibilidade e README final

**Files:**
- Modify: `next.config.ts`, `public/manifest.webmanifest`, `README.md`, componentes de formulário (labels, focus)
- Test: Lighthouse/a11y manual no caminho crítico

**Interfaces:**
- Produces: app instalável; README completo passo a passo

- [ ] **Step 1: Manifest + ícones derivados do logo + `display: standalone`**
- [ ] **Step 2: Revisar foco visível, contrastes claro/escuro, empty/error com ícone+texto**
- [ ] **Step 3: README final**

Seções obrigatórias:
1. O que é o Sinalize  
2. Pré-requisitos (Node, conta Supabase, conta JaaS)  
3. Clone e `npm install`  
4. Configurar `.env`  
5. Aplicar migrations  
6. Criar primeiro admin  
7. `npm run dev`  
8. Contas de teste sugeridas  
9. Limitações do MVP  

- [ ] **Step 4: `npm run build` e `npm test` verdes**
- [ ] **Step 5: Commit**

```bash
git commit -am "feat: PWA support, a11y polish and complete README"
```

---

## Self-review checklist (autor do plano)

| Requisito da spec | Task |
|-------------------|------|
| PWA Next + React | 1, 16 |
| Auth e-mail + 18+ | 3 |
| Admin aprova intérprete | 5, 6 |
| Fila + aceite atômico | 7, 8 |
| Duração 15/30/60 | 7 |
| Cancelamentos + motivos | 10, 11 |
| JaaS sem gravação | 13 |
| Notificações in-app | 12 |
| Avaliações nota pública / comentário privado | 14 |
| Tema manual | 4 |
| Dashboard usuário | 9 |
| README local | 1, 16 |
| Expired / complete | 14 |
| Sem pagamento/e-mail/vídeos Libras | Global Constraints |

Placeholders: nenhum TBD. Nomes de actions/RPC alinhados entre tasks (`accept_appointment`, `acceptAppointmentAction`, `canUserCancelDirectly`).
