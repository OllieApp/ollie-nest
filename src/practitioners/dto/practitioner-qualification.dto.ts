import {
  IsBoolean,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class PractitionerQualificationDto {
  @IsNotEmpty()
  @MaxLength(150)
  public title: string;

  @IsISO8601()
  public fromDate: string;

  @IsOptional()
  @IsISO8601()
  public toDate?: string;

  @IsBoolean()
  public isCurrent: boolean;
}
