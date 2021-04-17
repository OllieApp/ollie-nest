import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import Practitioner from './practitioner.entity';

@Entity('practitioner_qualification')
class PractitionerQualification {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @ManyToOne(
    type => Practitioner,
    practitioner => practitioner.qualifications,
    { nullable: false },
  )
  @JoinColumn({ name: 'practitioner_id' })
  public practitioner: Promise<Practitioner>;

  @Column({ type: 'bigint', name: 'practitioner_id' })
  public practitionerId: string;

  @Column({ type: 'text', nullable: false })
  public title: string;

  @Column({ type: 'date', nullable: false, name: 'from_date' })
  public fromDate: Date;

  @Column({ type: 'date', nullable: true, name: 'to_date' })
  public toDate?: Date;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
    name: 'is_current',
  })
  public isCurrent: boolean;
}
export default PractitionerQualification;
