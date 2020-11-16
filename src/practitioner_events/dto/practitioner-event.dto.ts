export class PractitionerEventDto {
  public id: string;

  public title: string;

  public description?: string;

  public location?: string;

  public practitionerId: string;

  public hexColor: string;

  public createdAt: Date;

  public startTime: Date;

  public endTime: Date;

  public isConfirmed: boolean;

  public isAllDay: boolean;

  constructor(partial: Partial<PractitionerEventDto>) {
    Object.assign(this, partial);
  }
}
