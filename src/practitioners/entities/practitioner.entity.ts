import { Language } from './language.entity';
import { PractitionerSchedule } from './practitioner-schedule.entity';
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
import { COUNTRY_CODE } from 'src/shared/country-code.dto';
import Review from 'src/reviews/entities/review.entity';

@Entity('practitioner')
@Check(`"consultation_pricing_range" % 100 = 0`)
@Check(`"rating" >= 0 AND "rating" <= 5`)
export class Practitioner {
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

  @Column({ type: 'text', nullable: true })
  public description?: string;

  @Column({ type: 'text', nullable: true })
  public address?: string;

  @Column({
    name: 'appointment_time_slot',
    type: 'smallint',
    default: 30,
    nullable: false,
    unsigned: true,
  })
  public appointmentTimeSlot: number;

  @Column({
    name: 'consultation_pricing_range',
    type: 'smallint',
    nullable: true,
    unsigned: true,
  })
  public consultationPricingRange: number;

  @ManyToMany(type => MedicalAid, { eager: true })
  @JoinTable({
    name: 'practitioner_medical_aids',
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

  @OneToOne(type => User, { nullable: false, eager: false })
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

  @Column({
    type: 'geography',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  @Index({ spatial: true })
  public location?: Geometry;

  @Column({ type: 'text', nullable: true })
  public directions?: string;

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

  @Column({ type: 'real', default: 0, nullable: false, unsigned: true })
  public rating: number;

  @OneToMany(
    type => PractitionerSchedule,
    schedule => schedule.practitioner,
    { eager: true },
  )
  public schedules: PractitionerSchedule[];

  @Column({
    type: 'by',
    unsigned: true,
    default: GENDER.Other,
    nullable: false,
  })
  public gender: GENDER;

  @ManyToMany(type => Language, { nullable: false, eager: true })
  @JoinTable({
    name: 'practitioner_languages',
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
}
