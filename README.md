# Vehicle Sales Service

Servico isolado para compras e consultas. Persiste somente o snapshot da venda no seu banco e consulta o catalogo exclusivamente via HTTP.

- `POST /sales`
- `GET /vehicles/available`
- `GET /vehicles/sold`
- `POST /sales/payment` (comunicacao interna do catalogo)

Use `.env.example`, `npm install`, `npm run prisma:generate`, `npm run prisma:migrate` e `npm run start:dev`. Compras ficam `PENDING` ate o catalogo confirmar o pagamento.
