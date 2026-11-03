"use client";

import { ImageIcon } from "lucide-react";
import type { useStudentDocuments } from "../hooks/use-student-documents";
import { studentDocumentTypes } from "../labels";
import type { StudentDetail } from "../types";
import { DocumentUploadCard } from "./document-upload-card";

type Documents = ReturnType<typeof useStudentDocuments>;

export function StudentDocumentsSection({ student, documents }: { student: StudentDetail; documents: Documents }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <ImageIcon aria-hidden className="size-4" />
        مدارک هنرجو
      </h2>
      <p className="text-subtle text-muted-foreground">عکس پرسنلی برای بررسی پروفایل الزامی است.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {studentDocumentTypes.map((type) => (
          <DocumentUploadCard
            key={type}
            studentId={student.id}
            type={type}
            uploaded={student.documents.some((document) => document.type === type)}
            working={documents.workingType === type}
            onUpload={documents.upload}
            onDelete={documents.remove}
          />
        ))}
      </div>
    </section>
  );
}
