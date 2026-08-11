# Confirm Email Auto-Redirect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Na tela `/confirm`, detectar sessão após confirmação de e-mail e redirecionar para a home logada; o link de confirmação passa por `/auth/callback`.

**Architecture:** Route handler PKCE em `/auth/callback`; `signUp` com `emailRedirectTo`; client listener em `/confirm`; `proxy` trata `/confirm` como login/signup.

**Tech Stack:** Next.js App Router, `@supabase/ssr`, React client components.

## Global Constraints

- Respostas e copy em português.
- Reutilizar `homePathForRole` / `decideProfileAccess`.
- Não alterar templates de e-mail no dashboard neste plano.

---

### Task 1: Auth callback + emailRedirectTo

**Files:**
- Create: `src/app/auth/callback/route.ts`
- Modify: `src/actions/auth.ts` (`signUpAction`)

- [ ] **Step 1:** Criar `GET` em `/auth/callback` que faz `exchangeCodeForSession`, resolve destino pelo `role` e redireciona; sem code/erro → `/login`.
- [ ] **Step 2:** Em `signUpAction`, passar `emailRedirectTo` para `{origin}/auth/callback` (origin via headers `x-forwarded-host`/`host` + proto).
- [ ] **Step 3:** Verificar TypeScript / lint nos arquivos tocados.

### Task 2: Listener em `/confirm` + proxy

**Files:**
- Create: `src/components/auth/ConfirmSessionRedirect.tsx`
- Modify: `src/app/(auth)/confirm/page.tsx`
- Modify: `src/proxy.ts`

- [ ] **Step 1:** Client component: `onAuthStateChange` + `getSession` no mount/focus/visibility + intervalo ~2s; com sessão, buscar `profiles.role` e `router.replace(homePathForRole)`.
- [ ] **Step 2:** Incluir o componente na página `/confirm`; manter CTA de login.
- [ ] **Step 3:** No `proxy`, adicionar `/confirm` ao matcher e ao redirect de autenticados.
- [ ] **Step 4:** Rodar testes existentes relevantes (`tests/domain/auth-policy.test.ts` se aplicável) e checar lint.
