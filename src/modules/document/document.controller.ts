import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { DocumentService } from './document.service';

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  @Get('sections')
  getSections() {
    return this.documentService.getSections();
  }

  @Post('sections')
  createSection(@Body() data: any) {
    return this.documentService.createSection(data);
  }

  @Put('sections/:id')
  updateSection(@Param('id') id: string, @Body() data: any) {
    return this.documentService.updateSection(id, data);
  }

  @Delete('sections/:id')
  removeSection(@Param('id') id: string) {
    return this.documentService.removeSection(id);
  }

  @Post()
  createDocument(@Body() data: any) {
    return this.documentService.createDocument(data);
  }

  @Put(':id')
  updateDocument(@Param('id') id: string, @Body() data: any) {
    return this.documentService.updateDocument(id, data);
  }

  @Delete(':id')
  removeDocument(@Param('id') id: string) {
    return this.documentService.removeDocument(id);
  }
}
