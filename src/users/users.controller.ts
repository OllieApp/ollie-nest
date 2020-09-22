import { PHOTO_ALLOWED_EXTENSIONS } from './constants';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  HttpException,
  HttpStatus,
  Post,
  Body,
  ForbiddenException,
  Put,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import User from './entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { FirebaseUser } from '@tfarras/nestjs-firebase-auth';
import { FileInterceptor } from '@nestjs/platform-express/multer/interceptors/file.interceptor';

@Controller('/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':uid')
  @UseGuards(AuthGuard('firebase'))
  async get(@Request() req, @Param('uid') uid: string): Promise<User> {
    const firebaseUser = req.user as FirebaseUser;
    if (uid != firebaseUser.uid) {
      throw new ForbiddenException();
    }
    const user = await this.usersService.getUserForUid(firebaseUser.uid);
    if (user) {
      return user;
    }
    throw new HttpException('No content', HttpStatus.NO_CONTENT);
  }

  @Post()
  @UseGuards(AuthGuard('firebase'))
  async create(
    @Request() req,
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    const firebaseUser = req.user as FirebaseUser;
    return await this.usersService.create(
      createUserDto.firstName,
      createUserDto.lastName,
      firebaseUser.email,
      'ZA',
      firebaseUser.uid,
      firebaseUser.picture,
    );
  }

  @Put()
  @UseGuards(AuthGuard('firebase'))
  async update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
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
