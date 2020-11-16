import { ReviewsModule } from './reviews/reviews.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PractitionersModule } from './practitioners/practitioners.module';
import { UsersModule } from './users/users.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { MedicalAidsModule } from './medical_aids/medical_aids.module';
import {
  FirebaseAdminCoreModule,
  FIREBASE_ADMIN_INJECT,
} from '@tfarras/nestjs-firebase-admin';
import * as admin from 'firebase-admin';
import { PractitionerEventsModule } from './practitioner_events/practitioner_events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ envFilePath: '.env' }),
    DatabaseModule,
    FirebaseAdminCoreModule.forRootAsync({
      useFactory: () => ({
        credential: admin.credential.cert(
          process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH,
        ),
      }),
      name: FIREBASE_ADMIN_INJECT,
    }),
    AuthModule,
    MedicalAidsModule,
    UsersModule,
    PractitionersModule,
    AppointmentsModule,
    ReviewsModule,
    PractitionerEventsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
