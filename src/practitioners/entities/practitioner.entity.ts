import { Language } from './language.entity';
import PractitionerSchedule from './practitioner-schedule.entity';
import { Geometry } from 'geojson';
import MedicalAid from 'src/medical_aids/entities/medical_aid.entity';
import User from 'src/users/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PractitionerCategory } from './practitioner-category.entity';
import { GENDER } from '../dto/gender.dto';
import Appointment from 'src/appointments/entities/appointment.entity';
import { COUNTRY_CODE } from 'src/shared/models/country-code.model';
import Review from 'src/reviews/entities/review.entity';
import PractitionerEvent from 'src/practitioner_events/entities/practitioner_event.entity';
import PractitionerQualification from './practitioner-qualification.entity';
import Address from 'src/shared/entities/address.entity';

@Entity('practitioner')
@Check(`"consultation_pricing_from" < "consultation_pricing_to"`)
@Check(`"rating" >= 0 AND "rating" <= 5`)
class Practitioner {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ type: 'text' })
  public title: string;

  @Column({ type: 'text', nullable: true })
  public email?: string;

  @Column({ type: 'text', nullable: true })
  public phone?: string;

  @Column({ type: 'text', nullable: true })
  public bio?: string;

  //TODO: to be removed at a later stage
  @Column({ type: 'text', nullable: true })
  public address?: string;

  // needed to specify the career path
  @Column({ type: 'text', name: 'career_path', nullable: false, default: '' })
  public careerPath: string;

  //TODO: to be renamed at a later stage - only the name of the variable
  // remove nullable after migration
  @OneToOne(() => Address, { eager: true, nullable: true })
  @JoinColumn({ name: 'address_id' })
  public addressObject?: Address;

  @Column({ name: 'address_id', nullable: true })
  public addressId?: string;

  @Column({
    name: 'appointment_time_slot',
    type: 'smallint',
    default: 30,
    nullable: false,
    unsigned: true,
  })
  public appointmentTimeSlot: number;

  @Column({
    name: 'consultation_pricing_from',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    unsigned: true,
  })
  public consultationPricingFrom?: number;

  @Column({
    name: 'consultation_pricing_to',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    unsigned: true,
  })
  public consultationPricingTo?: number;

  @ManyToMany(type => MedicalAid, { eager: true })
  @JoinTable({
    name: 'practitioner_medical_aid',
    joinColumn: {
      name: 'practitioner_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'medical_aid_id',
      referencedColumnName: 'id',
    },
  })
  @JoinColumn({ name: 'medical_aid_id' })
  public medicalAids: MedicalAid[];

  @ManyToOne(
    type => PractitionerCategory,
    category => category.practitioners,
    {
      nullable: false,
      eager: true,
    },
  )
  @JoinColumn({ name: 'category_id' })
  public category: PractitionerCategory;

  @Column({ name: 'category_id' })
  public categoryId: number;

  @ManyToOne(
    type => User,
    user => user.createdPractitioners,
    { nullable: false, eager: false },
  )
  @JoinColumn({ name: 'created_by' })
  public createdBy: Promise<User>;

  @Column({ type: 'bigint', name: 'created_by' })
  public createdById: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  public createdAt: Date;

  //TODO: to be removed at a later stage
  @Column({
    type: 'geography',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  @Index({ spatial: true })
  public location?: Geometry;

  @Column({
    type: 'boolean',
    name: 'is_active',
    nullable: false,
    default: false,
  })
  @Index()
  public isActive: boolean;

  @Column({
    type: 'boolean',
    name: 'is_verified',
    nullable: false,
    default: false,
  })
  @Index()
  public isVerified: boolean;

  @Column({
    type: 'boolean',
    name: 'is_disabled',
    nullable: false,
    default: false,
  })
  @Index()
  public isDisabled: boolean;

  @Column({ type: 'real', default: 0, nullable: false, unsigned: true })
  public rating: number;

  @OneToMany(
    type => PractitionerSchedule,
    schedule => schedule.practitioner,
    { eager: true },
  )
  public schedules: PractitionerSchedule[];

  @Column({
    type: 'smallint',
    unsigned: true,
    default: GENDER.Other,
    nullable: false,
  })
  public gender: GENDER;

  @ManyToMany(type => Language, { nullable: false, eager: true })
  @JoinTable({
    name: 'practitioner_language',
    joinColumn: {
      name: 'practitioner_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'language_id',
      referencedColumnName: 'id',
    },
  })
  public languages: Language[];

  @Column({ name: 'avatar_url', nullable: true, type: 'text' })
  public avatarUrl?: string;

  @OneToMany(
    type => Appointment,
    appointment => appointment.practitioner,
  )
  public appointments: Promise<Appointment[]>;

  @Column({
    name: 'country_code',
    type: 'text',
    default: COUNTRY_CODE.SouthAfrica,
    nullable: false,
  })
  public countryCode: string;

  @Column({
    type: 'boolean',
    name: 'accepted_terms',
    nullable: false,
    default: true,
  })
  @Index()
  public acceptedTerms: boolean;

  @OneToMany(
    type => Review,
    review => review.practitioner,
    { eager: false },
  )
  public reviews: Promise<Review[]>;

  @OneToMany(
    type => PractitionerEvent,
    calendarEvent => calendarEvent.practitioner,
    { eager: false },
  )
  public events: Promise<PractitionerEvent[]>;

  @OneToMany(
    type => PractitionerQualification,
    qualification => qualification.practitioner,
    { eager: false },
  )
  public qualifications: Promise<PractitionerQualification[]>;
}
export default Practitioner;
