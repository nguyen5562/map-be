import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề tài liệu không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại tài liệu không được để trống' })
  type: string;

  @IsBoolean()
  @IsOptional()
  classified?: boolean;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsNotEmpty({ message: 'sectionId không được để trống' })
  sectionId: string;

  @IsString()
  @IsOptional()
  folder?: string;

  @IsString()
  @IsOptional()
  folderId?: string;
}
