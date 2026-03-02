import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export default async function DashboardRedirect() {
  const { userId } = await auth();
  
  if (userId) {
    redirect(`/${userId}`);
  } else {
    redirect("/");
  }
}
