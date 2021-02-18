import { IsNumber } from 'class-validator';

export class NextPathologyTestingTypesCount {
  @IsNumber()
  public pcrCount: number;

  @IsNumber()
  public antigenCount: number;

  @IsNumber()
  public antibodyCount: number;
}
