import { PRACTITIONER_CATEGORY } from '../dto/category.dto';
import { GENDER } from '../dto/gender.dto';

export class CreatePractitionerRequest {
  title: string;
  email: string;
  category: PRACTITIONER_CATEGORY;
  gender: GENDER;
}
