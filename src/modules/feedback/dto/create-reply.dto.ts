import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReplyDto {
  @IsString()
  @IsNotEmpty({ message: 'Nội dung trả lời không được để trống' })
  content: string;
}
