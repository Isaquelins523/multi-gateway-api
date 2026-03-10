

---

# Multi-Gateway API (Nível 1)

API RESTful para gerenciamento de pagamentos multi-gateway.

**Nível 1:** o valor da compra é enviado direto pela API; gateways funcionam sem autenticação.

---

## Requisitos

* **Node.js 20+**
* **MySQL 8** (ou use Docker)
* **Opcional:** Docker e Docker Compose para rodar tudo junto

---

## Instalação e Execução

### Sem Docker

1. **Clone o repositório e instale as dependências**

```bash
npm ci
```

2. **Configure o ambiente**
   Copie `.env.example` para `.env` e preencha as credenciais:

```bash
cp .env.example .env
```

Edite o `.env` com as variáveis do MySQL (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`) e a `APP_KEY` (obrigatória).

3. **Execute as migrações**

```bash
node ace.js migration:run
```

4. **Execute o seeder**
   Cria gateways padrão (`gateway1` e `gateway2`). Sem isso, as compras retornarão erro de "Nenhum gateway disponível".

```bash
node ace.js db:seed
```

5. **(Opcional) Mock dos Gateways**
   Para testar compras e reembolsos localmente sem dependências externas:

```bash
docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock
```

6. **Inicie a API**

```bash
npm run dev
```

A API estará disponível em: `http://localhost:3333`.

---

### Com Docker Compose

O Docker Compose sobe automaticamente MySQL, a aplicação e o mock dos gateways.
As configurações vêm do `.env`.

1. Copie `.env.example` para `.env` e preencha:

   * Obrigatório: `APP_KEY`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`
2. Suba os serviços:

```bash
docker compose up --build
```

Acesso aos serviços:

* **API:** [http://localhost:3333](http://localhost:3333)
* **Gateway 1:** [http://localhost:3001](http://localhost:3001)
* **Gateway 2:** [http://localhost:3002](http://localhost:3002)

---

## Rotas da API

Todas as rotas estão sob o prefixo `/api/v1`.

### Rotas Públicas

| Método | Rota           | Descrição                                                        |
| ------ | -------------- | ---------------------------------------------------------------- |
| POST   | `/auth/login`  | Login (retorna token para rotas privadas)                        |
| POST   | `/auth/signup` | Cadastro de novo usuário                                         |
| POST   | `/purchases`   | Realizar compra (`amount`, `name`, `email`, `cardNumber`, `cvv`) |

**Exemplo de compra (Nível 1 – valor direto)**

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

### Rotas Privadas (Bearer Token)

*Requer header: `Authorization: Bearer <token>`*

| Método | Rota                    | Descrição                              |
| ------ | ----------------------- | -------------------------------------- |
| GET    | `/purchases`            | Listar compras                         |
| GET    | `/purchases/:id`        | Detalhe de uma compra                  |
| POST   | `/purchases/:id/refund` | Reembolso (chama o gateway original)   |
| GET    | `/clients`              | Listar clientes                        |
| GET    | `/clients/:id`          | Detalhe do cliente e suas compras      |
| GET    | `/gateways`             | Listar gateways                        |
| PATCH  | `/gateways/:id`         | Ativar/desativar ou alterar prioridade |
| CRUD   | `/products`             | Gerenciamento de produtos              |
| CRUD   | `/users`                | Gestão de usuários (requer role admin) |

---

## Suíte de Testes

Testes automatizados garantem a integridade da lógica de failover e integrações.
Usam banco em memória (SQLite) e mocks de rede para isolamento.

**Executar testes**

```bash
node ace.js test
```

### Testes de Unidade

#### Gateway Payment Service (`tests/unit/gateway_payment_service.spec.ts`)

* **Sucesso na Transação:** Simula resposta 200 do gateway e valida `externalId`.
* **Tratamento de Erro:** Respostas não-2xx retornam `success: false` com status do erro.
* **Fluxo de Reembolso:** Valida uso do endpoint específico de cada gateway (`/charge_back` para Gateway 1).

#### Purchase Validator (`tests/unit/purchase_validator.spec.ts`)

* **Validação Positiva:** Payloads completos passam sem erros.
* **Validação de Cartão:** Rejeita números inválidos (menos de 16 dígitos).

### Testes Funcionais (E2E)

#### Fluxo de Compras (`tests/functional/purchases.spec.ts`)

* **Sucesso no Gateway Primário:** Compra processada no gateway de maior prioridade com apenas um disparo de rede.
* **Failover (Retentativa):** Falha no primeiro gateway, sucesso no segundo, API realiza chamadas na ordem correta antes de responder 201.
* **Falha Crítica Total:** Todos os gateways falham → API retorna 400, não persiste dados na tabela de transações.

---

## Outras Informações

* **Nível 1:** O valor da compra (`amount`) é enviado diretamente, sem vínculo com produtos ou quantidades. Gateways sem autenticação.
* **Multi-gateway (Failover):** Compra tenta gateways ativos na ordem de prioridade; falha em um tenta o próximo. Reembolso chama o gateway que processou a transação (`charge_back` no Gateway 1, `reembolso` no Gateway 2).
* **Tecnologias:** JSON, AdonisJS (Lucid ORM), MySQL, validação com VineJS.

---

## Caso de Falha

Quando **todos os gateways falham**:

```json
{
  "message": "Todos os gateways falharam",
  "error": "Gateway gateway1 (1): 400 Bad Request - {\"message\":\"Cartão inválido\"}"
}
```

* **Sucesso:** Retorna `201` com transação gravada (`success`).
* **Falha Total:** Retorna `400` com `message` e `error`.

---

