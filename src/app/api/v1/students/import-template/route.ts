import { buildImportTemplate } from "@/features/students/server/import-template";
import { route } from "@/lib/api";

export const runtime = "nodejs";

export const GET = route({ roles: ["ADMIN", "COACH"] }, async () => {
  const buffer = await buildImportTemplate();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": 'attachment; filename="students-import-template.xlsx"',
      "cache-control": "no-store",
    },
  });
});
