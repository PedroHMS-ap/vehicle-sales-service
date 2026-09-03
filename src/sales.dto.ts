import { IsDateString, IsString, Length } from 'class-validator';

export class CreateSaleDto {
  @IsString() vehicleId!: string;
  @IsString() @Length(11, 14) buyerCpf!: string;
  @IsDateString() soldAt!: string;
}

export class PaymentUpdateDto {
  @IsString() paymentCode!: string;
  @IsString() status!: 'PAID' | 'CANCELLED';
}