import { notFound } from "next/navigation";
import { DevUiContent } from "./dev-ui-content";

export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DevUiContent />;
}
