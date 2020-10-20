import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import admin from 'firebase-admin';
import * as rateLimit from 'express-rate-limit';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';

async function bootstrap() {
  admin.initializeApp({
    credential: admin.credential.cert(
      process.env.GOOGLE_APPLICATION_CREDENTIALS_PATH,
    ),
    databaseURL: 'https://ollie-5ea31.firebaseio.com',
  });
  const app = await NestFactory.create(AppModule);

  const options = new DocumentBuilder()
    .setTitle('Ollie API docs')
    .setDescription('The Ollie API description')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  app.setGlobalPrefix('v1');
  app.use(
    rateLimit({
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 120, // limit each IP to 100 requests per windowMs
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors();
  await app.listen(80);
}
bootstrap();
