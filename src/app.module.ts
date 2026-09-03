import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { HealthController } from './health.controller';

@Module({ controllers: [SalesController, HealthController], providers: [PrismaService, SalesService] })
export class AppModule {}