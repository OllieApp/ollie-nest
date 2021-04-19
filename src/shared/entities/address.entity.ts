import { Geometry } from 'geojson';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { COUNTRY_CODE } from 'src/shared/models/country-code.model';

@Entity('address')
class Address {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  public id: string;

  @Column({ type: 'text', nullable: false, name: 'line_1' })
  public line1: string;

  @Column({ type: 'text', nullable: false, name: 'line_2', default: '' })
  public line2: string;

  @Column({ type: 'text', nullable: false, default: '' })
  public suburb: string;

  @Column({ type: 'text', nullable: false })
  public city: string;

  @Column({ type: 'text', nullable: false, name: 'postal_code' })
  public postalCode: string;

  @Column({ type: 'text', nullable: false, name: 'state_province_county' })
  public stateProvinceCounty: string;

  @Column({
    type: 'geography',
    srid: 4326,
    nullable: true,
    spatialFeatureType: 'Point',
  })
  @Index({ spatial: true })
  public location?: Geometry;

  @Column({
    name: 'country_code',
    type: 'text',
    default: COUNTRY_CODE.SouthAfrica,
    nullable: false,
  })
  public countryCode: string;
}
export default Address;
