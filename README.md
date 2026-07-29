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

## Verificação

```bash
npm run lint
npm test
npm run build
```
