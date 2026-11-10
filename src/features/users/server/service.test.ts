import { compareSync } from "bcryptjs";
import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/api";
import type { CurrentUser } from "@/lib/session";
import type { Storage } from "@/lib/storage/types";
import type { CoachRecord, CoachRepository, UserIdentityRecord } from "./repository";
import {
  createCoach,
  deleteCoachPhoto,
  getCoach,
  listCoaches,
  readCoachPhoto,
  resetCoachPassword,
  updateCoach,
  uploadCoachPhoto,
} from "./service";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN" };
const coach: CurrentUser = { id: "coach-1", role: "COACH" };

const adminRecord: UserIdentityRecord = { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true };
const inactiveAdminRecord: UserIdentityRecord = { ...adminRecord, isActive: false };
const coachIdentityRecord: UserIdentityRecord = { id: "admin-1", role: "COACH", province: "TEHRAN", isActive: true };

const createdAt = new Date("2026-07-15T08:30:00.000Z");

const tehranCountyRecord = { id: "county-tehran", province: "TEHRAN" as const, name: "تهران" };
const farsCountyRecord = { id: "county-shiraz", province: "FARS" as const, name: "شیراز" };

const tehranCoach: CoachRecord = {
  id: "coach-9",
  mobile: "09121110000",
  fullName: "رضا محمدی",
  nationalCode: "1234567890",
  role: "COACH",
  gender: "MALE" as const,
  province: "TEHRAN",
  isActive: true,
  countyId: "county-tehran",
  countyName: "تهران",
  createdAt,
  updatedAt: createdAt,
};

const farsCoach: CoachRecord = { ...tehranCoach, id: "coach-2", province: "FARS" };
const adminRow: CoachRecord = { ...tehranCoach, id: "coach-3", role: "ADMIN" };

function repoWith(overrides: Partial<CoachRepository> = {}): CoachRepository {
  return {
    findUserById: vi.fn().mockResolvedValue(adminRecord),
    countCoaches: vi.fn().mockResolvedValue(1),
    findCoaches: vi.fn().mockResolvedValue([tehranCoach]),
    findActiveCoachTargets: vi.fn().mockResolvedValue([]),
    findCoachById: vi.fn().mockResolvedValue(tehranCoach),
    findMobileOwner: vi.fn().mockResolvedValue(null),
    findNationalCodeOwner: vi.fn().mockResolvedValue(null),
    findCountyById: vi
      .fn()
      .mockImplementation(async (id: string) =>
        id === tehranCountyRecord.id ? tehranCountyRecord : id === farsCountyRecord.id ? farsCountyRecord : null,
      ),
    createCoach: vi.fn().mockResolvedValue(tehranCoach),
    updateCoach: vi.fn().mockResolvedValue(tehranCoach),
    updateCoachPassword: vi.fn().mockResolvedValue(tehranCoach),
    countStudentsByGender: vi.fn().mockResolvedValue(0),
    findPhotoFileId: vi.fn().mockResolvedValue(null),
    setPhotoFileId: vi.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function failureOf(promise: Promise<unknown>): Promise<unknown> {
  return promise.catch((error: unknown) => error);
}

describe("listCoaches", () => {
  it("scopes the query to the admin province", async () => {
    const repo = repoWith();
    const result = await listCoaches(repo, admin, {});

    expect(repo.findCoaches).toHaveBeenCalledWith("TEHRAN", { search: undefined, isActive: undefined }, 0, 100);
    expect(repo.countCoaches).toHaveBeenCalledWith("TEHRAN", { search: undefined, isActive: undefined });
    expect(result).toEqual({ data: [tehranCoach], meta: { page: 1, pageSize: 100, total: 1 } });
  });

  it("passes search, status and pagination to the repository", async () => {
    const repo = repoWith();
    await listCoaches(repo, admin, { search: "  رضا  ", status: "inactive", page: 2, pageSize: 10 });

    expect(repo.findCoaches).toHaveBeenCalledWith("TEHRAN", { search: "رضا", isActive: false }, 10, 10);
    expect(repo.countCoaches).toHaveBeenCalledWith("TEHRAN", { search: "رضا", isActive: false });
  });

  it("caps pageSize at 100", async () => {
    const repo = repoWith();
    await listCoaches(repo, admin, { pageSize: 500 });

    expect(repo.findCoaches).toHaveBeenCalledWith("TEHRAN", { search: undefined, isActive: undefined }, 0, 100);
  });

  it("rejects a coach with 403 without touching the repository", async () => {
    const repo = repoWith();
    const failure = await failureOf(listCoaches(repo, coach, {}));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findCoaches).not.toHaveBeenCalled();
  });

  it("rejects an inactive admin with 403", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(inactiveAdminRecord) });
    const failure = await failureOf(listCoaches(repo, admin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });

  it("rejects when the admin row is gone with 401", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(listCoaches(repo, admin, {}));

    expect(failure).toMatchObject({ status: 401, code: "UNAUTHORIZED" });
  });

  it("rejects when the session role no longer matches the database role", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(coachIdentityRecord) });
    const failure = await failureOf(listCoaches(repo, admin, {}));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
  });
});

describe("getCoach", () => {
  it("returns a coach of the admin province", async () => {
    const repo = repoWith();
    const result = await getCoach(repo, admin, "coach-9");

    expect(result).toEqual(tehranCoach);
  });

  it("hides a coach of another province behind 404", async () => {
    const repo = repoWith({ findCoachById: vi.fn().mockResolvedValue(farsCoach) });
    const failure = await failureOf(getCoach(repo, admin, "coach-2"));

    expect(failure).toBeInstanceOf(AppError);
    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("hides admin accounts behind 404", async () => {
    const repo = repoWith({ findCoachById: vi.fn().mockResolvedValue(adminRow) });
    const failure = await failureOf(getCoach(repo, admin, "coach-3"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(getCoach(repo, coach, "coach-9"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.findCoachById).not.toHaveBeenCalled();
  });
});

describe("createCoach", () => {
  const input = {
    fullName: "سعید احمدی",
    mobile: "09122220000",
    nationalCode: "0987654321",
    initialPassword: "Secret!1234",
    countyId: "county-tehran",
    gender: "MALE" as const,
  };

  it("creates an active coach in the admin province with a bcrypt hash", async () => {
    const repo = repoWith();
    await createCoach(repo, admin, input);

    expect(repo.createCoach).toHaveBeenCalledTimes(1);
    const data = vi.mocked(repo.createCoach).mock.calls[0][0];
    expect(data).toMatchObject({
      mobile: "09122220000",
      fullName: "سعید احمدی",
      nationalCode: "0987654321",
      province: "TEHRAN",
      countyId: "county-tehran",
    });
    expect(compareSync("Secret!1234", data.passwordHash)).toBe(true);
    expect(compareSync("WrongPass123", data.passwordHash)).toBe(false);
  });

  it("never returns or stores the plain password", async () => {
    const repo = repoWith();
    const result = await createCoach(repo, admin, input);

    expect(JSON.stringify(result)).not.toContain("Secret!1234");
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it("rejects a duplicate mobile with 409", async () => {
    const repo = repoWith({ findMobileOwner: vi.fn().mockResolvedValue({ id: "other" }) });
    const failure = await failureOf(createCoach(repo, admin, input));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCoach).not.toHaveBeenCalled();
  });

  it("rejects a duplicate national code with 409", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "other" }) });
    const failure = await failureOf(createCoach(repo, admin, input));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.createCoach).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCoach(repo, coach, input));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCoach).not.toHaveBeenCalled();
  });

  it("rejects a county of another province with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(createCoach(repo, admin, { ...input, countyId: "county-shiraz" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCoach).not.toHaveBeenCalled();
  });

  it("rejects an unknown county with 400", async () => {
    const repo = repoWith({ findCountyById: vi.fn().mockResolvedValue(null) });
    const failure = await failureOf(createCoach(repo, admin, { ...input, countyId: "county-nope" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.createCoach).not.toHaveBeenCalled();
  });
});

describe("updateCoach", () => {
  it("deactivates a coach of the admin province", async () => {
    const repo = repoWith();
    await updateCoach(repo, admin, "coach-9", { isActive: false });

    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", { isActive: false });
  });

  it("edits fields of a coach", async () => {
    const repo = repoWith();
    await updateCoach(repo, admin, "coach-9", { fullName: "نام تازه", mobile: "09123330000" });

    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", { fullName: "نام تازه", mobile: "09123330000" });
  });

  it("keeps a coach of another province behind 404", async () => {
    const repo = repoWith({ findCoachById: vi.fn().mockResolvedValue(farsCoach) });
    const failure = await failureOf(updateCoach(repo, admin, "coach-2", { isActive: true }));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("rejects a mobile that belongs to another user with 409", async () => {
    const repo = repoWith({ findMobileOwner: vi.fn().mockResolvedValue({ id: "other" }) });
    const failure = await failureOf(updateCoach(repo, admin, "coach-9", { mobile: "09122220000" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("allows keeping the coach own mobile", async () => {
    const repo = repoWith({ findMobileOwner: vi.fn().mockResolvedValue({ id: "coach-9" }) });
    await updateCoach(repo, admin, "coach-9", { mobile: "09121110000" });

    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", { mobile: "09121110000" });
  });

  it("rejects a national code that belongs to another user with 409", async () => {
    const repo = repoWith({ findNationalCodeOwner: vi.fn().mockResolvedValue({ id: "other" }) });
    const failure = await failureOf(updateCoach(repo, admin, "coach-9", { nationalCode: "0987654321" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("rejects a coach with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCoach(repo, coach, "coach-9", { isActive: true }));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("updates the county of a coach with a county of the admin province", async () => {
    const repo = repoWith();
    await updateCoach(repo, admin, "coach-9", { countyId: "county-tehran" });

    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", { countyId: "county-tehran" });
  });

  it("rejects a county of another province on update with 400", async () => {
    const repo = repoWith();
    const failure = await failureOf(updateCoach(repo, admin, "coach-9", { countyId: "county-shiraz" }));

    expect(failure).toMatchObject({ status: 400, code: "VALIDATION_ERROR" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("changes the gender of a coach without clashing students", async () => {
    const repo = repoWith();
    await updateCoach(repo, admin, "coach-9", { gender: "FEMALE" });

    expect(repo.countStudentsByGender).toHaveBeenCalledWith("coach-9", "MALE");
    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", { gender: "FEMALE" });
  });

  it("blocks a gender change with the count of the other-gender students", async () => {
    const repo = repoWith({ countStudentsByGender: vi.fn().mockResolvedValue(3) });
    const failure = await failureOf(updateCoach(repo, admin, "coach-9", { gender: "FEMALE" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect((failure as AppError).message).toContain("۳ هنرجوی آقایان");
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });

  it("skips the student count when the submitted gender is unchanged", async () => {
    const repo = repoWith();
    await updateCoach(repo, admin, "coach-9", { gender: "MALE" });

    expect(repo.countStudentsByGender).not.toHaveBeenCalled();
    expect(repo.updateCoach).toHaveBeenCalledWith("coach-9", {});
  });

  it("blocks assigning a gender to a coach with mixed-gender students", async () => {
    const noGenderCoach: CoachRecord = { ...tehranCoach, gender: null };
    const repo = repoWith({
      findCoachById: vi.fn().mockResolvedValue(noGenderCoach),
      countStudentsByGender: vi.fn().mockResolvedValue(2),
    });
    const failure = await failureOf(updateCoach(repo, admin, "coach-9", { gender: "MALE" }));

    expect(failure).toMatchObject({ status: 409, code: "CONFLICT" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });
});

describe("resetCoachPassword", () => {
  it("stores a bcrypt hash of the new password for a coach of the admin province", async () => {
    const repo = repoWith();
    await resetCoachPassword(repo, admin, "coach-9", "FreshPass1234");

    expect(repo.updateCoachPassword).toHaveBeenCalledTimes(1);
    const [id, passwordHash] = vi.mocked(repo.updateCoachPassword).mock.calls[0];
    expect(id).toBe("coach-9");
    expect(compareSync("FreshPass1234", passwordHash)).toBe(true);
  });

  it("keeps a coach of another province behind 404", async () => {
    const repo = repoWith({ findCoachById: vi.fn().mockResolvedValue(farsCoach) });
    const failure = await failureOf(resetCoachPassword(repo, admin, "coach-2", "FreshPass1234"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateCoachPassword).not.toHaveBeenCalled();
  });

  it("refuses to reset an admin account with 404", async () => {
    const repo = repoWith({ findCoachById: vi.fn().mockResolvedValue(adminRow) });
    const failure = await failureOf(resetCoachPassword(repo, admin, "coach-3", "FreshPass1234"));

    expect(failure).toMatchObject({ status: 404, code: "NOT_FOUND" });
    expect(repo.updateCoachPassword).not.toHaveBeenCalled();
  });

  it("rejects a coach session with 403", async () => {
    const repo = repoWith();
    const failure = await failureOf(resetCoachPassword(repo, coach, "coach-9", "FreshPass1234"));

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCoachPassword).not.toHaveBeenCalled();
  });

  it("never returns the plain password or the hash", async () => {
    const repo = repoWith();
    const result = await resetCoachPassword(repo, admin, "coach-9", "FreshPass1234");

    expect(JSON.stringify(result)).not.toContain("FreshPass1234");
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });
});

describe("SUPER_ADMIN", () => {
  const superAdmin: CurrentUser = { id: "super-1", role: "SUPER_ADMIN" };
  const superAdminRecord: UserIdentityRecord = { id: "super-1", role: "SUPER_ADMIN", province: null, isActive: true };

  function superRepoWith(overrides: Partial<CoachRepository> = {}): CoachRepository {
    return repoWith({ findUserById: vi.fn().mockResolvedValue(superAdminRecord), ...overrides });
  }

  it("lists coaches of every province when no province filter is set", async () => {
    const repo = superRepoWith({ findCoaches: vi.fn().mockResolvedValue([tehranCoach, farsCoach]) });
    const result = await listCoaches(repo, superAdmin, {});

    expect(repo.findCoaches).toHaveBeenCalledWith(undefined, { search: undefined, isActive: undefined }, 0, 100);
    expect(result.data).toEqual([tehranCoach, farsCoach]);
  });

  it("filters the list by the province query", async () => {
    const repo = superRepoWith();
    await listCoaches(repo, superAdmin, { province: "FARS" });

    expect(repo.findCoaches).toHaveBeenCalledWith("FARS", { search: undefined, isActive: undefined }, 0, 100);
  });

  it("sees a coach of another province", async () => {
    const repo = superRepoWith({ findCoachById: vi.fn().mockResolvedValue(farsCoach) });
    const result = await getCoach(repo, superAdmin, "coach-2");

    expect(result).toEqual(farsCoach);
  });

  it("keeps creating and editing coaches out of reach", async () => {
    const repo = superRepoWith();
    const failure = await failureOf(
      createCoach(repo, superAdmin, {
        fullName: "سعید احمدی",
        mobile: "09122220000",
        nationalCode: "0987654321",
        initialPassword: "Secret!1234",
        countyId: "county-tehran",
        gender: "MALE" as const,
      }),
    );

    expect(failure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.createCoach).not.toHaveBeenCalled();

    const updateFailure = await failureOf(updateCoach(repo, superAdmin, "coach-9", { isActive: false }));
    expect(updateFailure).toMatchObject({ status: 403, code: "FORBIDDEN" });
    expect(repo.updateCoach).not.toHaveBeenCalled();
  });
});

const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 9, 9]);

const activeCoachRecord: UserIdentityRecord = { id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true };

function photoFile(): File {
  return new File([JPEG_BYTES], "photo.jpg", { type: "image/jpeg" });
}

function photoStorageWith(): Storage {
  return {
    put: vi.fn().mockResolvedValue({ id: "photo-file-2", mime: "image/jpeg", size: JPEG_BYTES.byteLength }),
    get: vi.fn().mockResolvedValue({ mime: "image/jpeg", size: JPEG_BYTES.byteLength, stream: new Blob([JPEG_BYTES]).stream() }),
    delete: vi.fn().mockResolvedValue(undefined),
    getUrls: vi.fn().mockResolvedValue(new Map()),
  };
}

describe("uploadCoachPhoto", () => {
  it("stores the photo under the coach folder and replaces the old file", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(activeCoachRecord),
      setPhotoFileId: vi.fn().mockResolvedValue("photo-file-1"),
    });
    const storage = photoStorageWith();
    await uploadCoachPhoto(repo, storage, coach, photoFile());

    expect(storage.put).toHaveBeenCalledWith({ data: JPEG_BYTES, mime: "image/jpeg", folder: "coach-photos" });
    expect(repo.setPhotoFileId).toHaveBeenCalledWith("coach-1", "photo-file-2");
    expect(storage.delete).toHaveBeenCalledWith("photo-file-1");
  });

  it("cleans the uploaded object when the update fails", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(activeCoachRecord),
      setPhotoFileId: vi.fn().mockRejectedValue(new Error("db down")),
    });
    const storage = photoStorageWith();
    await expect(uploadCoachPhoto(repo, storage, coach, photoFile())).rejects.toThrow("db down");

    expect(storage.delete).toHaveBeenCalledWith("photo-file-2");
  });

  it("rejects an admin with 403", async () => {
    const repo = repoWith();
    await expect(uploadCoachPhoto(repo, photoStorageWith(), admin, photoFile())).rejects.toMatchObject({
      status: 403,
      code: "FORBIDDEN",
    });
    expect(repo.setPhotoFileId).not.toHaveBeenCalled();
  });
});

describe("deleteCoachPhoto", () => {
  it("removes the photo reference and the stored file", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue(activeCoachRecord),
      findPhotoFileId: vi.fn().mockResolvedValue("photo-file-1"),
    });
    const storage = photoStorageWith();
    await deleteCoachPhoto(repo, storage, coach);

    expect(repo.setPhotoFileId).toHaveBeenCalledWith("coach-1", null);
    expect(storage.delete).toHaveBeenCalledWith("photo-file-1");
  });

  it("answers 404 when no photo is uploaded", async () => {
    const repo = repoWith({ findUserById: vi.fn().mockResolvedValue(activeCoachRecord) });
    await expect(deleteCoachPhoto(repo, photoStorageWith(), coach)).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});

describe("readCoachPhoto", () => {
  it("serves the photo to the owning coach", async () => {
    const repo = repoWith({
      findUserById: vi
        .fn()
        .mockImplementation(async (id: string) =>
          id === "coach-1"
            ? { id, role: "COACH", province: "TEHRAN", isActive: true }
            : { id: "admin-1", role: "ADMIN", province: "TEHRAN", isActive: true },
        ),
      findPhotoFileId: vi.fn().mockResolvedValue("photo-file-1"),
    });
    const storage = photoStorageWith();
    const photo = await readCoachPhoto(repo, storage, coach, "coach-1");

    expect(storage.get).toHaveBeenCalledWith("photo-file-1");
    expect(photo).toMatchObject({ mime: "image/jpeg", size: JPEG_BYTES.byteLength });
  });

  it("serves the photo to an admin of the same province and to a super admin", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockImplementation(async (id: string) => {
        if (id === "admin-1") return { id, role: "ADMIN", province: "TEHRAN", isActive: true };
        if (id === "super-1") return { id, role: "SUPER_ADMIN", province: null, isActive: true };
        return { id, role: "COACH", province: "TEHRAN", isActive: true };
      }),
      findPhotoFileId: vi.fn().mockResolvedValue("photo-file-1"),
    });

    await readCoachPhoto(repo, photoStorageWith(), admin, "coach-1");
    await readCoachPhoto(repo, photoStorageWith(), { id: "super-1", role: "SUPER_ADMIN" }, "coach-1");

    expect(repo.findPhotoFileId).toHaveBeenCalledTimes(2);
  });

  it("hides coaches of another province behind 404", async () => {
    const repo = repoWith({
      findUserById: vi
        .fn()
        .mockImplementation(async (id: string) =>
          id === "admin-1"
            ? { id, role: "ADMIN", province: "TEHRAN", isActive: true }
            : { id, role: "COACH", province: "FARS", isActive: true },
        ),
    });
    await expect(readCoachPhoto(repo, photoStorageWith(), admin, "coach-1")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("blocks a coach reading another coach photo behind 404", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue({ id: "coach-2", role: "COACH", province: "TEHRAN", isActive: true }),
    });
    await expect(readCoachPhoto(repo, photoStorageWith(), { id: "coach-1", role: "COACH" }, "coach-2")).rejects.toMatchObject({
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("answers 404 when the coach has no photo", async () => {
    const repo = repoWith({
      findUserById: vi.fn().mockResolvedValue({ id: "coach-1", role: "COACH", province: "TEHRAN", isActive: true }),
    });
    await expect(readCoachPhoto(repo, photoStorageWith(), coach, "coach-1")).rejects.toMatchObject({ status: 404, code: "NOT_FOUND" });
  });
});
