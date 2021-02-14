import { Type } from 'class-transformer';
import {
  IsDefined,
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

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
  @ValidateNested()
  @Type(() => NextPathologyTestingTypesCount)
  public testingTypesCount!: NextPathologyTestingTypesCount;
}

class NextPathologyTestingTypesCount {
  @IsNumber()
  public pctCount: number;

  @IsNumber()
  public antigenCount: number;

  @IsNumber()
  public antibodyCount: number;
}
