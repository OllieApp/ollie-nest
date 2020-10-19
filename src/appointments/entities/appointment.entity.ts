import Practitioner from 'src/practitioners/entities/practitioner.entity';
import Review from 'src/reviews/entities/review.entity';
import User from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import AppointmentStatus from './appointment-status.entity';

@Entity('appointment')
class Appointment {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @ManyToOne(
    type => Practitioner,
    practitioner => practitioner.appointments,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'practitioner_id' })
  public practitioner: Promise<Practitioner>;

  @Column({ type: 'bigint', name: 'practitioner_id' })
  public practitionerId: string;

  @ManyToOne(
    type => User,
    user => user.appointments,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'user_id' })
  public user: Promise<User>;

  @Column({ type: 'bigint', name: 'user_id' })
  public userId: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  public createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
    nullable: false,
  })
  public updatedAt: Date;

  @OneToOne(type => User, { nullable: false, eager: false })
  @JoinColumn({ name: 'updated_by' })
  public updatedBy: Promise<User>;

  @Column({ name: 'updated_by', type: 'bigint', nullable: false })
  public updatedById: string;

  @Column({ type: 'text', nullable: true, name: 'user_notes' })
  public userNotes?: string;

  @Index()
  @Column({
    type: 'timestamp with time zone',
    name: 'start_time',
    nullable: false,
  })
  public startTime: Date;

  @Index()
  @Column({
    type: 'timestamp with time zone',
    name: 'end_time',
    nullable: false,
  })
  public endTime: Date;

  @ManyToOne(
    type => AppointmentStatus,
    appointmentStatus => appointmentStatus.appointments,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({ name: 'status_id' })
  public status: Promise<AppointmentStatus>;

  @Column({ type: 'smallint', name: 'status_id', nullable: false })
  public statusId: number;

  @Column({
    name: 'is_virtual',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  public isVirtual: boolean;

  @Column({
    name: 'cancelled_by_practitioner',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  public cancelledByPractitioner: boolean;

  @Column({
    name: 'cancellation_reason',
    type: 'text',
    nullable: true,
  })
  public cancellationReason?: string;

  @Column({
    type: 'timestamp with time zone',
    name: 'cancellation_time',
    nullable: true,
  })
  public cancellationTime?: Date;

  @OneToOne(type => Review, { nullable: true, eager: false })
  @JoinColumn({ name: 'review_id' })
  public review?: Promise<Review>;

  @Column({ type: 'bigint', name: 'review_id', nullable: true })
  public reviewId?: string;

  @Column({ type: 'text', name: 'doctor_video_url', nullable: true })
  public doctorVideoUrl?: string;

  @Column({ type: 'text', name: 'user_video_url', nullable: true })
  public userVideoUrl?: string;

  @Column({ type: 'text', name: 'virtual_meeting_id', nullable: true })
  public virtualMeetingId?: string;
}
export default Appointment;
