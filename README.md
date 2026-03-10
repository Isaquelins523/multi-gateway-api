
# Multi-Gateway API (Nível 1)

API RESTful para gerenciamento de pagamentos multi-gateway. Nível 1: valor da compra vem direto pela API; gateways sem autenticação.

## Requisitos

- **Node.js 20+**
- **MySQL 8** (ou use Docker)
- (Opcional) **Docker e Docker Compose** para rodar tudo junto

---

## Instalação e execução

### Sem Docker

1. **Clone o repositório e instale as dependências:**
   ```bash
   npm ci

```

2. **Configure o ambiente:**
Copie `.env.example` para `.env` e preencha as credenciais:
```bash
cp .env.example .env

```


Edite o `.env` com as variáveis do MySQL (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`) e a `APP_KEY` (obrigatória).
3. **Rode as migrações:**
```bash
node ace.js migration:run

```


4. **Rode o seeder:**
Necessário para criar os gateways padrão (`gateway1` e `gateway2`). Sem isso, as compras retornarão erro de "Nenhum gateway disponível".
```bash
node ace.js db:seed

```


5. **(Opcional) Mock dos Gateways:**
Para testar compras e reembolsos localmente sem dependências externas, suba o mock **sem autenticação** (Nível 1):
```bash
docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock

```


6. **Inicie a API:**
```bash
npm run dev

```


A API ficará disponível em: `http://localhost:3333`.

### Com Docker Compose

Sobe MySQL, a aplicação e o mock dos gateways automaticamente. A conexão com o banco e demais configs vêm do `.env`.

1. Copie `.env.example` para `.env` e preencha (obrigatório: `APP_KEY`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`).
2. Suba os serviços:
```bash
docker compose up --build

```


* **API:** http://localhost:3333
* **Gateway 1:** http://localhost:3001
* **Gateway 2:** http://localhost:3002



---

## Rotas

Todas as rotas da API estão sob o prefixo **`/api/v1`**.

### Públicas

| Método | Rota | Descrição |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Login (retorna token para rotas privadas) |
| POST | `/api/v1/auth/signup` | Cadastro de novo usuário |
| POST | `/api/v1/purchases` | Realizar compra (`amount`, `name`, `email`, `cardNumber`, `cvv`) |

**Exemplo de compra (Nível 1 — valor direto):**

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

### Privadas (Requer Bearer Token)

*Requer header: `Authorization: Bearer <token>*`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/api/v1/purchases` | Listar compras |
| GET | `/api/v1/purchases/:id` | Detalhe de uma compra |
| POST | `/api/v1/purchases/:id/refund` | Reembolso (chama o gateway original) |
| GET | `/api/v1/clients` | Listar clientes |
| GET | `/api/v1/clients/:id` | Detalhe do cliente e suas compras |
| GET | `/api/v1/gateways` | Listar gateways |
| PATCH | `/api/v1/gateways/:id` | Ativar/desativar ou alterar prioridade |
| CRUD | `/api/v1/products` | Gerenciamento de produtos |
| CRUD | `/api/v1/users` | Gestão de usuários (requer role admin) |

---

## Outras informações

* **Nível 1:** O valor da compra é enviado diretamente no body (`amount` em centavos). Não há vínculo com produtos/quantidades na transação. Gateways são chamados sem autenticação.
* **Multi-gateway (Failover):** A compra tenta os gateways ativos na ordem de prioridade. Se um falhar, tenta o próximo automaticamente. O reembolso chama o gateway que processou a transação (`charge_back` no Gateway 1, `reembolso` no Gateway 2).
* **Tecnologias:** JSON, AdonisJS (Lucid ORM), MySQL e validação com VineJS.

## Caso de falha

Quando **todos os gateways falham** (por indisponibilidade ou erro de validação), a API **não cria transação** no banco e retorna:

```json
{
  "message": "Todos os gateways falharam",
  "error": "Gateway gateway1 (1): 400 Bad Request - {\"message\":\"Cartão inválido\"}"
}

```

* **Sucesso:** Retorna `201` com a transação gravada (status `success`).
* **Falha Total:** Retorna `400` com `message` e `error`.

```

```