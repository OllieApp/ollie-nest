import User from '../../users/entities/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import Practitioner from 'src/practitioners/entities/practitioner.entity';

@Check(`"wait_time_rating" >= 0 AND "wait_time_rating" <= 5`)
@Check(`"bedside_manner_rating" >= 0 AND "bedside_manner_rating" <= 5`)
@Check(`"overall_rating" >= 0 AND "overall_rating" <= 5`)
@Entity('review')
class Review {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  public updatedAt: Date;

  @Column({
    name: 'is_anonymous',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  public isAnonymous: boolean;

  @Column({
    name: 'wait_time_rating',
    type: 'real',
    default: 0,
    nullable: false,
    unsigned: true,
  })
  public waitTimeRating: number;

  @Column({
    name: 'bedside_manner_rating',
    type: 'real',
    default: 0,
    nullable: false,
    unsigned: true,
  })
  public bedsideMannerRating: number;

  @Column({
    name: 'overall_rating',
    type: 'real',
    default: 0,
    nullable: false,
    unsigned: true,
  })
  public overallRating: number;

  @Column({ name: 'review', type: 'text', nullable: true, length: 3000 })
  public review?: string;

  @Column({ name: 'title', type: 'text', nullable: true, length: 200 })
  public title: string;

  @Column({
    name: 'is_doctor_recommended',
    type: 'boolean',
    nullable: false,
    default: true,
  })
  public isDoctorRecommended: boolean;

  @ManyToOne(
    type => User,
    user => user.reviews,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({ name: 'user_id' })
  public user: Promise<User>;

  @Column({ type: 'bigint', name: 'user_id' })
  public userId: string;

  @ManyToOne(
    type => Practitioner,
    practitioner => practitioner.reviews,
    {
      nullable: false,
      eager: false,
    },
  )
  @JoinColumn({ name: 'practitioner_id' })
  public practitioner: Promise<Practitioner>;

  @Column({ type: 'bigint', name: 'practitioner_id' })
  public practitionerId: string;
}
export default Review;
