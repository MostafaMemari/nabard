import { BrandMark } from "@/components/layout/brand-mark";
import { APP_NAME, APP_SUBTITLE } from "@/lib/app";

function TatamiPattern() {
  return (
    <svg aria-hidden className="absolute inset-0 size-full" role="presentation">
      <defs>
        <pattern id="tatami-grid" width="96" height="48" patternUnits="userSpaceOnUse">
          <rect x="0.5" y="0.5" width="95" height="47" rx="2" fill="none" stroke="white" strokeOpacity="0.05" />
          <line x1="48" y1="0" x2="48" y2="48" stroke="white" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tatami-grid)" />
    </svg>
  );
}

export function LoginBrandPanel() {
  return (
    <div className="login-brand-panel relative hidden flex-1 overflow-hidden lg:block">
      <TatamiPattern />
      <div className="absolute inset-x-10 bottom-10 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <BrandMark className="size-12 rounded-xl shadow-overlay" />
          <span className="text-4xl font-semibold text-white">{APP_NAME}</span>
        </div>
        <p className="text-sm text-sidebar-foreground">{APP_SUBTITLE}</p>
      </div>
    </div>
  );
}
