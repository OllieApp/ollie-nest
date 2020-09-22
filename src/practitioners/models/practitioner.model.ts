import { LANGUAGE } from './language.model';
import { PractitionerScheduleModel } from './practitioner-schedule.model';
import { MEDICAL_AID } from './../../medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from './category.model';
import { GENDER } from './gender.model';
import { Location } from './location.model';
export interface PractitionerModel {
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
  schedules: PractitionerScheduleModel[];
  gender: GENDER;
  languages: LANGUAGE[];
  avatarUrl?: string;
}
