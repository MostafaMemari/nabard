import type { Gender } from "@/features/base-data";
import { mockDelay } from "@/lib/mock";
import { type ListQuery, type ListResult, paginate } from "@/lib/pagination";
import { students } from "./mock/students";
import type { Student, StudentInput } from "./types";

export type StudentListParams = ListQuery & {
  coachId?: string;
  gender?: Gender;
  search?: string;
};

let nextId = students.length + 1;

export async function listStudents(params: StudentListParams = {}): Promise<ListResult<Student>> {
  await mockDelay();
  const search = params.search?.trim() ?? "";
  const filtered = students.filter(
    (student) =>
      (params.coachId === undefined || student.coachId === params.coachId) &&
      (params.gender === undefined || student.gender === params.gender) &&
      (search === "" || student.fullName.includes(search) || student.nationalCode.includes(search)),
  );

  return paginate(filtered, params);
}

export async function getStudent(id: string): Promise<Student> {
  await mockDelay();
  const student = students.find((item) => item.id === id);

  if (!student) {
    throw new Error("هنرجو یافت نشد.");
  }

  return student;
}

export async function createStudent(input: StudentInput): Promise<Student> {
  await mockDelay();
  const now = new Date().toISOString();
  const student: Student = { ...input, id: `student-${nextId}`, createdAt: now, updatedAt: now };
  nextId += 1;
  students.push(student);

  return student;
}

export async function updateStudent(id: string, input: Partial<StudentInput>): Promise<Student> {
  await mockDelay();
  const index = students.findIndex((item) => item.id === id);

  if (index === -1) {
    throw new Error("هنرجو یافت نشد.");
  }

  students[index] = { ...students[index], ...input, updatedAt: new Date().toISOString() };

  return students[index];
}

export async function deleteStudent(id: string): Promise<{ id: string }> {
  await mockDelay();
  const index = students.findIndex((item) => item.id === id);

  if (index !== -1) {
    students.splice(index, 1);
  }

  return { id };
}
