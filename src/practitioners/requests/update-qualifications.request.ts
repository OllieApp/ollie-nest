import { IsArray, IsNotEmpty } from 'class-validator';
import { PractitionerQualificationDto } from '../dto/practitioner-qualification.dto';

export class UpdateQualificationsRequest {
  @IsNotEmpty()
  @IsArray()
  qualifications: PractitionerQualificationDto[];
}
