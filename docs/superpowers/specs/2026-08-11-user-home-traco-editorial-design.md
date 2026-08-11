# Redesign Início usuário — Traço editorial

## Objetivo

Reformular a tela **Início** do usuário e o **shell do app** (header + bottom nav) para uma identidade editorial + gestual própria da Sinalize — azul como âncora, sem visual SaaS genérico (cards empilhados, pills, Inter/Roboto).

## Contexto

- Produto: plataforma de solicitação de intérpretes de Libras.
- Direção escolhida: **Traço editorial** (mistura editorial confiante + gesto inspirado em movimento de mãos, sem infantilizar).
- Azul `#0878ff` permanece a cor principal; outras cores só onde já fazem sentido (ex.: sino de notificação).

## Escopo

### Em escopo

- Shell: `src/app/app/layout.tsx` (header), `BottomNav`, estilos de `.app-header` / `.app-shell`.
- Início do usuário: `src/app/app/user/page.tsx` e componentes:
  - `NextCallHero`
  - `WeekStrip`
  - `EmptyState` (uso no home; ajustar estilo compartilhado com cuidado)
  - `RequestStatusList`
- Tokens e tipografia em `globals.css` (+ fontes no layout raiz ou app layout).
- Dark mode: mesmos princípios com superfícies escuras; azul continua âncora.
- Motion leve (entrada do hero, desenho do gesto SVG, traço da nav) com `prefers-reduced-motion`.

### Fora de escopo

- Landing, auth, áreas intérprete/admin (podem herdar tokens globais, mas não redesenhar páginas).
- Mudanças de regras de negócio, queries ou fluxos de agendamento.
- Ilustrações infantis ou mascotes de mãos.

## Identidade visual

### Paleta (4–6 tokens)

| Token | Hex (light) | Papel |
|-------|-------------|--------|
| Primary | `#0878ff` | CTA, traços ativos, gesto |
| Ink | `#0b1c3a` | Texto principal |
| Muted | `#5a6b88` | Apoio |
| Bg | `#eef2f8` | Fundo da app (gelo, não branco puro flat) |
| Surface | transparente / tint leve | Evitar cards brancos empilhados |
| Warning (existente) | amarelo do sino | Só notificações |

Dark: superfícies `#0d1528` / `#131b2e`; ink claro; primary inalterado.

### Tipografia

- **Display:** Fraunces (ou equivalente serif expressiva) — saudação “Olá, Pedro.” e títulos de seção do home.
- **UI/body:** Source Sans 3 ou DM Sans — labels, nav, listas, botões.
- Evitar Inter, Roboto, Arial, system-ui como face principal de marca.

### Assinatura

Curva SVG assimétrica em azul no hero (gesto de movimento), sem badges flutuantes nem stickers sobre o conteúdo.

## Layout

### Header

- Compacto: logo + “Sinalize” à esquerda.
- Direita: sino + iniciais (link para Perfil). Nome completo some do header.
- Tema e “Sair” migram para a página **Perfil** (`/app/user/profile`), para o topo não parecer toolbar genérica.

### Hero (vazio)

1. Eyebrow “Hoje”
2. Saudação tipográfica grande
3. Uma frase curta de apoio
4. CTA “Solicitar intérprete” — azul, canto assimétrico (não pill)
5. Gesto SVG atrás/à direita

### Hero (com próxima chamada)

Mesma estrutura; conteúdo = motivo + horário + status; CTA principal “Entrar na chamada” quando a sala estiver aberta; manter cancelamento e CTA secundário de nova solicitação.

### Semana

Faixa tipográfica (abreviado do dia + data). Hoje = **traço azul** inferior, não caixinha com outline. Contagem só se houver atendimento naquele dia.

### Empty state

Bloco com traço superior tracejado; título + descrição; sem ícone genérico tipo “i”/◎ como herói visual.

### Pedidos recentes

Lista tipográfica densa (motivo | data | status), sem cards com borda/sombra.

### Bottom nav

Fundo limpo; ativo = traço azul fino + peso tipográfico; sem pill de fundo azul claro.

## Motion

1. Entrada do hero: fade + leve translateY com stagger curto.
2. Gesto SVG: `stroke-dashoffset` desenha uma vez no load, depois estático.
3. Nav: traço ativo pode deslizar entre itens (opcional se custo CSS for alto; mínimo: aparecer no ativo).

Respeitar `prefers-reduced-motion: reduce` (sem animações).

## Comportamento (inalterado)

- Dados e status de appointments iguais.
- Links: `/app/user/request`, meeting, cancel dialog.
- Papéis e redirects de auth inalterados.

## Critérios de sucesso

- Primeira viewport não parece dashboard SaaS genérico de cards.
- Removendo o logo, a tipografia + gesto + azul ainda lembram Sinalize.
- Header, home e bottom nav compartilham a mesma linguagem.
- Acessível: foco visível, contraste, reduced motion, labels da nav.

## Arquivos principais

- `src/app/globals.css`
- `src/app/layout.tsx` e/ou `src/app/app/layout.tsx` (fontes + header)
- `src/app/app/user/page.tsx`
- `src/app/app/user/profile/page.tsx` (receber Tema/Sair se migrarem do header)
- `src/components/appointments/NextCallHero.tsx`
- `src/components/appointments/WeekStrip.tsx`
- `src/components/appointments/RequestStatusList.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/layout/BottomNav.tsx`
