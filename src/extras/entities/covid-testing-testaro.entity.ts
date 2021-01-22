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

@Entity('covid_testing_testaro_request')
class CovidTestingTestaroRequest {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ type: 'varchar', length: 250, name: 'full_name' })
  public fullName: string;

  @Column({ type: 'varchar', length: 250 })
  public email: string;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  public phone: string;

  @Column({ type: 'varchar', length: 250, name: 'full_address' })
  public fullAddress: string;

  @Column({ type: 'int' })
  public numberOfPeople: number;

  @Column({ type: 'timestamp with time zone' })
  public date: Date;

  @ManyToOne(
    type => User,
    user => user.appointments,
    {
      nullable: false,
      eager: false,
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

  @Column({ type: 'text', nullable: true, name: 'user_notes' })
  public notes?: string;
}
export default CovidTestingTestaroRequest;
