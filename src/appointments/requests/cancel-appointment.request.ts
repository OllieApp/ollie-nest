import { IsNotEmpty, MaxLength } from 'class-validator';

export class CancelAppointmentRequest {
  @IsNotEmpty()
  @MaxLength(300)
  public cancellationReason: string;
}
