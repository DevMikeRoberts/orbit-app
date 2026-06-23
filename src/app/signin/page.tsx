import { signIn, auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const session = await auth();
  const redirectTo = callbackUrl || "/dashboard";

  if (session?.user) {
    redirect(redirectTo);
  }

  return (
    <main className="signin-root">
      <div className="signin-card">
        <p className="landing-eyebrow">Orbit</p>
        <h1 className="signin-title">
          Sign in<span className="wizard-period">.</span>
        </h1>
        <p className="signin-sub">
          Create a globe, save it, edit it whenever — your account ties it all
          together.
        </p>

        <div className="signin-buttons">
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo });
            }}
          >
            <button className="signin-btn" type="submit">
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo });
            }}
          >
            <button className="signin-btn" type="submit">
              <GitHubIcon />
              Continue with GitHub
            </button>
          </form>
        </div>

        <a href="/" className="signin-back">
          ← Back to home
        </a>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.2 14.5 2.2 12 2.2 6.5 2.2 2 6.7 2 12.2s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#fff"
        d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.5v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4s2 .1 2.9.4c2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.7.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.3.8 1 .8 2v3c0 .3.2.6.8.5A11.5 11.5 0 0 0 12 .5z"
      />
    </svg>
  );
}
