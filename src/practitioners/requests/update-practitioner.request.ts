import { Location } from '../dto/location.dto';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from '../dto/category.dto';
import { LANGUAGE } from '../dto/language.dto';
import { PractitionerScheduleDto } from '../dto/practitioner-schedule.dto';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export class UpdatePractitionerRequest {
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsPhoneNumber('ZZ')
  phone?: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(300)
  bio?: string;

  @IsOptional()
  @IsNotEmpty()
  @MaxLength(1500)
  description?: string;

  @IsOptional()
  @IsNotEmpty()
  address?: string;

  @IsOptional()
  @IsNotEmpty()
  consultationPricingFrom?: number;

  @IsOptional()
  @IsNotEmpty()
  consultationPricingTo?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  medicalAids?: MEDICAL_AID[];

  @IsOptional()
  category?: PRACTITIONER_CATEGORY;

  @IsOptional()
  @IsObject()
  location?: Location;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  schedules?: PractitionerScheduleDto[];

  @IsOptional()
  @IsNotEmpty()
  @IsArray()
  languages?: LANGUAGE[];
}
