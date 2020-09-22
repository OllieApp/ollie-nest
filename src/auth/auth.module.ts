import { FirebaseStrategy } from './firebase.strategy';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule],
  providers: [FirebaseStrategy],
  exports: [FirebaseStrategy],
})
export class AuthModule {}
