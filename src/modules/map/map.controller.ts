import { Controller, Get, Post, Put, Delete, Body, UploadedFile, UseInterceptors, Param, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MapService } from './map.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';
import { CalibrateMapDto } from './dto/calibrate-map.dto';

@Controller('map')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('all')
  getAll(@CurrentUser() user: ActiveUserData) {
    return this.mapService.getAllMaps(user);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.mapService.getMapById(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMap(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: ActiveUserData,
  ) {
    if (!file) {
      return { statusCode: 400, message: 'No file uploaded' };
    }
    return this.mapService.processUploadedMap(file, user.id);
  }

  @Post('calibrate')
  calibrateMap(@Body() body: CalibrateMapDto) {
    const updated = this.mapService.saveCalibration(body.mapId, body.calibrationData);
    return { success: true, map: updated };
  }

  @Put(':id')
  updateMap(@Param('id') id: string, @Body() body: { name: string }) {
    return this.mapService.updateMap(id, body);
  }

  @Roles('admin')
  @Delete(':id')
  deleteMap(@Param('id') id: string) {
    return this.mapService.deleteMap(id);
  }
}
