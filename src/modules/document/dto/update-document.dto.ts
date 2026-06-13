import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  classified?: boolean;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  sectionId?: string;
}
