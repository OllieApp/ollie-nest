import { Exclude, Expose } from 'class-transformer';
import { Location } from 'src/shared/dtos/location.dto';

@Exclude()
export class AddressDto {
  @Expose()
  public line1: string;
  @Expose()
  public line2: string;
  @Expose()
  public suburb: string;
  @Expose()
  public city: string;
  @Expose()
  public postalCode: string;
  @Expose()
  public stateProvinceCounty: string;
  @Expose()
  public location?: Location;
  @Expose()
  public countryCode: string;
}
