import { Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { DocumentService } from './document.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('sections')
  getSections() {
    return this.documentService.getSections();
  }

  @Post('sections')
  @Roles('admin')
  createSection(@Body() data: any) {
    return this.documentService.createSection(data);
  }

  @Put('sections/:id')
  @Roles('admin')
  updateSection(@Param('id') id: string, @Body() data: any) {
    return this.documentService.updateSection(id, data);
  }

  @Delete('sections/:id')
  @Roles('admin')
  removeSection(@Param('id') id: string) {
    return this.documentService.removeSection(id);
  }

  @Patch('sections/:sectionId/reorder')
  @Roles('admin')
  reorderDocuments(
    @Param('sectionId') sectionId: string,
    @Body() body: { orderedIds: string[] },
  ) {
    return this.documentService.reorderDocuments(sectionId, body.orderedIds);
  }

  @Post()
  @Roles('admin')
  createDocument(@Body() data: any) {
    return this.documentService.createDocument(data);
  }

  @Put(':id')
  @Roles('admin')
  updateDocument(@Param('id') id: string, @Body() data: any) {
    return this.documentService.updateDocument(id, data);
  }

  @Delete(':id')
  @Roles('admin')
  removeDocument(@Param('id') id: string) {
    return this.documentService.removeDocument(id);
  }
}
