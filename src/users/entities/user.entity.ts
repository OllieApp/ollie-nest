import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import MedicalAid from '../../medical_aids/entities/medical_aid.entity';

@Entity('user')
class User {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ name: 'first_name', nullable: false, type: 'text' })
  public firstName: string;

  @Column({ name: 'last_name', nullable: false, type: 'text' })
  public lastName: string;

  @Column({ type: 'text' })
  public email: string;

  @Column({ nullable: true, type: 'text' })
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
}

export default User;
