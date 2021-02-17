import { NextPathologyCovidTestingCount } from './../common/covid-testing-types';
import User from 'src/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('covid_testing_request')
class CovidTestingRequest {
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

  @Column({ type: 'int', name: 'number_of_people' })
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

  @Column({ type: 'text', nullable: true, name: 'notes' })
  public notes?: string;

  @Column({
    type: 'jsonb',
    name: 'testing_types_count',
  })
  public testingTypesCount: NextPathologyCovidTestingCount;
}
export default CovidTestingRequest;
