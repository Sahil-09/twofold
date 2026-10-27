import { redirect } from "next/navigation";
import { Icon, Pulse } from "@/components/icons";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <header className="mb-10 flex flex-col items-center text-center">
          <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-primary shadow-rest">
            <Icon name="heart" className="h-7 w-7" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-headline-lg font-bold tracking-[-0.02em]">Twofold</h1>
            <Pulse className="bg-primary-container" />
          </div>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Two wishlists, one quiet place.
          </p>
        </header>

        <div className="card p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-label-sm text-outline">
          Two accounts only. Ask the other half for the password.
        </p>
      </div>
    </main>
  );
}
