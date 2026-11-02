import type {
  CompetitionLevel,
  CompetitionStatus,
  CountyChangeStatus,
  Discipline,
  Gender,
  PaymentStatus,
  Province,
  RegistrationStatus,
  Role,
} from "../../src/generated/enums";

function nationalCode(base: number): string {
  const digits = String(base).padStart(9, "0").slice(0, 9);
  const sum = digits.split("").reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;

  return `${digits}${remainder < 2 ? remainder : 11 - remainder}`;
}

export type UserSeed = {
  id: string;
  mobile: string;
  fullName: string;
  nationalCode: string | null;
  role: Role;
  gender: Gender | null;
  province: Province;
  isActive: boolean;
  countyName: string | null;
  createdAt: string;
};

const userRows: Array<{ fullName: string; role: Role; active?: boolean; countyName?: string; gender?: Gender }> = [
  { fullName: "حمیدرضا کاظمی", role: "ADMIN" },
  { fullName: "مریم صادقی", role: "ADMIN" },
  { fullName: "علی رستمی", role: "ADMIN" },
  { fullName: "رضا محمدی", role: "COACH", gender: "MALE", countyName: "تهران" },
  { fullName: "سعید احمدی", role: "COACH", gender: "FEMALE", countyName: "تهران" },
  { fullName: "مهدی کریمی", role: "COACH", gender: "MALE", countyName: "ری" },
  { fullName: "حسین موسوی", role: "COACH", gender: "FEMALE", active: false, countyName: "ری" },
  { fullName: "امیر حسین زاده", role: "COACH", gender: "MALE", countyName: "ری" },
  { fullName: "محمد رضایی", role: "COACH", gender: "FEMALE", countyName: "شمیرانات" },
  { fullName: "بابک نیک پور", role: "COACH", gender: "MALE", active: false, countyName: "اسلامشهر" },
  { fullName: "کامران شریفی", role: "COACH", gender: "FEMALE", countyName: "پردیس" },
];

export const demoUsers: UserSeed[] = userRows.map((row, index) => {
  const roleIndex = userRows.slice(0, index).filter((item) => item.role === row.role).length + 1;
  const prefix = row.role === "ADMIN" ? "admin" : "coach";

  return {
    id: `${prefix}-${roleIndex}`,
    mobile: `0912${String(3100000 + index * 137).padStart(7, "0")}`,
    fullName: row.fullName,
    nationalCode: nationalCode(100000000 + index * 137),
    role: row.role,
    gender: row.gender ?? null,
    province: "TEHRAN",
    isActive: row.active ?? true,
    countyName: row.countyName ?? null,
    createdAt: "2026-07-15T08:30:00.000Z",
  };
});

export type StudentSeed = {
  id: string;
  fullName: string;
  gender: Gender;
  nationalCode: string;
  birthDate: string;
  weightKg: number | null;
  beltId: string;
  coachId: string;
  createdAt: string;
};

const maleFirstNames = [
  "امیرعلی",
  "محمد",
  "علی",
  "رضا",
  "حسین",
  "مهدی",
  "سعید",
  "پارسا",
  "آرش",
  "سینا",
  "کیان",
  "پویا",
  "نیما",
  "بردیا",
  "سامان",
  "یاسین",
];

const femaleFirstNames = [
  "زهرا",
  "فاطمه",
  "مریم",
  "سارا",
  "نازنین",
  "ریحانه",
  "مهسا",
  "آیدا",
  "شیرین",
  "نگار",
  "هستی",
  "آرمیتا",
  "درسا",
  "رویا",
  "سوگند",
  "الناز",
];

const lastNames = [
  "محمدی",
  "احمدی",
  "کریمی",
  "موسوی",
  "حسینی",
  "رضایی",
  "صادقی",
  "نیک پور",
  "شریفی",
  "کاظمی",
  "رستمی",
  "مرادی",
  "جعفری",
  "قاسمی",
  "اکبری",
  "بهرامی",
  "سلطانی",
  "طاهری",
  "فرهادی",
  "زمانی",
  "نوری",
  "عزیزی",
  "کوهستانی",
  "یزدانی",
];

const birthYears = [2019, 2016, 2013, 2010, 2007, 2000, 1982];
const beltByCategory = ["belt-white", "belt-yellow", "belt-green", "belt-blue", "belt-red", "belt-poom_1", "belt-dan_1"];
const weightBase = [22, 28, 36, 48, 58, 66, 72];

function birthDate(index: number, categoryIndex: number): string {
  const year = birthYears[categoryIndex];
  const month = (index % 12) + 1;
  const day = (index % 27) + 1;

  return new Date(Date.UTC(year, month - 1, day)).toISOString();
}

export const demoStudents: StudentSeed[] = Array.from({ length: 60 }, (_, index) => {
  // students inherit the gender of their demo coach (coach-N: N odd = MALE, N even = FEMALE)
  const gender: Gender = (index % 8) % 2 === 0 ? "MALE" : "FEMALE";
  const categoryIndex = index % 7;
  const nameIndex = Math.floor(index / 2);
  const firstName =
    gender === "MALE" ? maleFirstNames[nameIndex % maleFirstNames.length] : femaleFirstNames[nameIndex % femaleFirstNames.length];
  const lastName = lastNames[nameIndex % lastNames.length];

  return {
    id: `student-${index + 1}`,
    fullName: `${firstName} ${lastName}`,
    gender,
    nationalCode: nationalCode(200000000 + index * 173),
    birthDate: birthDate(index, categoryIndex),
    weightKg: Number((weightBase[categoryIndex] - (gender === "FEMALE" ? 4 : 0) + (index % 5) * 0.5).toFixed(1)),
    beltId: beltByCategory[categoryIndex],
    coachId: `coach-${(index % 8) + 1}`,
    createdAt: `2026-08-${String((index % 28) + 1).padStart(2, "0")}T09:15:00.000Z`,
  };
});

export type CompetitionSeed = {
  id: string;
  title: string;
  province: Province;
  level: CompetitionLevel;
  countyNames: string[];
  discipline: Discipline;
  gender: Gender;
  ageCategoryId: string;
  beltIds: string[];
  feePerStudent: string;
  payeeCardNumber: string;
  payeeCardHolder: string;
  registrationDeadline: string;
  eventDate: string;
  status: CompetitionStatus;
  createdAt: string;
  updatedAt: string;
};

const payeeCardHolder = "فدراسیون تکواندو استان تهران";

export const demoCompetitions: CompetitionSeed[] = [
  {
    id: "comp-1",
    title: "مسابقات قهرمانی استان تهران",
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyNames: [],
    discipline: "KYORUGI",
    gender: "MALE",
    ageCategoryId: "senior",
    beltIds: ["belt-blue", "belt-red", "belt-poom_1", "belt-dan_1"],
    feePerStudent: "3500000",
    payeeCardNumber: "6104337812345678",
    payeeCardHolder,
    registrationDeadline: "2026-11-20T20:30:00.000Z",
    eventDate: "2026-12-05T08:00:00.000Z",
    status: "PUBLISHED",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-20T12:15:00.000Z",
  },
  {
    id: "comp-2",
    title: "مسابقات نونهالان پسر شهرستان ری",
    province: "TEHRAN",
    level: "COUNTY",
    countyNames: ["ری"],
    discipline: "KYORUGI",
    gender: "MALE",
    ageCategoryId: "youth",
    beltIds: ["belt-white", "belt-yellow", "belt-green"],
    feePerStudent: "2500000",
    payeeCardNumber: "6104337812345679",
    payeeCardHolder,
    registrationDeadline: "2026-11-10T20:30:00.000Z",
    eventDate: "2026-11-28T08:00:00.000Z",
    status: "PUBLISHED",
    createdAt: "2026-09-05T09:30:00.000Z",
    updatedAt: "2026-09-25T14:00:00.000Z",
  },
  {
    id: "comp-3",
    title: "مسابقات نوجوانان دختر",
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyNames: [],
    discipline: "KYORUGI",
    gender: "FEMALE",
    ageCategoryId: "cadet",
    beltIds: ["belt-yellow", "belt-green", "belt-blue"],
    feePerStudent: "2500000",
    payeeCardNumber: "6104337812345680",
    payeeCardHolder,
    registrationDeadline: "2026-10-01T20:30:00.000Z",
    eventDate: "2026-10-20T08:00:00.000Z",
    status: "PUBLISHED",
    createdAt: "2026-08-10T11:20:00.000Z",
    updatedAt: "2026-08-30T16:45:00.000Z",
  },
  {
    id: "comp-4",
    title: "مسابقات پومسه بزرگسالان",
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyNames: [],
    discipline: "POOMSAE",
    gender: "FEMALE",
    ageCategoryId: "senior",
    beltIds: ["belt-white", "belt-yellow", "belt-green", "belt-blue", "belt-poom_1", "belt-poom_2"],
    feePerStudent: "2000000",
    payeeCardNumber: "6104337812345681",
    payeeCardHolder,
    registrationDeadline: "2026-12-01T20:30:00.000Z",
    eventDate: "2026-12-18T08:00:00.000Z",
    status: "DRAFT",
    createdAt: "2026-10-12T13:10:00.000Z",
    updatedAt: "2026-10-12T13:10:00.000Z",
  },
  {
    id: "comp-5",
    title: "مسابقات جوانان پسر",
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyNames: [],
    discipline: "KYORUGI",
    gender: "MALE",
    ageCategoryId: "junior",
    beltIds: ["belt-green", "belt-blue", "belt-red"],
    feePerStudent: "3000000",
    payeeCardNumber: "6104337812345682",
    payeeCardHolder,
    registrationDeadline: "2026-09-15T20:30:00.000Z",
    eventDate: "2026-10-02T08:00:00.000Z",
    status: "CANCELED",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-09-10T09:40:00.000Z",
  },
  {
    id: "comp-6",
    title: "مسابقات پیشکسوتان",
    province: "TEHRAN",
    level: "PROVINCIAL",
    countyNames: [],
    discipline: "POOMSAE",
    gender: "MALE",
    ageCategoryId: "ultra",
    beltIds: ["belt-poom_2", "belt-dan_1", "belt-dan_2", "belt-dan_3"],
    feePerStudent: "2000000",
    payeeCardNumber: "6104337812345683",
    payeeCardHolder,
    registrationDeadline: "2026-12-10T20:30:00.000Z",
    eventDate: "2026-12-26T08:00:00.000Z",
    status: "DRAFT",
    createdAt: "2026-10-18T15:25:00.000Z",
    updatedAt: "2026-10-18T15:25:00.000Z",
  },
  {
    id: "comp-7",
    title: "مسابقات کیوروگی شهرستان تهران",
    province: "TEHRAN",
    level: "COUNTY",
    countyNames: ["تهران", "اسلامشهر"],
    discipline: "KYORUGI",
    gender: "FEMALE",
    ageCategoryId: "young",
    beltIds: ["belt-green", "belt-blue", "belt-red"],
    feePerStudent: "3000000",
    payeeCardNumber: "6104337812345684",
    payeeCardHolder,
    registrationDeadline: "2026-11-25T20:30:00.000Z",
    eventDate: "2026-12-12T08:00:00.000Z",
    status: "PUBLISHED",
    createdAt: "2026-10-20T09:00:00.000Z",
    updatedAt: "2026-10-21T10:00:00.000Z",
  },
];

export type CountyChangeRequestSeed = {
  id: string;
  coachId: string;
  fromCountyName: string;
  toCountyName: string;
  status: CountyChangeStatus;
  note: string | null;
  decided: boolean;
  createdAt: string;
};

export const demoCountyChangeRequests: CountyChangeRequestSeed[] = [
  {
    id: "ccr-1",
    coachId: "coach-8",
    fromCountyName: "پردیس",
    toCountyName: "تهران",
    status: "PENDING",
    note: null,
    decided: false,
    createdAt: "2026-10-28T09:40:00.000Z",
  },
  {
    id: "ccr-2",
    coachId: "coach-6",
    fromCountyName: "تهران",
    toCountyName: "شمیرانات",
    status: "APPROVED",
    note: null,
    decided: true,
    createdAt: "2026-10-12T14:20:00.000Z",
  },
  {
    id: "ccr-3",
    coachId: "coach-5",
    fromCountyName: "ری",
    toCountyName: "تهران",
    status: "REJECTED",
    note: "تغییر شهرستان در فاصله یک ماه تا پایان مسابقات امکان پذیر نیست.",
    decided: true,
    createdAt: "2026-10-05T11:10:00.000Z",
  },
];

export type PaymentSeed = {
  id: string;
  competitionId: string;
  coachId: string;
  amount: string;
  receiptKey: string | null;
  status: PaymentStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export const demoPayments: PaymentSeed[] = [
  {
    id: "pay-1",
    competitionId: "comp-1",
    coachId: "coach-1",
    amount: "7000000",
    receiptKey: "receipts/pay-1.jpg",
    status: "PENDING",
    note: null,
    createdAt: "2026-10-20T09:10:00.000Z",
    updatedAt: "2026-10-20T09:10:00.000Z",
  },
  {
    id: "pay-2",
    competitionId: "comp-1",
    coachId: "coach-2",
    amount: "3500000",
    receiptKey: "receipts/pay-2.jpg",
    status: "PENDING",
    note: null,
    createdAt: "2026-10-21T11:35:00.000Z",
    updatedAt: "2026-10-21T11:35:00.000Z",
  },
  {
    id: "pay-3",
    competitionId: "comp-2",
    coachId: "coach-3",
    amount: "5000000",
    receiptKey: "receipts/pay-3.jpg",
    status: "CONFIRMED",
    note: null,
    createdAt: "2026-10-18T14:05:00.000Z",
    updatedAt: "2026-10-19T08:20:00.000Z",
  },
  {
    id: "pay-4",
    competitionId: "comp-2",
    coachId: "coach-4",
    amount: "2500000",
    receiptKey: null,
    status: "PENDING",
    note: null,
    createdAt: "2026-10-23T16:40:00.000Z",
    updatedAt: "2026-10-23T16:40:00.000Z",
  },
  {
    id: "pay-5",
    competitionId: "comp-2",
    coachId: "coach-5",
    amount: "7500000",
    receiptKey: "receipts/pay-5.jpg",
    status: "CONFIRMED",
    note: null,
    createdAt: "2026-10-17T10:15:00.000Z",
    updatedAt: "2026-10-18T09:30:00.000Z",
  },
  {
    id: "pay-6",
    competitionId: "comp-3",
    coachId: "coach-6",
    amount: "5000000",
    receiptKey: "receipts/pay-6.jpg",
    status: "REJECTED",
    note: "مبلغ واریزی با تعداد هنرجویان مطابقت ندارد.",
    createdAt: "2026-09-26T12:00:00.000Z",
    updatedAt: "2026-09-28T10:45:00.000Z",
  },
  {
    id: "pay-7",
    competitionId: "comp-3",
    coachId: "coach-7",
    amount: "2500000",
    receiptKey: "receipts/pay-7.jpg",
    status: "CONFIRMED",
    note: null,
    createdAt: "2026-09-24T08:55:00.000Z",
    updatedAt: "2026-09-25T13:10:00.000Z",
  },
  {
    id: "pay-8",
    competitionId: "comp-1",
    coachId: "coach-8",
    amount: "3500000",
    receiptKey: "receipts/pay-8.jpg",
    status: "REJECTED",
    note: "تصویر رسید ناخوانا است. لطفا دوباره بارگذاری کنید.",
    createdAt: "2026-10-19T15:20:00.000Z",
    updatedAt: "2026-10-22T11:05:00.000Z",
  },
  {
    id: "pay-9",
    competitionId: "comp-5",
    coachId: "coach-1",
    amount: "6000000",
    receiptKey: "receipts/pay-9.jpg",
    status: "PENDING",
    note: null,
    createdAt: "2026-09-08T09:45:00.000Z",
    updatedAt: "2026-09-08T09:45:00.000Z",
  },
  {
    id: "pay-10",
    competitionId: "comp-4",
    coachId: "coach-2",
    amount: "4000000",
    receiptKey: "receipts/pay-10.jpg",
    status: "CONFIRMED",
    note: null,
    createdAt: "2026-10-14T17:30:00.000Z",
    updatedAt: "2026-10-15T09:00:00.000Z",
  },
  {
    id: "pay-11",
    competitionId: "comp-6",
    coachId: "coach-3",
    amount: "2000000",
    receiptKey: null,
    status: "PENDING",
    note: null,
    createdAt: "2026-10-25T10:05:00.000Z",
    updatedAt: "2026-10-25T10:05:00.000Z",
  },
  {
    id: "pay-12",
    competitionId: "comp-2",
    coachId: "coach-4",
    amount: "2500000",
    receiptKey: "receipts/pay-12.jpg",
    status: "REJECTED",
    note: "شماره پیگیری پرداخت یافت نشد.",
    createdAt: "2026-10-11T13:50:00.000Z",
    updatedAt: "2026-10-13T08:25:00.000Z",
  },
];

export type RegistrationSeed = {
  id: string;
  competitionId: string;
  studentId: string;
  coachId: string;
  paymentId: string;
  weightClassId: string | null;
  status: RegistrationStatus;
  note: string | null;
  createdAt: string;
};

const registrationRows: Array<{ paymentId: string; competitionId: string; coachId: string; count: number; status: RegistrationStatus }> = [
  { paymentId: "pay-1", competitionId: "comp-1", coachId: "coach-1", count: 3, status: "PENDING" },
  { paymentId: "pay-2", competitionId: "comp-1", coachId: "coach-2", count: 3, status: "PENDING" },
  { paymentId: "pay-3", competitionId: "comp-2", coachId: "coach-3", count: 3, status: "APPROVED" },
  { paymentId: "pay-4", competitionId: "comp-2", coachId: "coach-4", count: 3, status: "PENDING" },
  { paymentId: "pay-5", competitionId: "comp-2", coachId: "coach-5", count: 3, status: "APPROVED" },
  { paymentId: "pay-6", competitionId: "comp-3", coachId: "coach-6", count: 3, status: "REJECTED" },
  { paymentId: "pay-7", competitionId: "comp-3", coachId: "coach-7", count: 2, status: "APPROVED" },
  { paymentId: "pay-8", competitionId: "comp-1", coachId: "coach-8", count: 3, status: "REJECTED" },
  { paymentId: "pay-9", competitionId: "comp-5", coachId: "coach-1", count: 2, status: "PENDING" },
  { paymentId: "pay-10", competitionId: "comp-4", coachId: "coach-2", count: 2, status: "APPROVED" },
  { paymentId: "pay-11", competitionId: "comp-6", coachId: "coach-3", count: 2, status: "PENDING" },
  { paymentId: "pay-12", competitionId: "comp-2", coachId: "coach-4", count: 2, status: "REJECTED" },
];

const competitionCategory: Record<string, string | null> = {
  "comp-1": "senior",
  "comp-2": "youth",
  "comp-3": "cadet",
  "comp-4": null,
  "comp-5": "junior",
  "comp-6": null,
};

const rejectionNotes = ["مدارک ناقص است.", "وزن اعلام شده با رده وزنی مطابقت ندارد.", "کد ملی هنرجو با مدارک ارسالی یکسان نیست."];

const coachOffsets = new Map<string, number>();

export const demoRegistrations: RegistrationSeed[] = registrationRows.flatMap((row) => {
  const groupKey = `${row.coachId}-${row.competitionId}`;
  const offset = coachOffsets.get(groupKey) ?? 0;
  const coachNumber = Number(row.coachId.replace("coach-", ""));
  const category = competitionCategory[row.competitionId];

  coachOffsets.set(groupKey, offset + row.count);

  return Array.from({ length: row.count }, (_, index) => {
    const studentNumber = coachNumber + 8 * (offset + index);
    const gender = studentNumber % 2 === 1 ? "male" : "female";
    const createdAt = `2026-10-${String(((offset + index) % 25) + 1).padStart(2, "0")}T09:00:00.000Z`;

    return {
      id: `reg-${row.paymentId}-${index + 1}`,
      competitionId: row.competitionId,
      studentId: `student-${studentNumber}`,
      coachId: row.coachId,
      paymentId: row.paymentId,
      weightClassId: category ? `wc-${category}-${gender}-${(index % 3) + 1}` : null,
      status: row.status,
      note: row.status === "REJECTED" ? rejectionNotes[(offset + index) % rejectionNotes.length] : null,
      createdAt,
    };
  });
});
