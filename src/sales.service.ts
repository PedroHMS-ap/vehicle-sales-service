import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from './prisma.service';
import { CreateSaleDto, PaymentUpdateDto } from './sales.dto';

type CatalogVehicle = { id: string; brand: string; model: string; year: number; color: string; price: number; status: string; paymentCode: string };

@Injectable()
export class SalesService {
  private readonly catalogUrl = process.env.CATALOG_SERVICE_URL ?? 'http://localhost:3001';
  private readonly internalToken = process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-internal';
  constructor(private readonly prisma: PrismaService) {}

  async listAvailable() {
    const response = await fetch(`${this.catalogUrl}/vehicles?status=FOR_SALE`);
    if (!response.ok) throw new InternalServerErrorException('Catalogo indisponivel');
    return response.json();
  }

  listSold() { return this.prisma.sale.findMany({ where: { paymentStatus: 'PAID' }, orderBy: { price: 'asc' } }); }

  updatePayment(input: PaymentUpdateDto) {
    return this.prisma.sale.update({ where: { paymentCode: input.paymentCode }, data: { paymentStatus: input.status } });
  }

  async create(input: CreateSaleDto) {
    const vehicleResponse = await fetch(`${this.catalogUrl}/vehicles/${input.vehicleId}`);
    if (vehicleResponse.status === 404) throw new NotFoundException('Veiculo nao encontrado');
    if (!vehicleResponse.ok) throw new InternalServerErrorException('Catalogo indisponivel');
    const vehicle = await vehicleResponse.json() as CatalogVehicle;
    if (vehicle.status !== 'FOR_SALE') throw new ConflictException('Veiculo nao esta disponivel');

    const paymentCode = vehicle.paymentCode;
    const reserveResponse = await fetch(`${this.catalogUrl}/vehicles/${vehicle.id}/sale`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-internal-token': this.internalToken }, body: JSON.stringify({ buyerCpf: input.buyerCpf, soldAt: input.soldAt }) });
    if (!reserveResponse.ok) throw new ConflictException('Nao foi possivel reservar o veiculo');
    try {
      return await this.prisma.sale.create({ data: { id: randomUUID(), vehicleId: vehicle.id, brand: vehicle.brand, model: vehicle.model, year: vehicle.year, color: vehicle.color, price: vehicle.price, buyerCpf: input.buyerCpf, soldAt: new Date(input.soldAt), paymentCode, paymentStatus: 'PENDING' } });
    } catch (error) {
      await fetch(`${this.catalogUrl}/vehicles/${vehicle.id}/release`, { method: 'POST', headers: { 'x-internal-token': this.internalToken } });
      throw error;
    }
  }
}