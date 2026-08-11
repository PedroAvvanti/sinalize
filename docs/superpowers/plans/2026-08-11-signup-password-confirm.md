# Signup Password Confirm Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** No cadastro, exigir confirmação de senha e permitir mostrar/ocultar nos dois campos.

**Architecture:** Componente `PasswordField` com estado local de visibilidade; `SignupForm` usa dois campos; `signUpAction` compara `password` e `password_confirm`.

**Tech Stack:** Next.js App Router, React 19 client components, CSS em `globals.css`, Vitest para validação de domínio se extrair helper.

## Global Constraints

- Responder UI em português.
- Não alterar login neste escopo.
- Não commitar a menos que o usuário peça.

---

## File map

| File | Role |
|------|------|
| `src/components/auth/PasswordField.tsx` | Input + olhinho |
| `src/app/(auth)/signup/signup-form.tsx` | Dois PasswordFields |
| `src/actions/auth.ts` | Validar match |
| `src/app/globals.css` | Estilos do wrapper/toggle |
| `src/lib/auth/policy.ts` (opcional) | Mensagem/helper de match |
| `tests/domain/auth-policy.test.ts` | Teste da mensagem/helper |

---

### Task 1: Helper de confirmação + teste

- [ ] Adicionar `passwordsMatch(password, confirm)` ou mensagem em `policy.ts`
- [ ] Teste: senhas iguais ok; diferentes retornam `"As senhas não coincidem."`
- [ ] Rodar `npm test -- tests/domain/auth-policy.test.ts`

### Task 2: `PasswordField` + CSS

- [ ] Criar componente com props: `id`, `name`, `label`, `autoComplete`, `minLength?`, `required?`, `describedBy?`, `help?`
- [ ] Estilos `.auth-password-input`, `.auth-password-toggle`

### Task 3: Integrar no signup + action

- [ ] Trocar input de senha por dois `PasswordField`
- [ ] Em `signUpAction`, rejeitar se `password !== password_confirm`

### Task 4: Verificar

- [ ] `npm test` e `npm run lint` nos arquivos tocados
