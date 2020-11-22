import { IsNotEmpty, MaxLength } from 'class-validator';

export class CreateUserRequest {
  @IsNotEmpty()
  @MaxLength(150)
  firstName: string;

  @IsNotEmpty()
  @MaxLength(150)
  lastName: string;
}
