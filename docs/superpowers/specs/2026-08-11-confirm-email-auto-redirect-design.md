# Confirmação de e-mail: redirecionar aba de espera

## Objetivo

Quando o usuário permanece em `/confirm` (“Confira seu e-mail”) e confirma o e-mail em outra aba, a aba de espera deve ir automaticamente para a home logada do papel (`/app/user` ou `/app/interpreter`).

## Contexto

- Após o cadastro sem sessão, o app redireciona para `/confirm`.
- O link do e-mail abre outra aba e hoje cai na landing (`/`).
- `/confirm` é estática; o `proxy` já redireciona logados em `/login` e `/signup`, mas não em `/confirm`.
- Sem trocar o `code` do PKCE por sessão, a aba do link pode não gravar cookies — a aba de espera nunca detecta login.

## Design

1. **Callback de auth** (`/auth/callback`): troca `code` por sessão, resolve o `role` via `profiles` e redireciona para `homePathForRole`.
2. **Cadastro**: `signUp` envia `emailRedirectTo` apontando para `/auth/callback`.
3. **Listener em `/confirm`**: client component escuta `onAuthStateChange`, checa sessão no foco/visibilidade e faz polling leve; ao autenticar, redireciona para a home do papel.
4. **Proxy**: incluir `/confirm` no matcher e no redirect de quem já está autenticado (igual login/signup).
5. **Fallback**: manter o botão “Ir para o login”.

## Fora de escopo

- Redirecionar a landing `/` para usuários já logados em geral (além do fluxo via callback).
- Alterar templates de e-mail no dashboard Supabase (bastam Redirect URLs permitindo o callback).
