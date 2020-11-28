import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';

export class UpdateUserRequest {
  @IsOptional()
  @IsNotEmpty()
  @MaxLength(150)
  firstName?: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(100)
  lastName?: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(3)
  countryCode?: string;

  @IsOptional()
  @IsNotEmpty()
  medicalAid?: MEDICAL_AID;

  @IsOptional()
  medicalAidNumber?: string;

  @IsOptional()
  medicalAidPlan?: string;

  @IsOptional()
  @ValidateIf(o => o.phone.length !== 0)
  @IsPhoneNumber('ZZ')
  phone?: string;

  @IsOptional()
  zipCode?: string;

  @IsOptional()
  city?: string;

  @IsOptional()
  address?: string;
}
