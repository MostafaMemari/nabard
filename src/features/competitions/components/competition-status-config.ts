export const competitionStatusConfig = {
  publish: {
    title: "انتشار مسابقه",
    description: "با انتشار مسابقه، مربیان می توانند هنرجویان خود را ثبت نام کنند. اطلاعات مسابقه پس از شروع ثبت نام قابل تغییر نیست",
    confirmLabel: "انتشار",
    destructive: false,
    status: "PUBLISHED",
    successMessage: "مسابقه منتشر شد",
  },
  cancel: {
    title: "لغو مسابقه",
    description: "با لغو مسابقه، از فهرست مسابقات باز مربیان حذف می شود و ثبت نام جدید ممکن نخواهد بود. این اقدام قابل بازگشت نیست",
    confirmLabel: "لغو مسابقه",
    destructive: true,
    status: "CANCELED",
    successMessage: "مسابقه لغو شد",
  },
} as const;

export type CompetitionPendingAction = keyof typeof competitionStatusConfig;
