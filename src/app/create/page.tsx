import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ChatCreate } from "@/components/create/ChatCreate";

export const metadata: Metadata = {
  title: "Orbit — Create your globe",
  description: "Build your own interactive globe portfolio in about a minute.",
};

export default async function CreatePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin?callbackUrl=/create");
  }
  return (
    <ChatCreate
      initialName={session.user.name ?? ""}
      email={session.user.email ?? ""}
      initialImage={session.user.image ?? undefined}
    />
  );
}
