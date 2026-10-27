import Link from "next/link";
import { markActivityReadAction } from "@/app/actions/activity";
import { Header } from "@/components/Header";
import { Icon, type IconName } from "@/components/icons";
import { OnMount } from "@/components/OnMount";
import { activityFor, unreadActivityCount } from "@/lib/activity";
import { getPartner, requireUser } from "@/lib/auth";
import { relativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const COPY: Record<string, { icon: IconName; line: string }> = {
  added: { icon: "plus", line: "added a new wish" },
  updated: { icon: "pencil", line: "updated a wish" },
  archived: { icon: "receipt", line: "archived a wish" },
};

export default async function ActivityPage() {
  const user = await requireUser();
  const [partner, events, unread] = await Promise.all([
    getPartner(user.id),
    activityFor(user.id),
    unreadActivityCount(user.id),
  ]);
  const name = partner?.displayName ?? "Your partner";

  return (
    <>
      <Header user={user} section="Activity" unread={unread} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-4 pt-2">
          <OnMount action={markActivityReadAction} />

          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-label-md text-on-surface-variant"
            >
              ← Back to lists
            </Link>
            <span className="chip bg-surface-low text-on-surface-variant">
              {events.length} {events.length === 1 ? "update" : "updates"}
            </span>
          </div>

          <div>
            <h1 className="text-headline-lg-mobile font-semibold tracking-[-0.015em]">Activity</h1>
            <p className="mt-0.5 text-body-md text-on-surface-variant">
              What {name} has changed. Claims never show up here.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="card grid place-items-center gap-2 px-6 py-16 text-center">
              <Icon name="bell" className="h-8 w-8 text-outline-variant" />
              <p className="text-title-md font-semibold">Nothing yet</p>
              <p className="max-w-xs text-body-md text-on-surface-variant">
                When {name} adds or edits a wish, it lands here.
              </p>
            </div>
          ) : (
            <div className="card flex flex-col divide-y divide-surface-container p-1">
              {events.map((event) => {
                const copy = COPY[event.kind] ?? COPY.updated;
                const unread = !event.readAt;
                return (
                  <div key={event._id} className="flex items-start gap-3 p-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface-low text-primary">
                      <Icon name={copy.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-label-md text-on-surface">
                        <span className="font-semibold">{name}</span> {copy.line}
                      </p>
                      <p className="truncate text-body-md font-medium">{event.title}</p>
                      <p className="text-label-sm text-outline">{relativeTime(event.at)}</p>
                    </div>
                    {unread ? (
                      <span
                        className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          <p className="px-2 text-center text-label-sm text-outline">
            Reads and reservations stay private — {name} is never told when you claim something.
          </p>
        </div>
      </main>
    </>
  );
}
