"use client";

import { useEffect, useState } from "react";

// Tailwind `lg` viewport breakpoint and the shells' `@5xl` container breakpoint
// are both 64rem, so one media query covers the sidebar and the mobile top bar.
const desktopQuery = "(min-width: 64rem)";

// Sheets and menus render through a portal, so CSS `hidden` on their ancestor
// cannot close them when the viewport crosses the breakpoint. Callers use this
// to unmount or close mobile-only and desktop-only account UI.
export function useAboveDesktop(): boolean {
  const [above, setAbove] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(desktopQuery);
    const update = () => setAbove(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return above;
}
