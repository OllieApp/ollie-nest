import { LANGUAGE } from './language.dto';
import { PractitionerScheduleDto } from './practitioner-schedule.dto';
import { MEDICAL_AID } from '../../medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from './category.dto';
import { GENDER } from './gender.dto';
import { AddressDto } from 'src/shared/dtos/address.dto';

export class PractitionerDto {
  public id: string;
  public title: string;
  public email?: string;
  public phone?: string;
  public bio?: string;
  public address?: AddressDto;
  public appointmentTimeSlot: number;
  public consultationPricingRange: number;
  public category: PRACTITIONER_CATEGORY;
  public isActive: boolean;
  public isVerified: boolean;
  public isDisabled: boolean;
  public rating: number;
  public gender: GENDER;
  public avatarUrl?: string;
  public medicalAids: MEDICAL_AID[];
  public schedules: PractitionerScheduleDto[];
  public languages: LANGUAGE[];

  constructor(partial: Partial<PractitionerDto>) {
    Object.assign(this, partial);
  }
}
