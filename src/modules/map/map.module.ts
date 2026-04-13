import { Module } from '@nestjs/common';
import { MapController } from './map.controller';
import { MapService } from './map.service';
import { PrismaService } from '../prisma/prisma.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

// Ensure upload directory exists
const uploaddir = './uploads/raw_maps';
if (!fs.existsSync(uploaddir)) {
  fs.mkdirSync(uploaddir, { recursive: true });
}

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: uploaddir,
        filename: (req, file, cb) => {
          // Fix encoding for Vietnamese characters
          file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
          const ext = extname(file.originalname);
          const filename = `${uuidv4()}${ext}`;
          cb(null, filename);
        },
      }),
    }),
  ],
  controllers: [MapController],
  providers: [MapService, PrismaService],
})
export class MapModule {}
