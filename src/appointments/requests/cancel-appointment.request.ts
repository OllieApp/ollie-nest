import { IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CancelAppointmentRequest {
  @IsNotEmpty()
  @MaxLength(300)
  @MinLength(40)
  public cancellationReason: string;
}
