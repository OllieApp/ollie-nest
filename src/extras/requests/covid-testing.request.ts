import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsISO8601,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { NextPathologyTestingTypesCount } from './next-path-testing-types-count';

export class CovidTestingNextPathologyRequest {
  @IsString()
  public fullName: string;

  @IsEmail()
  public email: string;

  @IsPhoneNumber('ZZ')
  public phoneNumber: string;

  @IsString()
  @MaxLength(250)
  public fullAddress: string;

  @IsNumber()
  public numberOfPeople: number;

  @IsISO8601({ strict: true })
  public date: string;

  @IsOptional()
  @MaxLength(500)
  public notes?: string;

  @IsDefined()
  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => NextPathologyTestingTypesCount)
  public testingTypesCount!: NextPathologyTestingTypesCount;
}
