import { Location } from '../dto/location.dto';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from '../dto/category.dto';
import { LANGUAGE } from '../dto/language.dto';
import { PractitionerScheduleDto } from '../dto/practitioner-schedule.dto';

export class UpdatePractitionerRequest {
  title?: string;
  email?: string;
  phone?: string;
  bio?: string;
  description?: string;
  address?: string;
  consultationPricingFrom?: number;
  consultationPricingTo?: number;
  medicalAids?: MEDICAL_AID[];
  category?: PRACTITIONER_CATEGORY;
  location?: Location;
  isActive?: boolean;
  schedules?: PractitionerScheduleDto[];
  languages?: LANGUAGE[];
}
