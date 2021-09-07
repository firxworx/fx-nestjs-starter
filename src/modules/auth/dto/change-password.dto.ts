import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, MinLength } from 'class-validator'

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  oldPassword!: string

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  newPassword!: string
}
