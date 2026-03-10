# Multi-Gateway API (N?vel 1)

API RESTful para gerenciamento de pagamentos multi-gateway. N?vel 1: valor da compra vem direto pela API; gateways sem autentica??o.

## Requisitos

- Node.js 20+
- MySQL 8 (ou use Docker)
- (Opcional) Docker e Docker Compose para rodar tudo junto

## Instala??o e execu??o

### Sem Docker

1. Clone o reposit?rio e instale as depend?ncias:

   ```bash
   npm ci
   ```

2. Configure o ambiente. Copie `.env.example` para `.env` e preencha:

   ```bash
   cp .env.example .env
   ```

   Edite `.env` com as vari?veis do MySQL (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`) e `APP_KEY` (obrigat?rio).

3. Rode as migra??es:

   ```bash
   node ace.js migration:run
   ```

4. Rode o seeder para criar os gateways (gateway1 e gateway2). Sem isso, compras retornam "Nenhum gateway dispon?vel":

   ```bash
   node ace.js db:seed
   ```

5. (Opcional) Para testar compras e reembolsos, suba o mock dos gateways **sem autentica??o** (N?vel 1):

   ```bash
   docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock
   ```

6. Inicie a API:

   ```bash
   npm run dev
   ```

   A API fica em `http://localhost:3333`.

### Com Docker Compose

Sobe MySQL, a aplica??o e o mock dos gateways (sem auth). A conex?o com o banco e demais configs v?m do `.env`.

1. Copie `.env.example` para `.env` e preencha (obrigat?rio: `APP_KEY`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`; para o servi?o MySQL do compose, `MYSQL_ROOT_PASSWORD`).
2. Suba os servi?os:

   ```bash
   docker compose up --build
   ```

   - API: http://localhost:3333
   - Gateway 1: http://localhost:3001
   - Gateway 2: http://localhost:3002

   O Compose usa o `.env` no servi?o da app; apenas `MYSQL_HOST` ? sobrescrito para `mysql` (nome do servi?o) dentro da rede Docker. As migra??es e o seeder de gateways rodam automaticamente na subida do servi?o `app`.

## Rotas

Todas as rotas da API est?o sob o prefixo **`/api/v1`**.

### P?blicas

| M?todo | Rota | Descri??o |
|--------|------|-----------|
| POST | `/api/v1/auth/login` | Login (retorna token para rotas privadas) |
| POST | `/api/v1/auth/signup` | Cadastro de usu?rio |
| POST | `/api/v1/purchases` | Realizar compra (amount, name, email, cardNumber, cvv) |

**Exemplo de compra (N?vel 1 ? valor direto):**

```json
POST /api/v1/purchases
{
  "amount": 1000,
  "name": "tester",
  "email": "tester@email.com",
  "cardNumber": "5569000000006063",
  "cvv": "010"
}
```

### Privadas (Bearer token obrigat?rio)

Requer header: `Authorization: Bearer <token>` (token obtido no login). Rotas de gest?o exigem role `admin`.

| M?todo | Rota | Descri??o |
|--------|------|-----------|
| GET | `/api/v1/purchases` | Listar compras |
| GET | `/api/v1/purchases/:id` | Detalhe de uma compra |
| POST | `/api/v1/purchases/:id/refund` | Reembolso (chama o gateway) |
| GET | `/api/v1/clients` | Listar clientes |
| GET | `/api/v1/clients/:id` | Detalhe do cliente e compras |
| GET | `/api/v1/gateways` | Listar gateways |
| GET | `/api/v1/gateways/:id` | Detalhe do gateway |
| PATCH | `/api/v1/gateways/:id` | Ativar/desativar ou alterar prioridade |
| GET/POST/PUT/DELETE | `/api/v1/products` | CRUD de produtos |
| GET/POST/PUT/DELETE | `/api/v1/users` | CRUD de usu?rios (admin) |

## Outras informa??es

- **N?vel 1:** Valor da compra ? enviado no body (`amount` em centavos). N?o h? v?nculo com produtos/quantidades na transa??o. Gateways s?o chamados sem autentica??o (mock com `REMOVE_AUTH='true'`).
- **Multi-gateway:** A compra tenta os gateways ativos na ordem de prioridade; **se um gateway falhar, automaticamente tenta o pr?ximo**. No primeiro sucesso, a resposta ? de sucesso e o fluxo para. O reembolso chama o gateway que processou a transa??o (charge_back no Gateway 1, reembolso no Gateway 2).
- **Respostas:** JSON. Valida??o com VineJS; banco com Lucid (MySQL).

## Caso de falha

Quando **todos os gateways falham** (por indisponibilidade, erro de valida??o de cart?o ou qualquer erro HTTP n?o `2xx`), a API **n?o cria transa??o** no banco e retorna:

```json
{
  "message": "Todos os gateways falharam",
  "error": "Detalhe do ?ltimo erro retornado pelo gateway"
}
```

Exemplo de resposta real:

```json
{
  "message": "Todos os gateways falharam",
  "error": "Gateway gateway1 (1): 400 Bad Request - {\"message\":\"Cart?o inv?lido\"}"
}
```

Ou seja:

- **Pelo menos um gateway sucesso** ? resposta 201 com a transa??o gravada (status `success`).
- **Todos os gateways falharam** ? resposta 400 com `message` e `error`, sem criar transa??o.
