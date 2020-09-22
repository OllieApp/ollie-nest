import { PRACTITIONER_CATEGORY } from '../models/category.model';
import { GENDER } from '../models/gender.model';

export interface CreatePractitionerDto {
  title: string;
  email: string;
  category: PRACTITIONER_CATEGORY;
  gender: GENDER;
}
