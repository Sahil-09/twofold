import Link from "next/link";
import { unreadActivityCount } from "@/lib/activity";
import type { CurrentUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { Icon, Pulse } from "./icons";

/** Fixed twin header: wordmark, live dot, current section, activity bell, paired avatar. */
export async function Header({ user, section }: { user: CurrentUser; section: string }) {
  const unread = await unreadActivityCount(user.id);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-fixed text-primary">
            <Icon name="heart" className="h-4 w-4" />
          </span>
          <span className="ml-1 flex flex-col">
            <span className="flex items-center gap-1.5">
              <span className="text-title-md font-bold tracking-tight">Twofold</span>
              <Pulse className="bg-primary-container" />
            </span>
            <span className="text-label-sm capitalize text-outline">{section}</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/activity"
            aria-label={unread > 0 ? `Activity, ${unread} unread` : "Activity"}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-surface-low text-on-surface-variant transition-colors hover:text-primary"
          >
            <Icon name="bell" className="h-4 w-4" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-on-primary">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-full bg-surface-low px-2.5 py-1 shadow-rest"
            aria-label="Settings"
          >
            <span className="hidden text-label-sm text-on-surface-variant sm:inline">Paired</span>
            <span className="relative flex items-center justify-center">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary-container text-label-md font-bold text-secondary">
                {initials(user.displayName)}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary" />
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
