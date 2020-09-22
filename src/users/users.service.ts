import { FIREBASE_STORAGE_USERS_AVATARS_BUCKET } from './constants';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import User from './entities/user.entity';
import { COUNTRY_CODE } from './models/country-code.model';
import * as crypto from 'crypto';
import {
  FIREBASE_ADMIN_INJECT,
  FirebaseAdminSDK,
} from '@tfarras/nestjs-firebase-admin';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
  ) {}
  async create(
    firstName: string,
    lastName: string,
    email: string,
    countryCode: string,
    uid: string,
    picture?: string,
  ): Promise<User> {
    // We don't need to check if the user already exists as the unique constraint for the uid will fire off
    const newUser = this.userRepository.create({
      uid,
      firstName,
      lastName,
      email,
      countryCode,
      avatarUrl: picture,
    });
    try {
      return await this.userRepository.save(newUser);
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to execute the operation.',
      });
    }
  }

  async update(updatedUser: UpdateUserDto, uid: string) {
    const user = await this.getUserForUid(uid);
    if (!user) {
      throw new NotFoundException({ message: 'The user could not be found.' });
    }
    if (updatedUser.firstName.trim().length == 0) {
      throw new BadRequestException({
        message: 'The first name of the user cannot be empty',
      });
    }
    if (updatedUser.lastName.trim().length == 0) {
      throw new BadRequestException({
        message: 'The last name of the user cannot be empty',
      });
    }
    if (updatedUser.medicalAid && !(updatedUser.medicalAid in MEDICAL_AID)) {
      throw new BadRequestException({
        message:
          'The provided medical aid is not in the supported medical aid range',
      });
    }
    if (updatedUser.countryCode && !(updatedUser.countryCode in COUNTRY_CODE)) {
      throw new BadRequestException({
        message:
          'The provided country code is not in the supported country code list',
      });
    }
    if (!(updatedUser.medicalAid in MEDICAL_AID)) {
      throw new BadRequestException({
        message:
          'The provided medical aid does not exist in our medical aids list.',
      });
    }
    try {
      await this.userRepository.update(
        { uid: uid },
        {
          firstName: updatedUser.firstName?.trim(),
          lastName: updatedUser.lastName?.trim(),
          city: updatedUser.city?.trim(),
          address: updatedUser.address?.trim(),
          countryCode: updatedUser.countryCode,
          medicalAid: { id: updatedUser.medicalAid },
          medicalAidNumber: updatedUser.medicalAidNumber?.trim(),
          medicalAidPlan: updatedUser.medicalAidPlan?.trim(),
          zipCode: updatedUser.zipCode?.trim(),
          phone: updatedUser.phone?.trim(),
        },
      );
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Something went wrong while trying to execute the operation.',
      });
    }
  }

  async getUserForUid(uid: string): Promise<User | null> {
    return (
      (await this.userRepository
        .createQueryBuilder('user')
        .where('user.uid = :uid', { uid })
        .getOne()) ?? null
    );
  }

  // this will have to move to a file service at a later point
  async updateAvatar(
    dataBuffer: Buffer,
    uid: string,
    fileType: string,
  ): Promise<string> {
    const currentUser = await this.getUserForUid(uid);
    if (!currentUser) {
      throw new NotFoundException({ message: 'The user could not be found.' });
    }

    const md5UserUid = crypto
      .createHash('md5')
      .update(uid)
      .digest('hex');
    const folder = 'avatars';
    const fileName = `${folder}/${md5UserUid}`;

    const bucket = this.firebaseAdmin
      .storage()
      .bucket(FIREBASE_STORAGE_USERS_AVATARS_BUCKET);

    //TODO: Check file size requirements at some later point

    try {
      await bucket.deleteFiles({ prefix: fileName, force: true });
    } catch (error) {
      //Log this at a later point
    }

    const file = bucket.file(fileName);
    await file.save(dataBuffer, {
      gzip: true,
      contentType: fileType,
      public: true,
    });

    const url = (
      await file.getSignedUrl({
        expires: '31.12.2999',
        action: 'read',
      })
    )[0];

    await this.userRepository.update(
      { uid: uid },
      {
        avatarUrl: url,
      },
    );

    return url;
  }

  async deleteAvatar(uid: string) {
    const currentUser = await this.getUserForUid(uid);
    if (!currentUser) {
      throw new NotFoundException({ message: 'The user could not be found.' });
    }

    const md5UserUid = crypto
      .createHash('md5')
      .update(uid)
      .digest('hex');
    const folder = 'avatars';
    const fileName = `${folder}/${md5UserUid}`;

    const bucket = this.firebaseAdmin
      .storage()
      .bucket(FIREBASE_STORAGE_USERS_AVATARS_BUCKET);

    //TODO: Check file size requirements at some later point

    try {
      await bucket.deleteFiles({ prefix: fileName, force: true });
    } catch (error) {
      //Log this at a later point
    }

    await this.userRepository.update(
      { uid: uid },
      {
        avatarUrl: null,
      },
    );
  }

  async getUserIdForUid(uid: string): Promise<string | null> {
    return (
      (
        await this.userRepository.findOne({
          select: ['id'],
          where: { uid: uid },
        })
      )?.id ?? null
    );
  }
}
