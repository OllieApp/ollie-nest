import Practitioner from 'src/practitioners/entities/practitioner.entity';
import Appointment from '../../appointments/entities/appointment.entity';
import Review from 'src/reviews/entities/review.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import MedicalAid from '../../medical_aids/entities/medical_aid.entity';
import PractitionerEvent from 'src/practitioner_events/entities/practitioner_event.entity';
import PushNotificationToken from './push-notification-token.entity';

@Entity('user')
class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ name: 'first_name', nullable: false, type: 'varchar', length: 150 })
  public firstName: string;

  @Column({ name: 'last_name', nullable: false, type: 'varchar', length: 100 })
  public lastName: string;

  @Column({ type: 'varchar', length: 250 })
  public email: string;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  public phone: string;

  @Index()
  @Column({ unique: true, nullable: false, type: 'text' })
  public uid: string;

  @Column({ name: 'avatar_url', nullable: true, type: 'text' })
  public avatarUrl?: string;

  @Column({ name: 'country_code', type: 'text' })
  public countryCode: string;

  @Column({ name: 'zip_code', nullable: true, type: 'text' })
  public zipCode?: string;

  @Column({ nullable: true, type: 'text' })
  public city?: string;

  @Column({ nullable: true, type: 'text' })
  public address?: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

  @Column({ name: 'medical_aid_number', nullable: true, type: 'text' })
  public medicalAidNumber?: string;

  @Column({ name: 'medical_aid_plan', nullable: true, type: 'text' })
  public medicalAidPlan?: string;

  @ManyToOne(
    type => MedicalAid,
    medicalAid => medicalAid.users,
    {
      nullable: true,
    },
  )
  @JoinColumn({ name: 'medical_aid_id' })
  medicalAid?: MedicalAid;

  @Column({ type: 'int', name: 'medical_aid_id', nullable: true })
  public medicalAidId?: number;

  @Column({
    type: 'boolean',
    name: 'is_email_verified',
    nullable: false,
    default: false,
  })
  @Index()
  public isEmailVerified: boolean;

  @Column({
    type: 'boolean',
    name: 'is_phone_verified',
    nullable: false,
    default: false,
  })
  @Index()
  public isPhoneVerified: boolean;

  @Column({
    type: 'boolean',
    name: 'is_active',
    nullable: false,
    default: true,
  })
  @Index()
  public isActive: boolean;

  @Column({
    type: 'boolean',
    name: 'accepted_terms',
    nullable: false,
    default: true,
  })
  @Index()
  public acceptedTerms: boolean;

  @OneToMany(
    type => Appointment,
    appointment => appointment.user,
    { eager: false },
  )
  public appointments: Promise<Appointment[]>;

  @OneToMany(
    type => Appointment,
    appointment => appointment.updatedBy,
    { eager: false },
  )
  public updatedAppointments: Promise<Appointment[]>;

  @OneToMany(
    type => Review,
    review => review.user,
    { eager: false },
  )
  public reviews: Promise<Review[]>;

  @ManyToMany(type => Practitioner, { eager: false })
  @JoinTable({
    name: 'user_favorite_practitioner',
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'practitioner_id',
      referencedColumnName: 'id',
    },
  })
  @JoinColumn({ name: 'practitioner_id' })
  public favoritePractitioners: Promise<Practitioner[]>;

  @OneToMany(
    type => Practitioner,
    practitioner => practitioner.createdBy,
    { nullable: false, eager: false },
  )
  public createdPractitioners: Promise<Practitioner[]>;

  @OneToMany(
    type => PractitionerEvent,
    calendarEvent => calendarEvent.createdBy,
    { eager: false },
  )
  public createdPractitionerEvents: Promise<PractitionerEvent[]>;

  @OneToMany(
    type => PractitionerEvent,
    calendarEvent => calendarEvent.updatedBy,
    { eager: false },
  )
  public updatedPractitionerEvents: Promise<PractitionerEvent[]>;

  @OneToMany(
    type => PushNotificationToken,
    pntoken => pntoken.user,
    { eager: false },
  )
  public pushNotificationTokens: Promise<PushNotificationToken[]>;

  // create notifications packages, like basic notifications, extra notifications, promotions notifications
  @Column({ type: 'boolean', name: 'app_notifications_enabled' })
  public appNotificationsEnabled: boolean;
}

export default User;
