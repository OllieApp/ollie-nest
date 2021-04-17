import { PractitionerQualificationDto } from './../dto/practitioner-qualification.dto';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PractitionerQualificationsResponse {
  @Expose()
  public qualifications: Array<PractitionerQualificationDto>;

  constructor(qualifications: Array<PractitionerQualificationDto>) {
    this.qualifications = qualifications;
  }
}
