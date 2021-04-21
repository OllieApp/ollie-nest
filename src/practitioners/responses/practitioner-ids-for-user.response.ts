import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class PractitionerIdsForUserResponse {
  @Expose()
  public ids: Array<string>;

  constructor(ids: Array<string>) {
    this.ids = ids;
  }
}
