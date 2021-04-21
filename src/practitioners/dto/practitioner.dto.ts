import { LANGUAGE } from './language.dto';
import { PractitionerScheduleDto } from './practitioner-schedule.dto';
import { MEDICAL_AID } from '../../medical_aids/models/medical_aid.model';
import { PRACTITIONER_CATEGORY } from './category.dto';
import { GENDER } from './gender.dto';
import { AddressDto } from 'src/shared/dtos/address.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PractitionerDto {
  @Expose()
  public id: string;
  @Expose()
  public title: string;
  @Expose()
  public email?: string;
  @Expose()
  public phone?: string;
  @Expose()
  public bio?: string;
  @Expose()
  public address?: AddressDto;
  @Expose()
  public appointmentTimeSlot: number;
  @Expose()
  public consultationPricingFrom?: number;
  @Expose()
  public consultationPricingTo?: number;
  @Expose()
  public category: PRACTITIONER_CATEGORY;
  @Expose()
  public rating: number;
  @Expose()
  public gender: GENDER;
  @Expose()
  public avatarUrl?: string;
  @Expose()
  public medicalAids: MEDICAL_AID[];
  @Expose()
  public schedules: PractitionerScheduleDto[];
  @Expose()
  public languages: LANGUAGE[];
  @Expose()
  public isActive: boolean;
  @Expose()
  public isVerified: boolean;
  @Expose()
  public isDisabled: boolean;
}
