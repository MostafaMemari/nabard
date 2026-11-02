import type { Gender } from "./types";

// genderLabels is for competitions and weight classes (آقایان/بانوان);
// personGenderLabels is for people like coaches and students (آقا/خانم).
export const genderLabels: Record<Gender, string> = {
  MALE: "آقایان",
  FEMALE: "بانوان",
};

export const personGenderLabels: Record<Gender, string> = {
  MALE: "آقا",
  FEMALE: "خانم",
};
