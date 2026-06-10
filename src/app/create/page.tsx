import type { Metadata } from "next";
import { CreateWizard } from "@/components/create/CreateWizard";

export const metadata: Metadata = {
  title: "Orbit — Create your globe",
  description: "Build your own interactive globe portfolio in minutes.",
};

export default function CreatePage() {
  return <CreateWizard />;
}
