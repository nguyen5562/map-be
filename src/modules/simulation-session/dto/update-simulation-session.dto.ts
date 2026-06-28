import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSimulationSessionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
