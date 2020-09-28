import { COUNTRY_CODE } from './country-code.model';
import { MEDICAL_AID } from './../../medical_aids/models/medical_aid.model';
export interface UserModel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  countryCode: string;
  zipCode?: string;
  city?: string;
  address?: string;
  medicalAidNumber?: string;
  medicalAidPlan?: string;
  medicalAid?: MEDICAL_AID;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
}
