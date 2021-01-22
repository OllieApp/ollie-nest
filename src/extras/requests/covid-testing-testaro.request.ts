import {
  IsEmail,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  MaxLength,
} from 'class-validator';

export class CovidTestingTestaroRequest {
  @IsNotEmpty()
  public fullName: string;

  @IsEmail()
  public email: string;

  @IsPhoneNumber('ZZ')
  public phoneNumber: string;

  @IsNotEmpty()
  @MaxLength(300)
  public fullAddress: string;

  @IsNotEmpty()
  public numberOfPeople: number;

  @IsISO8601({ strict: true })
  public date: string;

  @IsOptional()
  @MaxLength(300)
  public notes?: string;
}
