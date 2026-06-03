import { PatientReport } from "./types";

export const INITIAL_REPORTS: PatientReport[] = [
  {
    id: "1876",
    boono: "2026",
    name: "MYKOLA VORONA",
    age: 44,
    gender: "Male",
    company: "UKRANIAN HELICOPTERS",
    passportNo: "FS879183",
    phone: "839180",
    doctor: "sadam adan Ahmed",
    resultDate: "2026-05-24",
    verified: true,
    token: "a3b8899c3a",
    tests: [
      { name: "HCV", result: "Negative", unit: "test", remark: "" },
      { name: "Hepatitis B Surface Antigen", result: "Negative", unit: "test", remark: "" },
      { name: "HIV Test", result: "Negative", unit: "test", remark: "" },
      { name: "TPHA", result: "Negative", unit: "test", remark: "" }
    ]
  },
  {
    id: "1932",
    boono: "2027",
    name: "SERGEY KOVALOV",
    age: 38,
    gender: "Male",
    company: "UKRANIAN HELICOPTERS",
    passportNo: "FM620941",
    phone: "839184",
    doctor: "sadam adan Ahmed",
    resultDate: "2026-05-25",
    verified: true,
    token: "b72c9183da",
    tests: [
      { name: "HCV", result: "Negative", unit: "test" },
      { name: "Hepatitis B Surface Antigen", result: "Negative", unit: "test" },
      { name: "HIV Test", result: "Negative", unit: "test" },
      { name: "TPHA", result: "Negative", unit: "test" }
    ]
  },
  {
    id: "2041",
    boono: "2028",
    name: "HALIMA ABDI NOOR",
    age: 29,
    gender: "Female",
    company: "UNSOM MOGADISHU",
    passportNo: "AM009281",
    phone: "0615891234",
    doctor: "Dr. Asha Omar",
    resultDate: "2026-05-26",
    verified: true,
    token: "c019d283fc",
    tests: [
      { name: "HCV", result: "Negative", unit: "test" },
      { name: "Hepatitis B Surface Antigen", result: "Negative", unit: "test" },
      { name: "HIV Test", result: "Negative", unit: "test" },
      { name: "TPHA", result: "Negative", unit: "test" }
    ]
  },
  {
    id: "2150",
    boono: "2029",
    name: "MAHAD DAHIR OMAR",
    age: 31,
    gender: "Male",
    company: "DARYEEL TECH SOLUTIONS",
    passportNo: "SO441092",
    phone: "+252 615289190",
    doctor: "Dr. Mohamed Elmi",
    resultDate: "2026-05-27",
    verified: true,
    token: "e49a102910",
    tests: [
      { name: "HCV", result: "Negative", unit: "test" },
      { name: "Hepatitis B Surface Antigen", result: "Negative", unit: "test" },
      { name: "HIV Test", result: "Negative", unit: "test" },
      { name: "TPHA", result: "Negative", unit: "test" }
    ]
  }
];
