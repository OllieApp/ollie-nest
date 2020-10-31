import { UserDto } from './dto/user.dto';
import { UpdateUserRequest } from './requests/update-user.request';
import { CreateUserRequest } from './requests/create-user.request';
import { UsersService } from './users.service';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
  Patch,
  Param,
  UnauthorizedException,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseUser } from '@tfarras/nestjs-firebase-auth';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { PHOTO_ALLOWED_EXTENSIONS } from 'src/constants';
import { COUNTRY_CODE } from '../shared/country-code.dto';

@Controller('/users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('firebase'))
  async get(@Request() req): Promise<UserDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    return new UserDto({
      id: user.id,
      address: user.address,
      avatarUrl: user.avatarUrl,
      city: user.city,
      countryCode: user.countryCode,
      email: user.email,
      firstName: user.firstName,
      isActive: user.isActive,
      lastName: user.lastName,
      phone: user.phone,
      zipCode: user.zipCode,
      medicalAidPlan: user.medicalAidPlan,
      medicalAidNumber: user.medicalAidNumber,
      medicalAid: user.medicalAidId,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
    });
  }

  @Post()
  @UseGuards(AuthGuard('firebase'))
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserRequest,
  ): Promise<UserDto> {
    const firebaseUser = req.user as FirebaseUser;
    const createdUser = await this.usersService.create(
      createUserDto.firstName,
      createUserDto.lastName,
      firebaseUser.email,
      COUNTRY_CODE.SouthAfrica,
      firebaseUser.uid,
      firebaseUser.picture,
    );

    return new UserDto({
      ...createdUser,
      medicalAid: createdUser.medicalAidId,
    });
  }

  // Might be a good idea to return the updated user
  @Patch()
  @UseGuards(AuthGuard('firebase'))
  async update(@Request() req, @Body() updateUserDto: UpdateUserRequest) {
    const firebaseUser = req.user as FirebaseUser;
    await this.usersService.update(updateUserDto, firebaseUser.uid);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // keep images size < 5 MB
      },
    }),
  )
  @UseGuards(AuthGuard('firebase'))
  async uploadFile(@Request() req, @UploadedFile() file): Promise<string> {
    const firebaseUser = req.user as FirebaseUser;
    if (!req.file) {
      this.logger.error(
        'The image to be uploaded was missing from the request.',
      );
      throw new BadRequestException({
        message: 'The image to be uploaded was missing from the request.',
      });
    }
    if (!PHOTO_ALLOWED_EXTENSIONS.test(file.mimetype)) {
      this.logger.error(
        `Only the following types are supported: JPG, JPEG and PNG. The one used was ${file.mimetype}`,
      );
      throw new BadRequestException({
        message: 'Only the following types are supported: JPG, JPEG and PNG.',
      });
    }

    return await this.usersService.updateAvatar(
      file,
      firebaseUser.uid,
      file.mimetype,
    );
  }

  @Post('/:userId/favorite-practitioners/:practitionerId')
  @UseGuards(AuthGuard('firebase'))
  async addFavoritePractitioner(
    @Request() req,
    @Param('userId') userId: string,
    @Param('practitionerId') practitionerId: string,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    if (user.id != userId) {
      throw new ForbiddenException({
        message: 'Cannot add favorites to this user.',
      });
    }
    await this.usersService.addPractitionerToFavorites(user.id, practitionerId);
  }

  @Delete('/:userId/favorite-practitioners/:practitionerId')
  @UseGuards(AuthGuard('firebase'))
  async removeFavoritePractitioner(
    @Request() req,
    @Param('userId') userId: string,
    @Param('practitionerId') practitionerId: string,
  ) {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    if (user.id != userId) {
      throw new ForbiddenException({
        message: 'Cannot add favorites to this user.',
      });
    }
    await this.usersService.removePractitionerFromFavorites(
      user.id,
      practitionerId,
    );
  }
}
