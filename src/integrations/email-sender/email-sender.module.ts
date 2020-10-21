import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SendGridModule } from '@ntegral/nestjs-sendgrid/dist/sendgrid.module';
import { EmailSenderService } from './email-sender.service';

@Module({
  imports: [
    SendGridModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (cfg: ConfigService) => ({
        apiKey: cfg.get('SENDGRID_API_TOKEN'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [EmailSenderService],
  exports: [EmailSenderService],
})
export class EmailSenderModule {}
