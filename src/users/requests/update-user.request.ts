import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  medicalAid?: MEDICAL_AID;
  medicalAidNumber?: string;
  medicalAidPlan?: string;
  phone?: string;
  zipCode?: string;
  city?: string;
  address?: string;
}
