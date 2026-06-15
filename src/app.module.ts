import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MapModule } from './modules/map/map.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { DocumentModule } from './modules/document/document.module';
import { VehicleModule } from './modules/vehicle/vehicle.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { PrismaService } from './modules/prisma/prisma.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MapModule,
    UserModule,
    AuthModule,
    DocumentModule,
    VehicleModule,
    FeedbackModule,
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
