import { IsDateString, IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSaleDto {
  @ApiProperty({ example: 'VEHICLE-UUID-FROM-CATALOG' })
  @IsString() vehicleId!: string;
  @ApiProperty({ example: '12345678901' })
  @IsString() @Length(11, 14) buyerCpf!: string;
  @ApiProperty({ example: '2026-09-03T20:00:00.000Z' })
  @IsDateString() soldAt!: string;
}

export enum PaymentUpdateStatus { PAID = 'PAID', CANCELLED = 'CANCELLED' }

export class PaymentUpdateDto {
  @ApiProperty({ example: 'PAYMENT-CODE-RETURNED-BY-SALE' })
  @IsString() paymentCode!: string;
  @ApiProperty({ enum: PaymentUpdateStatus, example: PaymentUpdateStatus.PAID })
  @IsEnum(PaymentUpdateStatus) status!: PaymentUpdateStatus;
}