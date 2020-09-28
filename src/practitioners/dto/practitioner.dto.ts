import { LANGUAGE } from './language.dto';
import { PractitionerScheduleDto } from './practitioner-schedule.dto';
import { MEDICAL_AID } from '../../medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from './category.dto';
import { GENDER } from './gender.dto';
import { Location } from './location.dto';
export class PractitionerDto {
  id: string;
  title: string;
  email?: string;
  phone?: string;
  bio?: string;
  description?: string;
  address?: string;
  appointmentTimeSlot: number;
  consultationPricingRange: number;
  medicalAids: MEDICAL_AID[];
  category: PRACTITIONER_CATEGORY;
  location?: Location;
  isActive: boolean;
  isVerified: boolean;
  rating: number;
  schedules: PractitionerScheduleDto[];
  gender: GENDER;
  languages: LANGUAGE[];
  avatarUrl?: string;
}
