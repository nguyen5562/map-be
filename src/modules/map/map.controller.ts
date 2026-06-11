import { Controller, Get, Post, Put, Delete, Body, Query, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MapService } from './map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('all')
  getAll(@Query('userId') userId?: string) {
    return this.mapService.getAllMaps(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.mapService.getMapById(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMap(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId?: string
  ) {
    if (!file) {
      return { statusCode: 400, message: 'No file uploaded' };
    }
    return this.mapService.processUploadedMap(file, userId);
  }

  @Post('calibrate')
  calibrateMap(@Body() body: { mapId: string, calibrationData: any }) {
    const updated = this.mapService.saveCalibration(body.mapId, body.calibrationData);
    return { success: true, map: updated };
  }

  @Put(':id')
  updateMap(@Param('id') id: string, @Body() body: { name: string }) {
    return this.mapService.updateMap(id, body);
  }

  @Delete(':id')
  deleteMap(@Param('id') id: string) {
    return this.mapService.deleteMap(id);
  }
}
