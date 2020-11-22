import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';
import { PRACTITIONER_CATEGORY } from '../dto/category.dto';
import { GENDER } from '../dto/gender.dto';

export class CreatePractitionerRequest {
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsNotEmpty()
  @MaxLength(150)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  category: PRACTITIONER_CATEGORY;

  @IsNotEmpty()
  gender: GENDER;
}
