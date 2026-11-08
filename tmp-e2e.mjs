import { readFileSync } from "node:fs";

const BASE = "https://nabard-kohl.vercel.app";

const state = {};
const results = [];

async function api(method, path, { cookie, body, form } = {}) {
  const headers = {};
  if (cookie) headers.cookie = `nabard_session=${cookie}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  const res = await fetch(BASE + path, { method, headers, body: form ?? (body === undefined ? undefined : JSON.stringify(body)) });
  let envelope = null;
  try {
    envelope = await res.json();
  } catch {}

  const setCookie = res.headers.get("set-cookie");
  let session = null;
  if (setCookie && setCookie.includes("nabard_session=")) {
    session = setCookie.split("nabard_session=")[1].split(";")[0];
  }

  return { status: res.status, ok: envelope?.ok === true, data: envelope?.data ?? null, error: envelope?.error ?? null, session };
}

function record(name, status, info) {
  results.push({ name, status, info });
  console.log(`${status === "OK" ? "PASS" : "FAIL"} ${name}${info ? ` :: ${info}` : ""}`);
}

async function step(name, run) {
  try {
    const info = await run();
    record(name, "OK", typeof info === "string" ? info : "");
  } catch (error) {
    record(name, "FAIL", error instanceof Error ? error.message : String(error));
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function expectApi(name, run, wantStatus, pick) {
  const res = await run();
  assert(res.status === wantStatus, `HTTP ${res.status} (expected ${wantStatus}) ${res.error ? JSON.stringify(res.error) : ""}`);
  record(name, "OK", "");
  return pick ? pick(res.data) : res.data;
}

async function main() {
  const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

  await step("super: real login", async () => {
    const res = await api("POST", "/api/v1/auth/login", { body: { mobile: "09120000000", password: process.env.SUPER_PASSWORD } });
    assert(res.status === 200 && res.session, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.superCookie = res.session;
  });

  const superToken = () => state.superCookie;

  await step("super: create belts", async () => {
    const belts = [
      { code: "white", label: "سفید", level: 1 },
      { code: "yellow", label: "زرد", level: 2 },
      { code: "green", label: "سبز", level: 3 },
      { code: "blue", label: "آبی", level: 4 },
    ];
    state.belts = {};
    for (const belt of belts) {
      const res = await api("POST", "/api/v1/belts", { cookie: superToken(), body: { ...belt, rankType: "COLOR" } });
      assert(res.status === 201 || res.status === 200, `belt ${belt.label}: HTTP ${res.status} ${JSON.stringify(res.error)}`);
      state.belts[belt.label] = res.data.id;
    }

    return Object.keys(state.belts).join(",");
  });

  await step("super: create age category", async () => {
    const res = await api("POST", "/api/v1/age-categories", {
      cookie: superToken(),
      body: { label: "نوجوان آزمون", startDate: "2012-01-01T00:00:00.000Z", endDate: "2014-12-31T00:00:00.000Z" },
    });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.ageCategoryId = res.data.id;
  });

  await step("super: create weight class set", async () => {
    const res = await api("PUT", "/api/v1/weight-class-sets", {
      cookie: superToken(),
      body: {
        ageCategoryId: state.ageCategoryId,
        gender: "MALE",
        rows: [
          { label: "-33", minWeightKg: 0, maxWeightKg: 33, excludeMin: false, excludeMax: true },
          { label: "-37", minWeightKg: 33, maxWeightKg: 37, excludeMin: false, excludeMax: true },
          { label: "+37", minWeightKg: 37, maxWeightKg: 90, excludeMin: false, excludeMax: false },
        ],
      },
    });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
  });

  await step("super: create province admin", async () => {
    const res = await api("POST", "/api/v1/admins", {
      cookie: superToken(),
      body: { fullName: "ادمین آزمون", mobile: "09120000001", initialPassword: "Tst-Admin-1234", province: "TEHRAN" },
    });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
  });

  await step("admin: real login", async () => {
    const res = await api("POST", "/api/v1/auth/login", { body: { mobile: "09120000001", password: "Tst-Admin-1234" } });
    assert(res.status === 200 && res.session, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.adminCookie = res.session;
  });

  await step("admin: create county", async () => {
    const res = await api("POST", "/api/v1/counties", { cookie: state.adminCookie, body: { name: "شهرستان آزمون" } });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.countyId = res.data.id;
  });

  await step("admin: create coach", async () => {
    const res = await api("POST", "/api/v1/coaches", {
      cookie: state.adminCookie,
      body: { fullName: "مربی آزمون", mobile: "09120000002", nationalCode: "0012345678", initialPassword: "Tst-Coach-1234", countyId: state.countyId, gender: "MALE" },
    });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.coachId = res.data.id;
  });

  await step("coach: real login", async () => {
    const res = await api("POST", "/api/v1/auth/login", { body: { mobile: "09120000002", password: "Tst-Coach-1234" } });
    assert(res.status === 200 && res.session, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.coachCookie = res.session;
  });

  await step("coach: create 4 students", async () => {
    const students = [
      { fullName: "ورزشکار همخوان", nationalCode: "1111111111" },
      { fullName: "ورزشکار جابجا", nationalCode: "2222222222" },
      { fullName: "ورزشکار خارج", nationalCode: "3333333333" },
      { fullName: "ورزشکار معلق", nationalCode: "4444444444" },
    ];
    state.studentIds = [];
    for (const student of students) {
      const res = await api("POST", "/api/v1/students", {
        cookie: state.coachCookie,
        body: { ...student, birthDate: "2013-05-10T00:00:00.000Z", insuranceDate: "", tkdBankChargeDate: "" },
      });
      assert(res.status === 201 || res.status === 200, `${student.fullName}: HTTP ${res.status} ${JSON.stringify(res.error)}`);
      state.studentIds.push(res.data.id);
    }

    assert(state.studentIds.length === 4, `created ${state.studentIds.length}`);
  });

  await step("admin: assign green belt to students", async () => {
    assert(state.studentIds?.length === 4, `students missing: ${state.studentIds?.length ?? 0}`);
    for (const studentId of state.studentIds) {
      const res = await api("PATCH", `/api/v1/students/${studentId}`, { cookie: state.adminCookie, body: { beltId: state.belts["سبز"] } });
      assert(res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    }
  });

  await step("admin: approve student profiles", async () => {
    for (const studentId of state.studentIds) {
      const res = await api("POST", `/api/v1/students/${studentId}/approve`, { cookie: state.adminCookie });
      assert(res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    }
  });

  await step("admin: create competition", async () => {
    const res = await api("POST", "/api/v1/competitions", {
      cookie: state.adminCookie,
      body: {
        title: "مسابقه آزمون وزن کشی",
        discipline: "KYORUGI",
        gender: "MALE",
        ageCategoryId: state.ageCategoryId,
        beltIds: [state.belts["زرد"], state.belts["آبی"]],
        level: "PROVINCIAL",
        feePerStudent: "500000",
        payeeCardNumber: "6037999999999999",
        payeeCardHolder: "ادمین آزمون",
        registrationDeadline: future(2),
        eventDate: future(5),
      },
    });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.competitionId = res.data.id;
  });

  await step("admin: publish competition", async () => {
    const res = await api("POST", `/api/v1/competitions/${state.competitionId}/publish`, { cookie: state.adminCookie });
    assert(res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
  });

  await step("coach: register 4 students with receipt", async () => {
    const form = new FormData();
    for (const studentId of state.studentIds) form.append("studentIds", studentId);
    form.append("weights", JSON.stringify(Object.fromEntries(state.studentIds.map((id) => [id, 35]))));
    const bytes = readFileSync("public/receipts/receipt-sample.png");
    form.append("receipt", new Blob([bytes], { type: "image/png" }), "receipt.png");

    const res = await api("POST", `/api/v1/competitions/${state.competitionId}/registrations`, { cookie: state.coachCookie, form });
    assert(res.status === 201 || res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    state.paymentId = res.data.payment.id;
    state.registrations = res.data.registrations;
    assert(state.registrations.length === 4, `expected 4 registrations, got ${state.registrations.length}`);
  });

  await step("admin: confirm payment", async () => {
    const res = await api("POST", `/api/v1/payments/${state.paymentId}/confirm`, { cookie: state.adminCookie });
    assert(res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
  });

  await step("admin: approve 3 of 4 registrations", async () => {
    for (const registration of state.registrations.slice(0, 3)) {
      const res = await api("POST", `/api/v1/registrations/${registration.id}/approve`, { cookie: state.adminCookie });
      assert(res.status === 200, `HTTP ${res.status} ${JSON.stringify(res.error)}`);
    }

    state.approved = state.registrations.slice(0, 3).map((r) => r.id);
    state.pendingId = state.registrations[3].id;
  });

  const eventDay = () => api("GET", `/api/v1/competitions/${state.competitionId}/event-day`, { cookie: state.adminCookie });

  await step("event-day: initial list", async () => {
    const data = await expectApi("event-day initial", () => eventDay(), 200, (envelope) => envelope);
    assert(data.rows.length === 3, `expected 3 rows, got ${data.rows.length}`);
    assert(data.summary.approved === 3 && data.summary.weighed === 0 && data.summary.checkedIn === 0, `summary ${JSON.stringify(data.summary)}`);
    state.rows = data.rows;
  });

  const approved = state.approved ?? [];
  const [r0, r1, r2] = approved;

  await step("event-day: weigh r0 in registered class -> MATCH", async () => {
    const data = await expectApi("weigh match", () => api("POST", `/api/v1/registrations/${r0}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 35 } }), 200, (envelope) => envelope);
    assert(data.weighInVerdict === "MATCH", `verdict ${data.weighInVerdict}`);
    assert(data.weighInKg === 35, `weight ${data.weighInKg}`);
  });

  await step("event-day: weigh r1 into another class -> MOVED", async () => {
    const data = await expectApi("weigh moved", () => api("POST", `/api/v1/registrations/${r1}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 40 } }), 200, (envelope) => envelope);
    assert(data.weighInVerdict === "MOVED", `verdict ${data.weighInVerdict}`);
    assert(data.weightClassLabel === "+37", `label ${data.weightClassLabel}`);
  });

  await step("event-day: weigh r2 outside every class -> OUT_OF_WEIGHT", async () => {
    const data = await expectApi("weigh out", () => api("POST", `/api/v1/registrations/${r2}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 95 } }), 200, (envelope) => envelope);
    assert(data.weighInVerdict === "OUT_OF_WEIGHT", `verdict ${data.weighInVerdict}`);
    assert(data.weightClassLabel === "-37", `label ${data.weightClassLabel}`);
  });

  await step("event-day: re-weigh r2 -> MOVED then MATCH", async () => {
    const moved = await api("POST", `/api/v1/registrations/${r2}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 40 } });
    assert(moved.status === 200 && moved.data.weighInVerdict === "MOVED", `moved: HTTP ${moved.status} ${JSON.stringify(moved.data)}`);

    const matched = await api("POST", `/api/v1/registrations/${r2}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 40 } });
    assert(matched.status === 200 && matched.data.weighInVerdict === "MATCH", `match: HTTP ${matched.status} ${JSON.stringify(matched.data)}`);
  });

  await step("event-day: weigh pending registration -> 409", async () => {
    const res = await api("POST", `/api/v1/registrations/${state.pendingId}/weigh-in`, { cookie: state.adminCookie, body: { weightKg: 35 } });
    assert(res.status === 409, `HTTP ${res.status}`);
  });

  await step("event-day: check-in on and off", async () => {
    const on = await api("POST", `/api/v1/registrations/${r0}/check-in`, { cookie: state.adminCookie, body: { checkedIn: true } });
    assert(on.status === 200 && on.data.checkInAt, `on: HTTP ${on.status} ${JSON.stringify(on.data)}`);

    const off = await api("POST", `/api/v1/registrations/${r0}/check-in`, { cookie: state.adminCookie, body: { checkedIn: false } });
    assert(off.status === 200 && off.data.checkInAt === null, `off: HTTP ${off.status} ${JSON.stringify(off.data)}`);

    const second = await api("POST", `/api/v1/registrations/${r1}/check-in`, { cookie: state.adminCookie, body: { checkedIn: true } });
    assert(second.status === 200, `second: HTTP ${second.status}`);
  });

  await step("event-day: summary after actions", async () => {
    const data = await expectApi("event-day summary", () => eventDay(), 200, (envelope) => envelope);
    assert(data.summary.match === 2 && data.summary.moved === 1 && data.summary.weighed === 3, `summary ${JSON.stringify(data.summary)}`);
    assert(data.summary.checkedIn === 1, `checkedIn ${data.summary.checkedIn}`);

    const moved = data.rows.find((row) => row.id === r1);
    assert(moved.weightClassLabel === "+37", `r1 label ${moved.weightClassLabel}`);
  });

  await step("event-day: super admin read-only", async () => {
    const data = await expectApi("super read", () => api("GET", `/api/v1/competitions/${state.competitionId}/event-day`, { cookie: superToken() }), 200, (envelope) => envelope);
    assert(data.rows.length === 3, `rows ${data.rows.length}`);
  });

  await step("event-day: coach forbidden", async () => {
    const weigh = await api("POST", `/api/v1/registrations/${r0}/weigh-in`, { cookie: state.coachCookie, body: { weightKg: 35 } });
    assert(weigh.status === 403, `weigh HTTP ${weigh.status}`);

    const checkIn = await api("POST", `/api/v1/registrations/${r0}/check-in`, { cookie: state.coachCookie, body: { checkedIn: true } });
    assert(checkIn.status === 403, `check-in HTTP ${checkIn.status}`);
  });

  const failed = results.filter((result) => result.status !== "OK");
  console.log(`\nE2E RESULT: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main().catch((error) => {
  console.error("fatal:", error);
  process.exit(1);
});
