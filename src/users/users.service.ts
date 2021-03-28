import Practitioner from 'src/practitioners/entities/practitioner.entity';
import { FIREBASE_STORAGE_USERS_AVATARS_BUCKET } from './constants';
import { UpdateUserRequest } from './requests/update-user.request';
import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { COUNTRY_CODE } from '../shared/models/country-code.model';
import * as crypto from 'crypto';
import {
  FIREBASE_ADMIN_INJECT,
  FirebaseAdminSDK,
} from '@tfarras/nestjs-firebase-admin';
import { MEDICAL_AID } from 'src/medical_aids/models/medical_aid.model';
import { InjectRepository } from '@nestjs/typeorm';
import User from './entities/user.entity';
import { emailValidationPattern } from 'src/constants';
import { EmailSenderService } from 'src/integrations/email-sender/email-sender.service';

@Injectable()
export class UsersService {
  constructor(
    @Inject(FIREBASE_ADMIN_INJECT) private firebaseAdmin: FirebaseAdminSDK,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailSenderService,
  ) {}
  private readonly logger = new Logger(UsersService.name);

  async create(
    firstName: string,
    lastName: string,
    email: string,
    countryCode: string,
    uid: string,
    picture?: string,
    phoneNumber?: string,
  ): Promise<User> {
    let user: User | null = null;

    try {
      user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.uid = :uid', { uid })
        .getOne();
    } catch (error) {
      this.logger.error(
        'Something went wrong while checking for any existing users with this identity.',
        error,
      );
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while checking for any existing users with this identity.',
        ],
      });
    }

    if (user) {
      return user;
    }
    if (!firstName || firstName.trim().length == 0) {
      throw new BadRequestException({
        message: ['The first name of the user cannot be empty.'],
      });
    }
    if (!lastName || lastName.trim().length == 0) {
      throw new BadRequestException({
        message: ['The last name of the user cannot be empty.'],
      });
    }

    if (!emailValidationPattern.test(email)) {
      throw new BadRequestException({
        message: ['The email of the user is invalid.'],
      });
    }

    if (
      !countryCode ||
      !Object.values(COUNTRY_CODE).find(e => e == countryCode)
    ) {
      throw new BadRequestException({
        message: [
          'The provided country code for the user is not in the supported country code list.',
        ],
      });
    }

    // We don't need to check if the user already exists as the unique constraint for the uid will fire off
    user = this.userRepository.create({
      uid,
      firstName,
      lastName,
      email,
      countryCode,
      avatarUrl: picture,
      phone: phoneNumber,
    });

    const userCustomClaims = {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'user',
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-user-id': uid,
      },
    };

    // set Hasura custom claims for access to graphQL based on role
    await this.firebaseAdmin.auth().setCustomUserClaims(uid, userCustomClaims);

    await this.firebaseAdmin.auth().updateUser(uid, {
      displayName: firstName + ' ' + lastName,
    });

    try {
      user = await this.userRepository.save(user);
    } catch (error) {
      this.logger.error(
        'Something went wrong while trying to save the user',
        error,
      );
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to execute the operation.',
        ],
      });
    }

    try {
      this.emailService.sendWelcomeEmail(email);
    } catch (error) {
      this.logger.error(
        'Something went wrong while trying to send the welcome email to the user.',
        error,
      );
    }
    return user;
  }

  async update(request: UpdateUserRequest, uid: string) {
    const user = await this.getUserForUid(uid);
    const isRequestEmpty = !Object.values(request).some(x => x !== null);

    if (Object.values(request).length < 1 && isRequestEmpty) {
      return;
    }

    if (!user) {
      throw new NotFoundException({
        message: ['The user could not be found.'],
      });
    }
    if (request.firstName?.trim().length < 2) {
      throw new BadRequestException({
        message: ['The first name of the user cannot be empty.'],
      });
    }
    if (request.lastName?.trim().length < 2) {
      throw new BadRequestException({
        message: ['The last name of the user cannot be empty.'],
      });
    }
    if (request.medicalAid && !(request.medicalAid in MEDICAL_AID)) {
      throw new BadRequestException({
        message: [
          'The provided medical aid does not exist in our medical aids list.',
        ],
      });
    }
    if (
      request.countryCode?.trim() &&
      !Object.values(COUNTRY_CODE).find(e => e == request.countryCode)
    ) {
      throw new BadRequestException({
        message: [
          'The provided country code is not in the supported country code list.',
        ],
      });
    }
    try {
      const removeNullValues = (obj: any) => {
        Object.keys(obj).forEach(key => obj[key] == null && delete obj[key]);
      };

      const updateObject = {
        firstName: request.firstName?.trim() ?? undefined,
        lastName: request.lastName?.trim() ?? undefined,
        city: request.city?.trim() ?? undefined,
        address: request.address?.trim() ?? undefined,
        countryCode: request.countryCode?.trim() ?? undefined,
        medicalAidNumber: request.medicalAidNumber?.trim() ?? undefined,
        medicalAidPlan: request.medicalAidPlan?.trim() ?? undefined,
        medicalAidId: request.medicalAid ?? undefined,
        zipCode: request.zipCode?.trim() ?? undefined,
        phone: request.phone?.trim() ?? undefined,
      };

      removeNullValues(updateObject);

      await this.userRepository.update({ uid: uid }, updateObject);
      if (updateObject.firstName || updateObject.lastName) {
        this.firebaseAdmin.auth().updateUser(uid, {
          displayName: `${updateObject.firstName ??
            user.firstName} ${updateObject.lastName ?? user.lastName}`,
        });
      }
    } catch (error) {
      this.logger.error(
        'Something went wrong while trying to update the user.',
        error,
      );
      throw new InternalServerErrorException({
        message: [
          'Something went wrong while trying to execute the operation.',
        ],
      });
    }
  }

  async getUserForUid(uid: string): Promise<User> {
    let user: User | null = null;
    try {
      user = await this.userRepository
        .createQueryBuilder('user')
        .where('user.uid = :uid', { uid })
        .getOne();
    } catch (error) {
      throw new InternalServerErrorException({
        message: ['Something went wrong when trying to fetch the user.'],
      });
    }
    if (!user) {
      throw new NotFoundException({ message: ['The user was not found.'] });
    }
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .getOne();
    if (!user) {
      return null;
    }
    return user;
  }

  // this will have to move to a file service at a later point
  async updateAvatar(
    dataBuffer: Buffer,
    uid: string,
    fileType: string,
  ): Promise<string> {
    const currentUser = await this.getUserForUid(uid);
    if (!currentUser) {
      throw new NotFoundException({
        message: ['The user could not be found.'],
      });
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
      this.logger.error(
        'Something went wrong while trying to clean up the other avatars of the user.',
        error,
      );
    }

    const file = bucket.file(`${fileName}_${Date.now()}`);
    try {
      await file.save(dataBuffer.buffer, {
        gzip: true,
        contentType: fileType,
        public: true,
      });
    } catch (error) {
      this.logger.error(
        'Something went wrong while trying to save the avatar of the user.',
        error,
      );
    }
    const url = (
      await file.getSignedUrl({
        expires: new Date(2999, 12, 31),
        action: 'read',
      })
    )[0].split('?')[0];

    await this.userRepository.update(
      { uid: uid },
      {
        avatarUrl: url,
      },
    );

    // update the firebase user to have the same photo
    this.firebaseAdmin.auth().updateUser(uid, {
      photoURL: url,
    });

    return url;
  }

  async deleteAvatar(uid: string) {
    const currentUser = await this.getUserForUid(uid);
    if (!currentUser) {
      throw new NotFoundException({
        message: ['The user could not be found.'],
      });
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

  async getUserIdForUid(uid: string): Promise<string> {
    const user = await this.getUserForUid(uid);
    return user.id;
  }

  async addPractitionerToFavorites(userId: string, practitionerId: string) {
    try {
      const user = await this.userRepository.findOne(userId);
      const practitioners = await user.favoritePractitioners;
      if (practitioners.length >= 25) {
        throw new BadRequestException({
          message: [
            'The limit for favorite practitioners has already been reached.',
          ],
        });
      }
      const favPractitioner = new Practitioner();
      favPractitioner.id = practitionerId;
      user.favoritePractitioners = Promise.resolve([
        ...practitioners,
        favPractitioner,
      ]);
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException({
        message: ["Could not add the practitioner to user's favorites."],
      });
    }
  }

  async removePractitionerFromFavorites(
    userId: string,
    practitionerId: string,
  ) {
    try {
      const user = await this.userRepository.findOne(userId);
      const practitioners = await user.favoritePractitioners;
      if (practitioners.length == 0) {
        return;
      }
      const filteredPractitioners = practitioners.filter(
        p => p.id !== practitionerId,
      );
      user.favoritePractitioners = Promise.resolve(filteredPractitioners);
      await this.userRepository.save(user);
    } catch (error) {
      throw new InternalServerErrorException({
        message: ["Could not remove the practitioner from user's favorites."],
      });
    }
  }
}
