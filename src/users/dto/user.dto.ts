import { Exclude, Expose } from 'class-transformer/decorators';
import { MEDICAL_AID } from '../../medical_aids/models/medical_aid.model';

// exclude is added here to exclude any extra attributes that might be attached to the class
@Exclude()
export class UserDto {
  @Expose()
  id: string;

  @Expose()
  firstName: string;

  @Expose()
  lastName: string;

  @Expose()
  email: string;

  @Expose()
  phone: string;

  @Expose()
  avatarUrl?: string;

  @Expose()
  countryCode: string;

  @Expose()
  zipCode?: string;

  @Expose()
  city?: string;

  @Expose()
  address?: string;

  @Expose()
  medicalAidNumber?: string;

  @Expose()
  medicalAidPlan?: string;

  @Expose()
  medicalAid?: MEDICAL_AID;

  @Expose()
  isEmailVerified: boolean;

  @Expose()
  isPhoneVerified: boolean;

  @Expose()
  isActive: boolean;

  constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
