import Link from "next/link";
import type { CurrentUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { Icon } from "./icons";

/** Fixed twin header. The unread count is fetched by the page so it can run alongside the list. */
export function Header({ user, section, unread }: { user: CurrentUser; section: string; unread: number }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] pt-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="ml-1 flex flex-col">
            <span className="flex items-center gap-1.5">
              <span className="text-title-md font-bold tracking-tight">{section}</span>
            </span>
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
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-label-sm font-bold leading-none text-on-primary">
                {unread > 9 ? "9+" : unread}
              </span>
            ) : null}
          </Link>

          <Link
            href="/settings"
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-rest"
            aria-label="Settings"
          >
            <span className="relative flex items-center justify-center">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-secondary-container text-label-md font-bold text-secondary">
                {initials(user.displayName)}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
