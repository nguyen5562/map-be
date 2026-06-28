import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';
import { SimulationSessionService } from './simulation-session.service';
import { CreateSimulationSessionDto } from './dto/create-simulation-session.dto';
import { UpdateSimulationSessionDto } from './dto/update-simulation-session.dto';

@Controller('simulation-session')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SimulationSessionController {
  constructor(private readonly sessionService: SimulationSessionService) {}

  /**
   * GET /simulation-session
   * Lấy danh sách metadata phương án của user hiện tại.
   */
  @Get()
  getAll(
    @CurrentUser() user: ActiveUserData,
    @Query('mapId') mapId?: string,
  ) {
    return this.sessionService.getAll(user.id, mapId);
  }

  /**
   * GET /simulation-session/:id
   * Lấy chi tiết 1 phương án (bao gồm data) để tải về store.
   */
  @Get(':id')
  getById(
    @Param('id') id: string,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.sessionService.getById(id, user.id);
  }

  /**
   * POST /simulation-session
   * Tạo phương án mới từ snapshot hiện tại.
   */
  @Post()
  create(
    @CurrentUser() user: ActiveUserData,
    @Body() dto: CreateSimulationSessionDto,
  ) {
    return this.sessionService.create(user.id, dto);
  }

  /**
   * PUT /simulation-session/:id
   * Cập nhật tên hoặc dữ liệu phương án.
   */
  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: ActiveUserData,
    @Body() dto: UpdateSimulationSessionDto,
  ) {
    return this.sessionService.update(id, user.id, dto);
  }

  /**
   * DELETE /simulation-session/:id
   * Xóa phương án.
   */
  @Delete(':id')
  delete(
    @Param('id') id: string,
    @CurrentUser() user: ActiveUserData,
  ) {
    return this.sessionService.delete(id, user.id);
  }
}
