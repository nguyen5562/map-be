import { IsArray, IsString } from 'class-validator';

export class ReorderDocumentsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
