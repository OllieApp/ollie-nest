export interface CovidNextPathTestPayload {
  fullName: string;
  fullAddress: string;
  email: string;
  phoneNumber: string;
  numberOfPeople: number;
  notes?: string;
  createdDate: string;
  date: string;
  testingTypesCount: NextPathTestingTypesCount;
}

interface NextPathTestingTypesCount {
  pcrCount: number;
  antigenCount: number;
  antibodyCount: number;
}
