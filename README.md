# Sinalize

Aplicação web que conecta pessoas surdas a intérpretes de Libras por videochamadas agendadas.

## Pré-requisitos

- Node.js em uma faixa suportada: `^20.19.0 || ^22.13.0 || >=24.0.0`
- npm
- Um projeto no [Supabase](https://supabase.com/dashboard/projects)

A videochamada usa o Jitsi Meet público (`meet.jit.si`) embutido no app — **gratuito, sem conta extra**.

## Executar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha `.env.local` com as credenciais do seu projeto Supabase. O domínio Jitsi padrão é `meet.jit.si` (opcional: `NEXT_PUBLIC_JITSI_DOMAIN`).

4. Aplique as migrations em `supabase/migrations/` no SQL Editor do Supabase (ou via CLI), na ordem dos arquivos.

5. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

## Videochamada (Jitsi Meet)

- Gratuita, embutida no app via `meet.jit.si` (External API).
- Não exige conta JaaS nem chaves secretas de vídeo.
- A rota `/app/meeting/[appointmentId]` só abre para participantes do atendimento, dentro da janela de horário (10 min antes até o fim da duração).
- Gravação desabilitada no embed.

## Promover uma conta a administrador

Execute o seed abaixo no SQL Editor do Supabase, substituindo o placeholder
pelo UUID da conta:

```sql
update public.profiles
set role = 'admin'
where id = '<uuid>';
-- opcional: espelhar app_metadata via dashboard Auth (não usado na autorização)
```

A autorização administrativa do Sinalize consulta `profiles.role` por meio de
`private.current_role()` / `private.is_admin()`. Ela **não** usa
`user_metadata` nem depende de claims editáveis pelo usuário.

## Verificação

```bash
npm run lint
npm test
npm run build
```
