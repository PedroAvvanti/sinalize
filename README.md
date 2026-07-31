# Sinalize

Aplicação web que conecta pessoas surdas a intérpretes de Libras por videochamadas agendadas.

## Pré-requisitos

- Node.js em uma faixa suportada: `^20.19.0 || ^22.13.0 || >=24.0.0`
- npm
- Um projeto no [Supabase](https://supabase.com/dashboard/projects)
- Credenciais do Jitsi as a Service (JaaS)

## Executar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env.local
   ```

3. Preencha `.env.local` com as credenciais do seu projeto Supabase e do JaaS.

4. Inicie o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Acesse [http://localhost:3000](http://localhost:3000).

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
