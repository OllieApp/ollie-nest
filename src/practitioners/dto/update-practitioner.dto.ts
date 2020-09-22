import { Location } from './../models/location.model';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from '../models/category.model';
import { LANGUAGE } from '../models/language.model';
import { PractitionerScheduleModel } from '../models/practitioner-schedule.model';

export interface UpdatePractitionerDto {
  title?: string;
  email?: string;
  phone?: string;
  bio?: string;
  description?: string;
  address?: string;
  consultationPricingRange?: number;
  medicalAids?: MEDICAL_AID[];
  category?: PRACTITIONER_CATEGORY;
  location?: Location;
  isActive?: boolean;
  schedules?: PractitionerScheduleModel[];
  languages?: LANGUAGE[];
}
