import { auth } from "@/auth";
import { Landing } from "@/components/Landing";

export default async function Home() {
  const session = await auth();
  return (
    <Landing
      user={
        session?.user
          ? {
              name: session.user.name,
              email: session.user.email,
              image: session.user.image,
            }
          : null
      }
    />
  );
}
