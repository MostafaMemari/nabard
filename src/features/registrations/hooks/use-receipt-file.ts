import { useEffect, useRef, useState } from "react";
import { ACCEPTED_RECEIPT_TYPES, compressReceiptImage } from "../components/compress-receipt";

const MAX_UPLOADED_BYTES = 2 * 1024 * 1024;

// Owns the receipt file picker: preview URL, browser-side compression and the
// inline error message.
export function useReceiptFile({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  async function selectFile(selected: File | null) {
    if (!selected) {
      setError(null);
      onChange(null);
      return;
    }

    if (!ACCEPTED_RECEIPT_TYPES.has(selected.type)) {
      setError("فقط تصاویر JPEG، PNG یا WebP پذیرفته می شوند.");
      return;
    }

    setError(null);
    setCompressing(true);

    try {
      const compressed = await compressReceiptImage(selected);
      if (compressed.size > MAX_UPLOADED_BYTES) {
        setError("حجم تصویر پس از فشرده سازی زیاد است؛ تصویر کوچک تری انتخاب کنید.");
        return;
      }

      onChange(compressed);
    } catch (compressError) {
      setError(compressError instanceof Error ? compressError.message : "فشرده سازی تصویر ممکن نشد.");
    } finally {
      setCompressing(false);
    }
  }

  function clear() {
    setError(null);
    onChange(null);
  }

  return { inputRef, previewUrl, error, compressing, selectFile, clear };
}
