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
  description: string;
  control?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full ${
            tone ?? "bg-surface-container text-on-surface-variant"
          }`}
        >
          <Icon name={icon} className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-title-md font-semibold">{title}</span>
          </div>
          <p className="mt-0.5 text-body-md leading-snug text-on-surface-variant">{description}</p>
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
  const divider = <div className="h-px bg-surface-container" />;

  return (
    <>
      <Header user={user} section="Settings" unread={unread} />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16">
        <div className="flex flex-col gap-6 pb-8 pt-3">
          <div className="relative overflow-hidden rounded-3xl bg-surface-lowest p-5 shadow-rest">
            <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary-fixed/40 via-secondary-fixed/20 to-transparent blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-secondary-container/30 to-transparent blur-xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="mb-3 flex items-center justify-center -space-x-3 pt-1">
                <div className="relative z-10 rounded-full bg-surface-lowest p-1 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-secondary-container text-label-lg font-bold text-secondary">
                    {initials(user.displayName)}
                  </span>
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-primary ring-2 ring-surface-lowest" />
                </div>
                <div className="relative z-20 grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary shadow-md">
                  <Icon name="heart" className="h-4 w-4" />
                </div>
                <div className="relative z-10 rounded-full bg-surface-lowest p-1 shadow-sm">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-fixed text-label-lg font-bold text-primary">
                    {partner ? initials(partner.displayName) : "?"}
                  </span>
                  <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-tertiary ring-2 ring-surface-lowest" />
                </div>
              </div>

              <h2 className="text-headline-sm font-semibold tracking-tight">
                {user.displayName} &amp; {partner?.displayName ?? "—"}
              </h2>
              <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-surface-low px-3 py-1 text-on-surface-variant">
                <Icon name="users" className="h-3.5 w-3.5" />
                <span className="text-label-md">Connected since {since}</span>
              </div>
            </div>
          </div>

          <form action={saveSettings} className="card flex flex-col gap-3 rounded-3xl p-5">
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="displayName">
                Your name
              </label>
              <input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName}
                maxLength={60}
                required
                className="field"
              />
              <p className="text-label-sm text-outline">Shown on your list and to your partner.</p>
            </div>
            <input type="hidden" name="theme" value={user.theme} />
            <button type="submit" className="btn-primary h-11 self-start px-5 text-label-md">
              Save
            </button>
          </form>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-2">
              <span className="section-title">Wishlist Sync &amp; Rules</span>
              <span className="flex items-center gap-1 text-label-sm text-primary">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Synced live
              </span>
            </div>

            <div className="card flex flex-col gap-4 rounded-3xl p-5">
              <Row
                icon="eyeOff"
                tone="bg-secondary-fixed/50 text-secondary"
                title="Surprise Mode"
                description={
                  user.surpriseMode
                    ? `Purchase confirmations and reservations stay hidden from ${
                        partner?.displayName ?? "your partner"
                      } until you give the gift.`
                    : `Off: ${
                        partner?.displayName ?? "your partner"
                      } can see which of your wishes you reserved or bought.`
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
              {divider}
              <div className="flex flex-col gap-2">
                <Row
                  icon="bell"
                  tone="bg-tertiary-fixed/60 text-tertiary"
                  title="Price Drop Alerts"
                  description="Quietly notifies when something on your list dips below its target price."
                />
                {pushConfigured() ? (
                  <PushToggle />
                ) : (
                  <p className="text-label-sm text-outline">
                    Alerts are off until the VAPID keys are set on the deployment.
                  </p>
                )}
              </div>
              {divider}
              <Row
                icon="heart"
                tone="bg-primary-fixed/60 text-primary"
                title="Partner updates"
                description={
                  user.notifyPartnerUpdates
                    ? `In-app when ${partner?.displayName ?? "your partner"} adds, edits or archives a wish — plus a push notification if this device is subscribed. Claims are never announced.`
                    : `Off: nothing when ${partner?.displayName ?? "your partner"} adds, edits or archives a wish. The bell, the dot and /activity go quiet. Claims were never announced anyway.`
                }
                control={
                  <SettingSwitch
                    setting="partnerUpdates"
                    on={user.notifyPartnerUpdates}
                    label="Partner updates"
                  />
                }
              />
              {divider}
              <Row
                icon="sparkle"
                tone="bg-secondary-fixed/50 text-secondary"
                title="Automatic Link Scraper"
                description={
                  user.autoParse
                    ? "Extracts the title, price, image and shop as soon as a link is pasted."
                    : "Off: the paste-a-link bar is hidden. Add wishes by hand, or turn it back on."
                }
                control={
                  <SettingSwitch setting="autoParse" on={user.autoParse} label="Automatic Link Scraper" />
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="section-title px-1">Preferences &amp; Sharing</span>

            <div className="card flex flex-col gap-4 rounded-3xl p-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-title-md font-semibold">Theme Mode</span>
                </div>
                <ThemePicker value={user.theme} />
              </div>
              {divider}
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-label-lg font-semibold">{user.email}</p>
                  <p className="text-label-sm text-on-surface-variant">
                    Signed in as {user.displayName}
                  </p>
                </div>
                <form action={logout}>
                  <button type="submit" className="btn-ghost h-10 px-4 text-label-md">
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 px-4 py-2 text-center">
            <div className="flex items-center gap-1 text-primary">
              <Icon name="heart" className="h-3.5 w-3.5" />
              <span className="text-label-sm font-semibold uppercase tracking-wide">
                Twofold Ritual
              </span>
            </div>
            <p className="max-w-xs text-label-sm text-on-surface-variant">
              Every saved item brings your shared horizons a little closer together.
            </p>
          </div>
        </div>
      </main>

      <BottomNav active="settings" hasNew={hasNew} />
    </>
  );
}
