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
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseUser } from '@tfarras/nestjs-firebase-auth';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';
import { PHOTO_ALLOWED_EXTENSIONS } from 'src/constants';
import { COUNTRY_CODE } from './dto/country-code.dto';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard('firebase'))
  async get(@Request() req): Promise<UserDto> {
    const firebaseUser = req.user as FirebaseUser;
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    return UserDto.fromEntity(user);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
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

    return UserDto.fromEntity(createdUser);
  }

  @Put()
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
      throw new BadRequestException({
        message: 'The image to be uploaded was missing from the request.',
      });
    }
    if (!PHOTO_ALLOWED_EXTENSIONS.test(file.mimetype)) {
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
}
