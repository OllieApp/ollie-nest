import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Module } from '@nestjs/common';
import User from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailSenderModule } from 'src/integrations/email-sender/email-sender.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailSenderModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
