import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Practitioner } from './practitioner.entity';

@Entity('practitioner_category')
export class PractitionerCategory {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @OneToMany(
    type => Practitioner,
    practitioner => practitioner.category,
  )
  practitioners: Promise<Practitioner[]>;
}
