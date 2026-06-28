import { Module } from '@nestjs/common';
import { SimulationSessionController } from './simulation-session.controller';
import { SimulationSessionService } from './simulation-session.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SimulationSessionController],
  providers: [SimulationSessionService, PrismaService],
})
export class SimulationSessionModule {}
