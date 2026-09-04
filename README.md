# Vehicle Sales Service

Microsservico responsavel pelo fluxo de compras e pelas listagens de veiculos disponiveis e vendidos. Foi isolado para permitir escala independente em momentos de aumento de chamadas.

## Responsabilidades

- Consultar veiculos disponiveis no catalogo via HTTP.
- Reservar veiculos antes de criar a venda local.
- Persistir o snapshot comercial da venda no banco proprio.
- Sincronizar o resultado do pagamento.
- Listar disponiveis e vendidos por preco crescente.
- Liberar reservas se a persistencia local falhar.

Este servico nunca acessa o banco do catalogo. A comunicacao interna usa `x-internal-token`.

## Tecnologias

Node.js 20+, NestJS 11, TypeScript, Prisma, PostgreSQL 16, Swagger, Jest, Docker e Kubernetes.

## Arquitetura e banco

```mermaid
flowchart LR
    Client[Frontend] --> Sales[Sales Service]
    Sales --> SalesDB[(sales_db)]
    Sales -->|HTTP consulta e reserva| Catalog[Catalog Service]
    Catalog -->|HTTP sincroniza pagamento| Sales
```

O banco `sales_db` e exclusivo deste servico. A tabela `Sale` guarda um snapshot de marca, modelo, ano, cor e preco para preservar o historico comercial.

## Pre-requisitos

- Node.js 20+.
- npm 10+.
- Docker Desktop em execucao.
- `vehicle-catalog-service` ativo na porta `3001`.

## Execucao local

Na raiz `veiculos-soat-fase4`, inicie os bancos:

```powershell
docker compose up -d postgres-catalog postgres-sales
```

Neste diretorio:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run prisma:generate
npm.cmd run prisma:migrate
npm.cmd run start:dev
```

A API inicia em `http://localhost:3002`.

| Variavel | Exemplo | Finalidade |
| --- | --- | --- |
| `PORT` | `3002` | Porta da API |
| `DATABASE_URL` | `postgresql://sales_user:sales_password@localhost:5434/sales_db` | Banco de vendas |
| `CATALOG_SERVICE_URL` | `http://localhost:3001` | URL do catalogo |
| `INTERNAL_SERVICE_TOKEN` | `change-me-internal` | Token interno |

## Swagger

Acesse `http://localhost:3002/docs`. Os DTOs possuem exemplos de payload para `Try it out`.

## Endpoints

- `GET /health`: verifica a saude da API.
- `POST /sales`: cria uma compra e solicita reserva ao catalogo.
- `GET /vehicles/available`: lista disponiveis via HTTP.
- `GET /vehicles/sold`: lista vendas pagas por preco crescente.
- `POST /sales/payment`: sincroniza pagamento, endpoint interno.

Criar compra:

```json
{
  "vehicleId": "VEHICLE-UUID-FROM-CATALOG",
  "buyerCpf": "12345678901",
  "soldAt": "2026-09-03T20:00:00.000Z"
}
```

A compra fica `PENDING` ate o catalogo processar o webhook. O endpoint interno de pagamento requer `x-internal-token`.

## Modelagem

O PostgreSQL `sales_db` possui `Sale` com `id`, `vehicleId`, `brand`, `model`, `year`, `color`, `price`, `buyerCpf`, `soldAt`, `paymentCode`, `paymentStatus` e `createdAt`.

Nao existe FK entre bancos. O snapshot evita que alteracoes posteriores no catalogo modifiquem o historico da venda. A listagem de vendidos filtra `paymentStatus = PAID` e ordena por `price ASC`.

## Testes

```powershell
npm.cmd test
npm.cmd run test:cov
npm.cmd run lint
npm.cmd run build
npm.cmd audit --audit-level=high
```

A cobertura minima configurada e 80%. A ultima validacao atingiu 91,66% de linhas, 100% de funcoes e 88,88% de branches.

O teste E2E completo fica no `vehicle-catalog-service` e exercita a comunicacao real entre os dois servicos.

## Docker e Kubernetes

```powershell
docker build -t vehicle-sales-service:local .
```

A pasta `k8s/` possui Namespace, Deployment, Service, ConfigMap, Secret de exemplo, HPA e Ingress. O Deployment usa duas replicas e probes de liveness/readiness.

## CI/CD

O workflow `.github/workflows/ci-cd.yml` executa lint, auditoria, testes, cobertura e build nos Pull Requests. Depois do merge em `main`, publica a imagem no GHCR. O deploy Kubernetes e executado quando `KUBE_CONFIG_DATA` estiver configurado.

## Repositorio relacionado

[vehicle-catalog-service](https://github.com/PedroHMS-ap/vehicle-catalog-service) concentra cadastro, reservas e webhook usando o banco separado `catalog_db`.
