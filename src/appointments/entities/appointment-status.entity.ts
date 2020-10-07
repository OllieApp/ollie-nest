import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import Appointment from './appointment.entity';

@Entity('appointment_status')
class AppointmentStatus {
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Column({ nullable: false, type: 'text', unique: true })
  public name: string;

  @OneToMany(
    type => Appointment,
    appointment => appointment.status,
  )
  public appointments: Promise<Appointment[]>;
}
export default AppointmentStatus;
