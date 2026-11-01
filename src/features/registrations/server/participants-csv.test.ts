import { describe, expect, it } from "vitest";
import { csvCell, participantsCsvFilename, toParticipantsCsv } from "./participants-csv";
import type { ParticipantRecord } from "./service";

function participant(overrides: Partial<ParticipantRecord> = {}): ParticipantRecord {
  return {
    registrationId: "reg-1",
    studentId: "student-1",
    fullName: "علی محمدی",
    nationalCode: "0012345678",
    birthDate: new Date("2013-05-10T00:00:00.000Z"),
    beltName: "GREEN",
    weightClassLabel: "۳۳",
    coachName: "رضا کریمی",
    ...overrides,
  };
}

describe("csvCell", () => {
  it("prefixes formula starters =, +, - and @ with a quote", () => {
    expect(csvCell("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvCell("+98912")).toBe("'+98912");
    expect(csvCell("-54")).toBe("'-54");
    expect(csvCell("@cmd /c")).toBe("'@cmd /c");
  });

  it("leaves ordinary values untouched", () => {
    expect(csvCell("علی محمدی")).toBe("علی محمدی");
    expect(csvCell("0012345678")).toBe("0012345678");
  });

  it("quotes cells containing commas, quotes or newlines and doubles inner quotes", () => {
    expect(csvCell("رضا, علی")).toBe('"رضا, علی"');
    expect(csvCell("رضا، علی")).toBe("رضا، علی");
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes before quoting so an injected comma stays inert", () => {
    expect(csvCell("=1,2")).toBe('"\'=1,2"');
    expect(csvCell("-1,2")).toBe('"\'-1,2"');
  });
});

describe("participantsCsvFilename", () => {
  it("uses the competition id as the ASCII fallback and the cleaned title as the UTF-8 name", () => {
    const filename = participantsCsvFilename("مسابقات قهرمانی استان تهران", "abc-123");
    expect(filename.ascii).toBe("participants-abc-123.csv");
    expect(filename.utf8).toBe("participants-مسابقات-قهرمانی-استان-تهران.csv");
  });

  it("strips characters that are unsafe in filenames and caps the length", () => {
    const filename = participantsCsvFilename('جام/"تکواندو"\n%s<>:', "comp-9");
    expect(filename.utf8).not.toMatch(/["\\\n<>:]/);
    expect(filename.utf8.length).toBeLessThanOrEqual("participants-".length + 60 + ".csv".length);
    expect(filename.utf8.endsWith(".csv")).toBe(true);
  });

  it("falls back to the id when the title has no safe characters", () => {
    const filename = participantsCsvFilename("///", "comp-9");
    expect(filename.utf8).toBe("participants-comp-9.csv");
  });
});

describe("toParticipantsCsv", () => {
  it("starts with a UTF-8 BOM and a Persian header row", () => {
    const csv = toParticipantsCsv([participant()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split("\r\n")[0]).toBe("\uFEFFنام و نام خانوادگی,کد ملی,تاریخ تولد,کمربند,رده وزنی,نام مربی");
  });

  it("writes Jalali birth dates and one CRLF-terminated row per participant", () => {
    const csv = toParticipantsCsv([
      participant(),
      participant({ registrationId: "reg-2", fullName: "سینا مرادی", weightClassLabel: null }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1]).toBe("علی محمدی,0012345678,۱۳۹۲/۰۲/۲۰,سبز,۳۳,رضا کریمی");
    expect(lines[2]).toBe("سینا مرادی,0012345678,۱۳۹۲/۰۲/۲۰,سبز,,رضا کریمی");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("neutralizes dangerous cells in the final document", () => {
    const csv = toParticipantsCsv([
      participant({ fullName: "=SUM(A1)", weightClassLabel: "-54", coachName: "+extract", beltName: "DAN_1" }),
    ]);
    expect(csv).toContain("'=SUM(A1)");
    expect(csv).toContain("'-54");
    expect(csv).toContain("'+extract");
    expect(csv).not.toContain("\r\n=SUM");
  });

  it("maps belt names to Persian labels including dan ranks", () => {
    const csv = toParticipantsCsv([participant({ beltName: "DAN_1" }), participant({ beltName: "POOM_2" })]);
    expect(csv).toContain("دان ۱");
    expect(csv).toContain("پوم ۲");
  });
});
