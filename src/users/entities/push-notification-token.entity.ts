import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import User from './user.entity';

@Entity('push_notification_token')
class PushNotificationToken {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Index()
  @Column({ type: 'text', unique: true, nullable: false })
  public token: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  public createdAt: Date;

  @Column({ type: 'text', nullable: false })
  public platform: string;

  @ManyToOne(
    type => User,
    user => user.pushNotificationTokens,
    { nullable: false, eager: false },
  )
  @JoinColumn({ name: 'user_id' })
  public user: Promise<User>;

  @Column({ type: 'bigint', name: 'user_id' })
  public userId: string;
}
export default PushNotificationToken;
