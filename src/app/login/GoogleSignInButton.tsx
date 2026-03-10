"use client";

import { createClient } from "@/lib/supabase/client";

interface GoogleSignInButtonProps {
  redirectTo?: string;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        d="M21.805 10.023H12v3.955h5.617c-.242 1.272-.967 2.35-2.056 3.075v2.549h3.325c1.947-1.792 3.07-4.434 3.07-7.602 0-.666-.06-1.307-.15-1.977Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.79 0 5.132-.923 6.842-2.498l-3.325-2.549c-.923.62-2.103.986-3.517.986-2.701 0-4.991-1.823-5.808-4.275H2.758v2.63A10.328 10.328 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.192 13.664A6.213 6.213 0 0 1 5.867 11.7c0-.683.118-1.347.325-1.964V7.106H2.758A10.328 10.328 0 0 0 1.67 11.7c0 1.65.395 3.211 1.088 4.594l3.434-2.63Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.46c1.518 0 2.879.523 3.952 1.55l2.964-2.964C17.128 2.378 14.786 1.4 12 1.4A10.328 10.328 0 0 0 2.758 7.106l3.434 2.63C7.009 7.282 9.299 5.46 12 5.46Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  redirectTo = "/",
}: GoogleSignInButtonProps) {
  const handleClick = async () => {
    const supabase = createClient();
    const origin = window.location.origin;
    const callbackUrl = new URL("/auth/callback", origin);
    callbackUrl.searchParams.set("redirectTo", redirectTo);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="
        flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700
        bg-white px-4 py-3 text-sm font-semibold text-zinc-900
        transition-colors hover:bg-zinc-100
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-indigo-500
      "
    >
      <GoogleIcon />
      <span>Continue with Google</span>
    </button>
  );
}
