export interface CovidNextPathTestRequest {
  fullName: string;
  fullAddress: string;
  email: string;
  phoneNumber: string;
  numberOfPeople: string;
  notes?: string;
  createdDate: Date;
  date: Date;
  pctCount: number;
  antigenCount: number;
  antibodyCount: number;
}
