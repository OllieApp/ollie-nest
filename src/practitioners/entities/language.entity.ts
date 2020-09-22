import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('language')
export class Language {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ type: 'text', nullable: false, unique: true })
  public name: string;
}
