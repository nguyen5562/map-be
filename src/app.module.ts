import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MapModule } from './modules/map/map.module';
import { PrismaService } from './modules/prisma/prisma.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    MapModule
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
