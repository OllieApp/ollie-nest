import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import admin from 'firebase-admin';
import * as rateLimit from 'express-rate-limit';

async function bootstrap() {
  admin.initializeApp({
    credential: admin.credential.cert(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH,
    ),
    databaseURL: 'https://ollie-5ea31.firebaseio.com',
  });
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('v1');
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 120, // limit each IP to 100 requests per windowMs
    }),
  );
  app.enableCors();
  await app.listen(80);
}
bootstrap();
