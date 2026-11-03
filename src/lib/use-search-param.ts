"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function useSearchParam(key: string): [string, (value: string | null) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const value = searchParams.get(key) ?? "";

  function setValue(next: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === null || next.trim() === "") {
      params.delete(key);
    } else {
      params.set(key, next.trim());
    }
    const query = params.toString();
    router.replace(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
  }

  return [value, setValue];
}

export function useSearchParamText(key: string): { value: string; input: string; setInput: (value: string) => void } {
  const [value, setValue] = useSearchParam(key);
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  function setInputAndUrl(next: string) {
    setInput(next);
    setValue(next);
  }

  return { value, input, setInput: setInputAndUrl };
}
