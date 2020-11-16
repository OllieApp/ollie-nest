import Practitioner from 'src/practitioners/entities/practitioner.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import User from 'src/users/entities/user.entity';

@Entity('practitioner_event')
class PractitionerEvent {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ name: 'title', nullable: false, type: 'varchar', length: 150 })
  public title: string;

  @Column({
    name: 'description',
    nullable: true,
    type: 'varchar',
    length: 1500,
  })
  public description?: string;

  @Column({ name: 'location', nullable: true, type: 'varchar', length: 250 })
  public location?: string;

  @ManyToOne(
    type => Practitioner,
    practitioner => practitioner.events,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({ name: 'practitioner_id' })
  public practitioner: Promise<Practitioner>;

  @Column({ type: 'bigint', name: 'practitioner_id' })
  public practitionerId: string;

  @Column({
    name: 'hex_color',
    type: 'varchar',
    length: 10,
    default: '#EDED85',
    nullable: false,
  })
  public hexColor: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

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
    type => User,
    user => user.updatedPractitionerEvents,
    {
      nullable: true,
      eager: false,
    },
  )
  @JoinColumn({ name: 'updated_by' })
  public updatedBy?: Promise<User>;

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  public updatedById?: string;

  @ManyToOne(
    type => User,
    user => user.createdPractitionerEvents,
    { nullable: false, eager: false },
  )
  @JoinColumn({ name: 'created_by' })
  public createdBy: Promise<User>;

  @Column({ type: 'bigint', name: 'created_by' })
  public createdById: string;

  @Index()
  @Column({
    name: 'is_recurring',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  public isRecurring: boolean;

  @Index()
  @Column({
    name: 'is_confirmed',
    type: 'boolean',
    default: true,
    nullable: false,
  })
  public isConfirmed: boolean;

  @Column({
    name: 'is_all_day',
    type: 'boolean',
    default: false,
    nullable: false,
  })
  public isAllDay: boolean;

  @Column({ name: 'rrule', nullable: true, type: 'text' })
  public rrule?: string;
}

export default PractitionerEvent;
