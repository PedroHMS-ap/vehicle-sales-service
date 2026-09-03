import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
import { CreateSaleDto, PaymentUpdateDto } from './sales.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller()
export class SalesController {
  constructor(private readonly service: SalesService) {}
  @Post('sales') create(@Body() input: CreateSaleDto) { return this.service.create(input); }
  @Get('vehicles/available') listAvailable() { return this.service.listAvailable(); }
  @Get('vehicles/sold') listSold() { return this.service.listSold(); }
  @ApiHeader({ name: 'x-internal-token', required: true, example: 'change-me-internal' })
  @Post('sales/payment') updatePayment(@Headers('x-internal-token') token: string | undefined, @Body() input: PaymentUpdateDto) {
    if (token !== (process.env.INTERNAL_SERVICE_TOKEN ?? 'change-me-internal')) throw new UnauthorizedException('Token interno invalido');
    return this.service.updatePayment(input);
  }
}