import { ConflictException, NotFoundException } from '@nestjs/common';
import { SalesService } from '../src/sales.service';

function prismaMock() { return { sale: { create: jest.fn(), findMany: jest.fn(), update: jest.fn() } }; }
const vehicle = { id: 'v1', brand: 'Ford', model: 'Ka', year: 2020, color: 'Preto', price: 50000, status: 'FOR_SALE', paymentCode: 'pay-1' };

describe('SalesService', () => {
  afterEach(() => jest.restoreAllMocks());
  it('lists available vehicles through HTTP', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify([vehicle]), { status: 200 }));
    const result = await new SalesService(prismaMock() as never).listAvailable();
    expect(result).toEqual([vehicle]);
  });
  it('fails when catalog is unavailable', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 503 }));
    await expect(new SalesService(prismaMock() as never).listAvailable()).rejects.toBeInstanceOf(Error);
  });
  it('lists sold vehicles from its own database', async () => {
    const prisma = prismaMock(); prisma.sale.findMany.mockResolvedValue([]);
    await new SalesService(prisma as never).listSold();
    expect(prisma.sale.findMany).toHaveBeenCalledWith({ where: { paymentStatus: 'PAID' }, orderBy: { price: 'asc' } });
  });
  it('creates a sale and reserves the vehicle over HTTP', async () => {
    const prisma = prismaMock(); prisma.sale.create.mockResolvedValue({ id: 's1' });
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(vehicle), { status: 200 })).mockResolvedValueOnce(new Response('{}', { status: 201 }));
    await expect(new SalesService(prisma as never).create({ vehicleId: 'v1', buyerCpf: '12345678901', soldAt: '2026-09-03T10:00:00.000Z' })).resolves.toEqual({ id: 's1' });
  });
  it('rejects a missing vehicle', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('{}', { status: 404 }));
    await expect(new SalesService(prismaMock() as never).create({ vehicleId: 'v1', buyerCpf: '12345678901', soldAt: '2026-09-03T10:00:00.000Z' })).rejects.toBeInstanceOf(NotFoundException);
  });
  it('rejects an already sold vehicle', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ ...vehicle, status: 'SOLD' }), { status: 200 }));
    await expect(new SalesService(prismaMock() as never).create({ vehicleId: 'v1', buyerCpf: '12345678901', soldAt: '2026-09-03T10:00:00.000Z' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('rejects when reservation fails', async () => {
    const prisma = prismaMock(); prisma.sale.create.mockResolvedValue({ id: 's1' });
    jest.spyOn(global, 'fetch').mockResolvedValueOnce(new Response(JSON.stringify(vehicle), { status: 200 })).mockResolvedValueOnce(new Response('{}', { status: 409 }));
    await expect(new SalesService(prisma as never).create({ vehicleId: 'v1', buyerCpf: '12345678901', soldAt: '2026-09-03T10:00:00.000Z' })).rejects.toBeInstanceOf(ConflictException);
  });
  it('updates the local payment status', async () => {
    const prisma = prismaMock(); prisma.sale.update.mockResolvedValue({ paymentStatus: 'PAID' });
    await expect(new SalesService(prisma as never).updatePayment({ paymentCode: 'pay-1', status: 'PAID' })).resolves.toEqual({ paymentStatus: 'PAID' });
  });
});