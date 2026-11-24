import { redirect } from "next/navigation";
import { DEFAULT_ROUTE } from "@/lib/pageRegistry";

export default function ScreenRootPage() {
  redirect(DEFAULT_ROUTE);
}
