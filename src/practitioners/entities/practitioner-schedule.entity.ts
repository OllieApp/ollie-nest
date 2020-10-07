import { WEEK_DAY } from '../dto/weekday.model';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Practitioner } from './practitioner.entity';

@Entity('practitioner_schedule')
export class PractitionerSchedule {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({
    name: 'day_of_week',
    nullable: false,
    type: 'smallint',
    unsigned: true,
  })
  public dayOfWeek: WEEK_DAY;

  @Column({
    name: 'start_time',
    nullable: false,
    type: 'time with time zone',
  })
  public startTime: Date;

  @Column({
    name: 'end_time',
    nullable: false,
    type: 'time with time zone',
  })
  public endTime: Date;

  @ManyToOne(
    type => Practitioner,
    practitioner => practitioner.schedules,
    {
      nullable: false,
    },
  )
  @JoinColumn({ name: 'practitioner_id' })
  public practitioner: Promise<Practitioner>;

  @Column({ type: 'bigint', name: 'practitioner_id' })
  public practitionerId: string;
}
