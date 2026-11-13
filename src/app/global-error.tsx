"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body style={{ fontFamily: "Vazirmatn, Tahoma, sans-serif", margin: 0 }}>
        <main style={{ display: "flex", minHeight: "100svh", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div
            style={{
              display: "flex",
              width: "100%",
              maxWidth: "28rem",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              padding: "2rem",
              textAlign: "center",
              border: "1px solid #e2e8f0",
              borderRadius: "0.75rem",
              boxShadow: "0 1px 2px rgb(0 0 0 / 0.05)",
            }}
          >
            <h1 style={{ fontSize: "1.125rem", fontWeight: 600, margin: 0 }}>خطای غیرمنتظره</h1>
            <p style={{ fontSize: "0.875rem", color: "#64748b", margin: 0 }}>مشکلی اساسی در برنامه پیش آمد. صفحه را دوباره بارگذاری کنید</p>
            <button
              type="button"
              onClick={reset}
              style={{
                padding: "0.5rem 1.25rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#1d4ed8",
                color: "#ffffff",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              تلاش دوباره
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
