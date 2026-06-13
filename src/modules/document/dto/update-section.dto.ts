import { IsOptional, IsString } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  roman?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  type?: string;
}
