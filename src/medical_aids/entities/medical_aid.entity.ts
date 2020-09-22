import {
  Entity,
  PrimaryColumn,
  Column,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from '../../users/entities/user.entity';

@Entity('medical_aid')
class MedicalAid {
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Column()
  public name: string;

  @OneToMany(
    type => User,
    user => user.medicalAid,
  )
  users: Promise<User[]>;
}

export default MedicalAid;
