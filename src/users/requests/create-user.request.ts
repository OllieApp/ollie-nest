import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserRequest {
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsNotEmpty()
  @MaxLength(150)
  lastName: string;

  @IsOptional()
  @ValidateIf(o => o.phone?.length !== 0)
  @IsPhoneNumber('ZZ')
  phoneNumber?: string;
}
