export interface LabTest {
  name: string;
  result: "Negative" | "Positive" | "Reactive" | "Non-Reactive";
  unit: string;
  remark?: string;
}

export interface PatientReport {
  id: string; // Patient ID
  boono?: string; // Boono number
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  company: string;
  passportNo: string;
  phone: string;
  doctor: string;
  resultDate: string;
  verified: boolean;
  tests: LabTest[];
  token?: string; // Verification token for external verification link
}
