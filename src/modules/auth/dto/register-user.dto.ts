import { IsEmail, IsString, IsNotEmpty, MinLength } from 'class-validator'

export class RegisterUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string
}
