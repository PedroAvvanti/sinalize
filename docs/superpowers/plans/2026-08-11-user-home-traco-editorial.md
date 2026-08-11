# User Home Traço Editorial — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign do Início do usuário + shell (header/bottom nav) no estilo Traço editorial — azul âncora, tipografia expressiva, gesto SVG, sem cards/pills SaaS genéricos.

**Architecture:** Atualizar tokens CSS e tipografia globais; restyle do shell compartilhado; reestruturar markup/CSS de `NextCallHero`, `WeekStrip`, `EmptyState` (home) e `RequestStatusList`. Helper puro `getInitials` para o header. Sem mudanças de queries ou regras de negócio.

**Tech Stack:** Next.js App Router, React, `next/font/google`, CSS em `globals.css`, Vitest para helper de domínio.

## Global Constraints

- Azul principal permanece `#0878ff`.
- Sem Inter/Roboto/Arial como face principal de marca.
- Sem cards brancos empilhados / pills de nav ativos no Início e shell.
- Não alterar landing, auth, fluxos de intérprete/admin além do que o header compartilhado exigir.
- Não mudar queries nem status de appointments.
- UI em português.
- Não commitar a menos que o usuário peça.
- Respeitar `prefers-reduced-motion`.

---

## File map

| File | Responsibility |
|------|----------------|
| `src/lib/profile/initials.ts` | `getInitials(fullName: string): string` |
| `tests/domain/initials.test.ts` | Testes do helper |
| `src/app/layout.tsx` | Display font → Fraunces; manter Plus Jakarta como UI |
| `src/app/globals.css` | Tokens, tipografia app, hero, week, empty, lista, header, nav, motion |
| `src/app/app/layout.tsx` | Header compacto: logo, sino, iniciais; Theme/Sair condicionais por role |
| `src/app/app/user/profile/page.tsx` | Botão/form Sair (+ Theme já existe no `ProfileForm`) |
| `src/components/appointments/NextCallHero.tsx` | Markup editorial + gesto SVG |
| `src/components/appointments/WeekStrip.tsx` | Faixa tipográfica (sem caixinhas) |
| `src/components/appointments/RequestStatusList.tsx` | Lista tipográfica |
| `src/components/ui/EmptyState.tsx` | Empty sem ícone-herói genérico |
| `src/components/layout/BottomNav.tsx` | Indicador ativo por traço (classe CSS; markup mínimo se precisar) |
| `src/app/app/user/page.tsx` | Ajustar classes/props do empty (sem ícone `◎`) |

---

### Task 1: Helper `getInitials` + testes

**Files:**
- Create: `src/lib/profile/initials.ts`
- Create: `tests/domain/initials.test.ts`

**Interfaces:**
- Produces: `getInitials(fullName: string): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { getInitials } from "../../src/lib/profile/initials";

describe("getInitials", () => {
  it("usa primeira letra de nome e sobrenome", () => {
    expect(getInitials("Pedro Admin")).toBe("PA");
  });

  it("usa uma letra quando há só um nome", () => {
    expect(getInitials("Pedro")).toBe("P");
  });

  it("ignora espaços extras e retorna fallback para vazio", () => {
    expect(getInitials("  ")).toBe("?");
    expect(getInitials("")).toBe("?");
  });

  it("pega primeiro e último de três nomes", () => {
    expect(getInitials("Pedro Silva Admin")).toBe("PA");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/domain/initials.test.ts`
Expected: FAIL (módulo não existe)

- [ ] **Step 3: Implement**

```ts
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 1).toUpperCase();
  const first = parts[0]!.slice(0, 1);
  const last = parts[parts.length - 1]!.slice(0, 1);
  return (first + last).toUpperCase();
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- tests/domain/initials.test.ts`

---

### Task 2: Tokens tipográficos e de cor (base)

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css` (`:root`, `[data-theme="dark"]`, `body`)

**Interfaces:**
- Consumes: variáveis CSS existentes
- Produces: `--font-display` aponta para UI font; `--font-accent` = Fraunces; `--color-bg` `#eef2f8`; dark surfaces `#0d1528` / `#131b2e`

- [ ] **Step 1: Em `layout.tsx`, trocar `Source_Serif_4` por `Fraunces`**

```ts
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-accent",
  weight: ["500", "600", "700"],
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["500", "600", "700"],
});

// className={`${fraunces.variable} ${plusJakarta.variable}`}
```

- [ ] **Step 2: Atualizar tokens em `:root`**

```css
:root {
  --color-primary: #0878ff;
  --color-primary-ink: #ffffff;
  --color-bg: #eef2f8;
  --color-surface: #ffffff;
  --color-ink: #0b1c3a;
  --color-muted: #5a6b88;
  --color-accent-soft: #20ad9e;
  --color-warning: #c98a14;
  --color-danger: #c44747;
  --radius-lg: 18px;
  --font-display: var(--font-ui), "Segoe UI", system-ui, sans-serif;
}
```

Dark:

```css
[data-theme="dark"] {
  --color-bg: #0d1528;
  --color-surface: #131b2e;
  --color-ink: #f4f7ff;
  --color-muted: #9aabc8;
  --color-primary: #0878ff;
  --color-primary-ink: #ffffff;
  --color-accent-soft: #ffcb36;
}
```

- [ ] **Step 3: `body` usa `--font-display` (já usa); garantir que landing que usa `--font-accent` continue ok**

- [ ] **Step 4: Verificar visual rápido** — `npm run dev`, abrir `/app/user` e landing: fontes carregam, sem regressão óbvia de layout.

---

### Task 3: Header compacto + Sair no Perfil

**Files:**
- Modify: `src/app/app/layout.tsx`
- Modify: `src/app/app/user/profile/page.tsx`
- Modify: `src/app/globals.css` (`.app-header`, `.app-account`, novas classes `.app-avatar-link`)

**Interfaces:**
- Consumes: `getInitials(fullName: string): string`
- Layout precisa selecionar `role` além de `full_name`

- [ ] **Step 1: Em `app/layout.tsx`, selecionar `role` e montar header**

Comportamento:
- Remover `.app-user-name` em texto.
- Adicionar link `.app-avatar-link` com `getInitials(profile.full_name)`:
  - `role === "user"` → `href="/app/user/profile"`
  - demais roles → `href={`/app/${profile.role}`}` (ou sem link se não houver perfil; preferir home da role)
- Manter `NotificationBell`.
- Se `role === "user"`: **não** renderizar `ThemeToggle` nem form Sair (já estão / vão para Perfil).
- Se `role !== "user"`: manter `ThemeToggle` + Sair compactos (intérprete/admin não têm a página de perfil do usuário).

- [ ] **Step 2: Em `user/profile/page.tsx`, adicionar form Sair**

```tsx
import { signOutAction } from "@/actions/auth";
// ...
<form action={signOutAction} className="profile-signout">
  <button className="app-signout" type="submit">
    Sair
  </button>
</form>
```

(ThemeToggle já existe em `ProfileForm`.)

- [ ] **Step 3: CSS do header**

- `.app-header`: altura menor (`min-height` ~64px), fundo transparente ou `color-mix` leve sobre `--color-bg`, sem “barra branca card”.
- `.app-avatar-link`: círculo ~36px, borda/primary soft, tipografia UI bold, focus-visible.
- Esconder controles volumosos; `.app-signout` mais discreto para roles não-user.

- [ ] **Step 4: Verificar** — login como user: header só logo/sino/iniciais; Perfil tem Tema + Sair. Como admin/intérprete: Theme + Sair ainda no header.

---

### Task 4: Bottom nav — traço ativo

**Files:**
- Modify: `src/components/layout/BottomNav.tsx` (só se precisar de span para o traço)
- Modify: `src/app/globals.css` (`.bottom-nav`, `.bottom-nav__item-active`)

- [ ] **Step 1: CSS — remover pill de fundo**

```css
.bottom-nav__item-active {
  background: transparent;
  color: var(--color-primary);
  font-weight: 800;
}

.bottom-nav__item-active::before {
  content: "";
  display: block;
  width: 18px;
  height: 3px;
  margin: 0 auto 4px;
  border-radius: 2px;
  background: var(--color-primary);
}
```

(Se `::before` conflitar com grid, inserir `<span class="bottom-nav__trace" aria-hidden="true" />` só no item ativo.)

- [ ] **Step 2: Reduced motion** — se animar o traço, envolver em `@media (prefers-reduced-motion: no-preference)`.

- [ ] **Step 3: Verificar** — item ativo sem fundo azul claro; traço azul visível; `aria-current="page"` intacto.

---

### Task 5: `NextCallHero` editorial + gesto

**Files:**
- Modify: `src/components/appointments/NextCallHero.tsx`
- Modify: `src/app/globals.css` (bloco `.next-call-hero*`, CTA `.user-request-link` no contexto do hero)

**Interfaces:**
- Props inalteradas: `{ appointment, requesterName }`

- [ ] **Step 1: Markup empty state**

Estrutura:
- `section.next-call-hero.next-call-hero-empty` com `position: relative; overflow: hidden`
- SVG gesto absoluto (`aria-hidden="true"`): dois paths curva stroke `#0878ff` / opacity
- Eyebrow: texto **“Hoje”** (não “Seu início”)
- `h1` com classe display (font accent)
- Lead curto
- CTA `Link.user-request-link` (canto assimétrico via CSS)

- [ ] **Step 2: Markup com appointment**

Manter dados atuais (status, reason, time, duration, cancel, enter meeting). Remover visual de “card interno” se possível — usar tipografia + border-left. Status sem pill arredondado genérico (usar label tipográfica ou underline accent).

- [ ] **Step 3: CSS hero**

- Sem `border` + `border-radius` de card SaaS; padding generoso; fundo transparente ou tint mínimo.
- `h1`: `font-family: var(--font-accent), Georgia, serif`; `clamp(2rem, 6vw, 2.75rem)`; letter-spacing negativo.
- `.user-request-link` no hero: `border-radius: 4px 14px 14px 4px` (não 999px).
- Motion:
  - `@keyframes hero-rise` no título/CTA
  - `@keyframes gesture-draw` no SVG path (`stroke-dasharray` / `stroke-dashoffset`)
  - Desligar em `prefers-reduced-motion: reduce`

- [ ] **Step 4: Verificar** — empty e com próxima chamada; dark mode; reduced motion.

---

### Task 6: `WeekStrip` tipográfica

**Files:**
- Modify: `src/components/appointments/WeekStrip.tsx`
- Modify: `src/app/globals.css` (`.week-strip*`)

- [ ] **Step 1: Ajustar markup**

- Remover subtítulo genérico ou enxugar para uma linha.
- Dias: sem background de caixinha; hoje = classe com border-bottom 3px solid primary.
- Marcador vazio: omitir o `·` (não renderizar marker vazio) — só número quando `dayAppointments.length > 0`.

- [ ] **Step 2: CSS**

- `.week-strip`: sem border/radius de card; padding vertical só.
- `.week-strip__day`: background transparent; padding enxuto.
- `.week-strip__day-today`: sem outline; `box-shadow: inset 0 -3px 0 var(--color-primary)` ou border-bottom.
- Header `h2` pode usar accent font em peso médio.

- [ ] **Step 3: Verificar** — 7 dias legíveis no mobile; hoje destacado por traço.

---

### Task 7: Empty state + lista de pedidos

**Files:**
- Modify: `src/components/ui/EmptyState.tsx`
- Modify: `src/app/app/user/page.tsx`
- Modify: `src/components/appointments/RequestStatusList.tsx`
- Modify: `src/app/globals.css` (`.empty-state*`, `.request-status-*`)

- [ ] **Step 1: `EmptyState`**

- Tornar `icon` opcional de verdade: se ausente/`undefined`, não renderizar `.empty-state__icon`.
- Em `user/page.tsx`, **não** passar `icon="◎"`.

- [ ] **Step 2: CSS empty**

- Alinhar à esquerda (não centrado genérico).
- Borda: só `border-top: 1px dashed …` (sem caixa tracejada completa).
- Sem círculo de ícone.

- [ ] **Step 3: `RequestStatusList` CSS**

- Remover visual de cards por item; lista com separadores `border-bottom` hairline.
- Badges de status: tipográficos (peso/cor), não pills cheios — ou pills mínimos só se contraste exigir.

- [ ] **Step 4: Verificar** — home sem empty icon; com pedidos recentes a lista parece editorial.

---

### Task 8: Polimento final + verificação

**Files:** tocados acima (só ajustes)

- [ ] **Step 1: Checklist visual (light + dark)**
  - [ ] Header compacto, azul âncora
  - [ ] Hero com gesto, tipografia display
  - [ ] Semana sem caixinhas
  - [ ] Nav com traço, sem pill
  - [ ] Empty + lista limpos
  - [ ] Perfil user: Tema + Sair
  - [ ] Admin/intérprete: Theme + Sair no header

- [ ] **Step 2: Rodar testes e lint**

```bash
npm test -- tests/domain/initials.test.ts
npm test
npm run lint
```

Expected: PASS / sem erros novos nos arquivos tocados.

- [ ] **Step 3: Autocrítica Chanel** — remover 1 decoração se o gesto + display + traço da nav já bastarem (não empilhar texturas, glows, gradientes roxos).

---

## Spec coverage (self-review)

| Spec | Task |
|------|------|
| Paleta azul + gelo + ink | Task 2 |
| Fraunces + UI sans | Task 2 |
| Assinatura gesto SVG | Task 5 |
| Header compacto / iniciais / Tema+Sair no Perfil (user) | Task 3 |
| Hero empty + filled | Task 5 |
| Semana tipográfica | Task 6 |
| Empty sem ícone genérico | Task 7 |
| Lista tipográfica | Task 7 |
| Bottom nav traço | Task 4 |
| Motion + reduced motion | Task 5, 4 |
| Sem mudança de negócio | Todas (só UI) |
| Dark mode | Task 2 + verificação 8 |
