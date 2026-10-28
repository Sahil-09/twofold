import { logout } from "@/app/actions/auth";
import { saveSettings } from "@/app/actions/settings";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { Icon, type IconName } from "@/components/icons";
import { PushToggle } from "@/components/PushToggle";
import { SettingSwitch } from "@/components/SettingSwitch";
import { ThemePicker } from "@/components/ThemePicker";
import { unreadActivityCount } from "@/lib/activity";
import { getPartner, requireUser } from "@/lib/auth";
import { initials } from "@/lib/format";
import { partnerHasNew } from "@/lib/items";
import { pushConfigured } from "@/lib/push";

export const dynamic = "force-dynamic";

function Row({
  icon,
  tone,
  title,
  description,
  control,
}: {
  icon: IconName;
  tone?: string;
  title: string;
  description?: string;
  control?: React.ReactNode;
}) {
  return (
    <div className={`flex ${description ? "items-start" : "items-center"} justify-between gap-5`}>
      <div className={`flex ${description ? "items-start" : "items-center"} gap-4`}>
        <span
          className={`mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full ${
            tone ?? "bg-surface-container text-on-surface-variant"
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="flex flex-col gap-1">
          <span className="text-label-lg font-semibold tracking-[0.01em]">{title}</span>
          {description && <p className="text-body-md leading-snug text-on-surface-variant">{description}</p>}
        </div>
      </div>
      {control}
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();
  const [partner, unread] = await Promise.all([getPartner(user.id), unreadActivityCount(user.id)]);
  const since = user.createdAt.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const hasNew =
    partner && user.notifyPartnerUpdates ? await partnerHasNew(partner.id, user.partnerSeenAt) : false;

  return (
    <>
      <Header user={user} section="Settings" unread={unread} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-8 pb-8 pt-3">
          {/* Hero card */}
          <div className="relative overflow-hidden rounded-3xl bg-surface-lowest p-6 shadow-rest">
            <div className="pointer-events-none absolute -right-14 -top-14 h-56 w-56 rounded-full bg-gradient-to-br from-primary-fixed/40 via-secondary-fixed/20 to-transparent blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-gradient-to-tr from-secondary-container/30 to-transparent blur-2xl" />

            <div className="relative flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center -space-x-4 pt-1">
                <div className="relative z-10 rounded-full bg-surface-lowest p-1.5 shadow-rest">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary-container text-label-lg font-bold text-secondary">
                    {initials(user.displayName)}
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-surface-lowest" />
                </div>
                <div className="relative z-20 grid h-9 w-9 place-items-center rounded-full bg-primary text-on-primary shadow-md">
                  <Icon name="heart" className="h-4 w-4" />
                </div>
                <div className="relative z-10 rounded-full bg-surface-lowest p-1.5 shadow-rest">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-primary-fixed text-label-lg font-bold text-primary">
                    {partner ? initials(partner.displayName) : "?"}
                  </span>
                  <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-tertiary ring-2 ring-surface-lowest" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <h2 className="text-headline-sm font-semibold tracking-[-0.01em]">
                  {user.displayName} &amp; {partner?.displayName ?? "—"}
                </h2>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3.5 py-1.5 text-on-surface-variant">
                  <Icon name="users" className="h-3.5 w-3.5" />
                  <span className="text-label-md font-semibold">Connected since {since}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Wishlist Sync & Rules */}
          <section aria-label="Wishlist Sync & Rules">
            <div className="mb-3 flex items-baseline justify-between gap-3 px-1">
              <span className="section-title">Wishlist Sync &amp; Rules</span>
              <span className="flex shrink-0 items-center gap-1.5 text-label-md font-medium text-primary">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                Synced live
              </span>
            </div>

            <div className="card flex flex-col gap-5 rounded-3xl p-6">
              <Row
                icon="eyeOff"
                tone="bg-secondary-fixed/50 text-secondary"
                title="Surprise Mode"
                description={
                  user.surpriseMode
                    ? `Stay hidden from ${
                        partner?.displayName ?? "your partner"
                      } until you give the gift.`
                    : `Off: ${partner?.displayName ?? "your partner"} can see which of your wishes you reserved or bought.`
                }
                control={
                  <SettingSwitch
                    setting="surpriseMode"
                    on={user.surpriseMode}
                    label="Surprise Mode"
                    confirmOff={`Turn off surprise mode? You will see which wishes ${
                      partner?.displayName ?? "they"
                    } has reserved or bought.`}
                  />
                }
              />
              <div className="h-px bg-surface-container" />

              <div className="flex flex-row gap-3">
                <Row
                  icon="bell"
                  tone="bg-tertiary-fixed/60 text-tertiary"
                  title="Price Drop Alerts"
                  description="Quiet alerts when a wish drops below its target price."
                />
                {pushConfigured() ? (
                  <PushToggle />
                ) : (
                  <p className="text-label-md text-outline pl-14">
                    Alerts are off until the VAPID keys are set on the deployment.
                  </p>
                )}
              </div>
              <div className="h-px bg-surface-container" />

              <Row
                icon="heart"
                tone="bg-primary-fixed/60 text-primary"
                title="Partner updates"
                control={
                  <SettingSwitch
                    setting="partnerUpdates"
                    on={user.notifyPartnerUpdates}
                    label="Partner updates"
                  />
                }
              />
            </div>
          </section>

          {/* Preferences & Sharing */}
          <section aria-label="Preferences & Sharing">
            <span className="label">Preferences &amp; Sharing</span>

            <div className="card flex flex-col gap-5 rounded-3xl p-6">
              <div className="flex flex-col gap-3">
                <h4 className="text-title-md font-medium">Theme Mode</h4>
                <ThemePicker value={user.theme} />
              </div>
              <div className="h-px bg-surface-container" />

              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-label-lg font-semibold">{user.email}</p>
                  <p className="text-label-md text-on-surface-variant">Signed in as {user.displayName}</p>
                </div>
                <form action={logout}>
                  <button type="submit" className="btn-ghost h-11 px-5 text-label-md rounded-full">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* Footer ritual */}
          <div className="flex flex-col items-center gap-2 px-4 pt-2 pb-4 text-center">
            <div className="flex items-center gap-1.5 text-primary">
              <Icon name="heart" className="h-4 w-4" />
              <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
                Twofold Ritual
              </span>
            </div>
            <p className="max-w-xs text-label-md text-on-surface-variant leading-relaxed">
              Every saved item brings your shared horizons a little closer together.
            </p>
          </div>
        </div>
      </main>

      <BottomNav active="settings" hasNew={hasNew} />
    </>
  );
}
