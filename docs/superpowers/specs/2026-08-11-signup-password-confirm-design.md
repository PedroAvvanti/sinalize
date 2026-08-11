# Cadastro: confirmação de senha e mostrar/ocultar

## Objetivo

No formulário de criar conta (`/signup`), o usuário deve digitar a senha duas vezes e poder ver o que está digitando em ambos os campos via ícone de olho.

## Escopo

- Página de cadastro apenas (login fora do escopo).
- Dois campos: Senha e Confirmar senha.
- Olhinho independente em cada campo.
- Validação de igualdade no servidor (`signUpAction`).

## Design

### UI

- Componente reutilizável `PasswordField` em `src/components/auth/`.
- Cada campo: label, input `type="password"|"text"`, botão com ícone SVG (olho / olho riscado).
- Botão: `type="button"`, `aria-label` “Mostrar senha” / “Ocultar senha”, `aria-pressed`.
- Help text do mínimo de 6 caracteres permanece no campo Senha.

### Backend

- FormData: `password` e `password_confirm`.
- Se diferirem: erro `"As senhas não coincidem."` (antes da chamada ao Supabase).
- Regra de mínimo 6 caracteres inalterada.

### CSS

- Wrapper `.auth-password-input` com input + botão absoluto à direita.
- Padding direito no input para não sobrepor o texto.
- Alinhado ao estilo iOS existente (`.auth-shell-ios`).

## Fora de escopo

- Toggle de senha no login.
- Indicador de força da senha.
- Validação de match só no cliente (pode haver UX extra depois; servidor é obrigatório).
