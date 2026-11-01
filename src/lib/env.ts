import { z } from "zod";

const provinces = [
  "TEHRAN",
  "ISFAHAN",
  "FARS",
  "RAZAVI_KHORASAN",
  "KHUZESTAN",
  "EAST_AZERBAIJAN",
  "WEST_AZERBAIJAN",
  "MAZANDARAN",
  "GILAN",
  "KERMAN",
  "SISTAN_AND_BALUCHESTAN",
  "GOLESTAN",
  "ARDABIL",
  "QOM",
  "MARKAZI",
  "HORMOZGAN",
  "KERMANSHAH",
  "ALBORZ",
  "LORESTAN",
  "HAMADAN",
  "YAZD",
  "KOHGILUYEH_AND_BOYER_AHMAD",
  "CHAHARMAHAL_AND_BAKHTIARI",
  "NORTH_KHORASAN",
  "SOUTH_KHORASAN",
  "ILAM",
  "BUSHEHR",
  "ZANJAN",
  "QAZVIN",
  "SEMNAN",
  "KURDISTAN",
] as const;

const postgresUrl = z.url().refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), {
  message: "Must be a postgres:// or postgresql:// connection string",
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_URL: z.url().or(z.literal("")).default(""),
});

const serverEnvSchema = z.object({
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl.optional(),
  SESSION_SECRET: z.string().min(1).optional(),
  ADMIN_MOBILE: z
    .string()
    .regex(/^09\d{9}$/)
    .optional(),
  ADMIN_PASSWORD: z.string().min(8).optional(),
  ADMIN_PROVINCE: z.enum(provinces).optional(),
});

export const env = clientEnvSchema.parse(process.env);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let serverEnvCache: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  serverEnvCache ??= serverEnvSchema.parse(process.env);
  return serverEnvCache;
}
