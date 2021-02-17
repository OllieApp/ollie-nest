export interface CovidNextPathTestRequest {
  fullName: string;
  fullAddress: string;
  email: string;
  phoneNumber: string;
  numberOfPeople: number;
  notes?: string;
  createdDate: Date;
  date: Date;
  pctCount: number;
  antigenCount: number;
  antibodyCount: number;
}
