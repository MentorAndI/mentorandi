import { redirect } from "next/navigation";

import { UserService } from "@/services/user/user.service";

export const dynamic = "force-dynamic";

export default async function AppEntryPage() {
  const user = await new UserService().resolveOptionalAuthenticatedUser();

  redirect(user ? "/mentor" : "/login");
}
