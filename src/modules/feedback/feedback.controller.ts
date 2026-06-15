import { Controller, Get, Post, Patch, Body, Param, UseGuards, Sse, MessageEvent } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { ActiveUserData } from '../../common/interfaces/active-user-data.interface';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { CreateReplyDto } from './dto/create-reply.dto';
import { Observable, map } from 'rxjs';

@Controller('feedback')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(
    @CurrentUser() user: ActiveUserData,
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.feedbackService.createFeedback(user.id, dto);
  }

  @Get('my')
  getMyFeedbacks(@CurrentUser() user: ActiveUserData) {
    return this.feedbackService.getMyFeedbacks(user.id);
  }

  @Get('admin/all')
  @Roles('admin')
  getAllFeedbacks() {
    return this.feedbackService.getAllFeedbacks();
  }

  @Patch('admin/:id/status')
  @Roles('admin')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.feedbackService.updateStatus(id, status);
  }

  @Post(':id/reply')
  addReply(
    @CurrentUser() user: ActiveUserData,
    @Param('id') id: string,
    @Body() dto: CreateReplyDto,
  ) {
    const isAdmin = user.role === 'admin';
    return this.feedbackService.addReply(user.id, id, dto, isAdmin);
  }

  @Get('notifications')
  getNotifications(@CurrentUser() user: ActiveUserData) {
    const isAdmin = user.role === 'admin';
    return this.feedbackService.getNotifications(user.id, isAdmin);
  }

  @Patch(':id/read')
  markAsRead(
    @CurrentUser() user: ActiveUserData,
    @Param('id') id: string,
  ) {
    const isAdmin = user.role === 'admin';
    return this.feedbackService.markAsRead(id, user.id, isAdmin);
  }

  @Sse('sse')
  sse(@CurrentUser() user: ActiveUserData): Observable<MessageEvent> {
    const isAdmin = user.role === 'admin';
    const key = isAdmin ? 'admin' : user.id;
    return this.feedbackService.getSseObservable(key).pipe(
      map(() => ({ data: { type: 'reload' } } as MessageEvent))
    );
  }
}
