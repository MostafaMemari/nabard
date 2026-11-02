export type DemoAccount = {
  id: string;
  name: string;
  roleLabel: string;
  mobile: string;
  password: string;
  home: string;
};

export const demoAccounts: DemoAccount[] = [
  { id: "admin-1", name: "حمیدرضا کاظمی", roleLabel: "سوپر ادمین", mobile: "09120000000", password: "admin1234", home: "/admin" },
  { id: "coach-1", name: "رضا محمدی", roleLabel: "مربی", mobile: "09350000000", password: "coach1234", home: "/coach" },
];

export const demoAdmin = { id: "admin-1", name: "حمیدرضا کاظمی", roleLabel: "مدیر استان" };
export const demoCoach = { id: "coach-1", name: "رضا محمدی", roleLabel: "مربی" };
