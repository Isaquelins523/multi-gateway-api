
# Multi-Gateway API (N├Гvel 1)

API RESTful para gerenciamento de pagamentos multi-gateway. N├Гvel 1: valor da compra vem direto pela API; gateways sem autentica├Д├Бo.

## Requisitos

- **Node.js 20+**
- **MySQL 8** (ou use Docker)
- (Opcional) **Docker e Docker Compose** para rodar tudo junto

---

## Instala├Д├Бo e execu├Д├Бo

### Sem Docker

1. **Clone o reposit├│rio e instale as depend├фncias:**
   ```bash
   npm ci


2. **Configure o ambiente:**
Copie `.env.example` para `.env` e preencha as credenciais:
```bash
cp .env.example .env

```


Edite o `.env` com as vari├Аveis do MySQL (`MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`) e a `APP_KEY` (obrigat├│ria).
3. **Rode as migra├Д├хes:**
```bash
node ace.js migration:run

```


4. **Rode o seeder:**
Necess├Аrio para criar os gateways padr├Бo (`gateway1` e `gateway2`). Sem isso, as compras retornar├Бo erro de "Nenhum gateway dispon├Гvel".
```bash
node ace.js db:seed

```


5. **(Opcional) Mock dos Gateways:**
Para testar compras e reembolsos localmente sem depend├фncias externas, suba o mock **sem autentica├Д├Бo** (N├Гvel 1):
```bash
docker run -p 3001:3001 -p 3002:3002 -e REMOVE_AUTH='true' matheusprotzen/gateways-mock

```


6. **Inicie a API:**
```bash
npm run dev

```


A API ficar├А dispon├Гvel em: `http://localhost:3333`.


Aqui está a seção da **Suíte de Testes** formatada prontinha para você copiar e colar no seu arquivo:


## Suíte de Testes

A aplicação utiliza testes automatizados para garantir a integridade da lógica de failover e das integrações. Os testes utilizam banco de dados em memória (SQLite) e mocks de rede (global fetch) para isolamento total.

Para executar os testes:
```bash
node ace.js test

```

### Testes de Unidade

#### **Gateway Payment Service** (`tests/unit/gateway_payment_service.spec.ts`)

* **Sucesso na Transação:** Simula (mock) resposta 200 do gateway e valida se a função retorna o `externalId` correto.
* **Tratamento de Erro:** Garante que respostas não-2xx retornam `success: false` contendo o status do erro.
* **Fluxo de Reembolso:** Valida se o serviço utiliza o endpoint específico de cada gateway (ex: `/charge_back` para o Gateway 1).

#### **Purchase Validator** (`tests/unit/purchase_validator.spec.ts`)

* **Validação Positiva:** Garante que payloads completos passam sem erros.
* **Validação de Cartão:** Rejeita explicitamente números de cartão com formato inválido (ex: menos de 16 dígitos).

### Testes Funcionais (E2E)

#### **Fluxo de Compras** (`tests/functional/purchases.spec.ts`)

* **Sucesso no Gateway Primário:** Confirma que a compra é processada no gateway de maior prioridade e que apenas um disparo de rede é feito.
* **Mecanismo de Failover (Retentativa):** Simula falha no primeiro gateway e sucesso no segundo, verificando se a API realizou as duas chamadas na ordem correta antes de responder 201.
* **Falha Crítica Total:** Certifica que, caso todos os gateways falhem, a API retorna status 400, exibe a mensagem de erro apropriada e **não** persiste dados na tabela de transações.




### Com Docker Compose

Sobe MySQL, a aplica├Д├Бo e o mock dos gateways automaticamente. A conex├Бo com o banco e demais configs v├фm do `.env`.

1. Copie `.env.example` para `.env` e preencha (obrigat├│rio: `APP_KEY`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DB_NAME`).
2. Suba os servi├Дos:
```bash
docker compose up --build

```


* **API:** http://localhost:3333
* **Gateway 1:** http://localhost:3001
* **Gateway 2:** http://localhost:3002



---

## Rotas

Todas as rotas da API est├Бo sob o prefixo **`/api/v1`**.

### P├║blicas

| M├Еtodo | Rota | Descri├Д├Бo |
| --- | --- | --- |
| POST | `/api/v1/auth/login` | Login (retorna token para rotas privadas) |
| POST | `/api/v1/auth/signup` | Cadastro de novo usu├Аrio |
| POST | `/api/v1/purchases` | Realizar compra (`amount`, `name`, `email`, `cardNumber`, `cvv`) |

**Exemplo de compra (N├Гvel 1 Рђћ valor direto):**

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

| M├Еtodo | Rota | Descri├Д├Бo |
| --- | --- | --- |
| GET | `/api/v1/purchases` | Listar compras |
| GET | `/api/v1/purchases/:id` | Detalhe de uma compra |
| POST | `/api/v1/purchases/:id/refund` | Reembolso (chama o gateway original) |
| GET | `/api/v1/clients` | Listar clientes |
| GET | `/api/v1/clients/:id` | Detalhe do cliente e suas compras |
| GET | `/api/v1/gateways` | Listar gateways |
| PATCH | `/api/v1/gateways/:id` | Ativar/desativar ou alterar prioridade |
| CRUD | `/api/v1/products` | Gerenciamento de produtos |
| CRUD | `/api/v1/users` | Gest├Бo de usu├Аrios (requer role admin) |

---

## Outras informa├Д├хes

* **N├Гvel 1:** O valor da compra ├Е enviado diretamente no body (`amount` em centavos). N├Бo h├А v├Гnculo com produtos/quantidades na transa├Д├Бo. Gateways s├Бo chamados sem autentica├Д├Бo.
* **Multi-gateway (Failover):** A compra tenta os gateways ativos na ordem de prioridade. Se um falhar, tenta o pr├│ximo automaticamente. O reembolso chama o gateway que processou a transa├Д├Бo (`charge_back` no Gateway 1, `reembolso` no Gateway 2).
* **Tecnologias:** JSON, AdonisJS (Lucid ORM), MySQL e valida├Д├Бo com VineJS.

## Caso de falha

Quando **todos os gateways falham** (por indisponibilidade ou erro de valida├Д├Бo), a API **n├Бo cria transa├Д├Бo** no banco e retorna:

```json
{
  "message": "Todos os gateways falharam",
  "error": "Gateway gateway1 (1): 400 Bad Request - {\"message\":\"Cart├Бo inv├Аlido\"}"
}

```

* **Sucesso:** Retorna `201` com a transa├Д├Бo gravada (status `success`).
* **Falha Total:** Retorna `400` com `message` e `error`.

```

```