/**
 * Route-shaped loading skeletons. Server-only, CSS pulse only, and the same fixed chrome and
 * spacing as the real pages so streamed content lands without a shift.
 */
export function HeaderSkeleton({ title = "w-24" }: { title?: string }) {
  return (
    <header className="pt-safe fixed inset-x-0 top-0 z-50 bg-surface/80 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
        <div className={`h-5 ${title} rounded-full bg-surface-container`} />
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-surface-low" />
          <div className="h-9 w-9 rounded-full bg-surface-low" />
          <div className="h-9 w-9 rounded-full bg-secondary-container/50" />
        </div>
      </div>
    </header>
  );
}

const NAV = ["mine", "theirs", "settings"] as const;

export function NavSkeleton({ active = "mine" }: { active?: (typeof NAV)[number] }) {
  return (
    <nav className="pb-safe pointer-events-none fixed inset-x-0 bottom-0 z-50">
      <div className="px-4 pb-2">
        <div className="mx-auto flex h-16 max-w-md items-center justify-around rounded-full bg-surface/80 px-5 shadow-nav backdrop-blur-xl">
          {NAV.map((key) => (
            <div key={key} className="flex min-w-[44px] flex-col items-center gap-1">
              <div
                className={`h-5 w-5 rounded-full ${
                  key === active ? "bg-primary/30" : "bg-surface-container"
                }`}
              />
              <div className="h-2 w-10 rounded-full bg-surface-container" />
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

/** The wish card layout from My List: hero image, title row, chip row. */
function CardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 rounded-3xl p-5">
      <div className="h-48 w-full rounded-2xl bg-surface-low" />
      <div className="flex items-start justify-between gap-2 pt-1">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-40 rounded-full bg-surface-container" />
          <div className="h-3 w-24 rounded-full bg-surface-container" />
        </div>
        <div className="h-4 w-16 rounded-full bg-surface-container" />
      </div>
      <div className="flex items-center justify-between pt-1">
        <div className="h-6 w-28 rounded-full bg-surface-low" />
        <div className="h-8 w-16 rounded-full bg-surface-low" />
      </div>
    </div>
  );
}

/** The partner/fulfilled card: chip, thumb beside text, action strip. */
function RowCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 rounded-3xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="h-6 w-24 rounded-full bg-surface-container" />
        <div className="h-3 w-14 rounded-full bg-surface-container" />
      </div>
      <div className="flex items-center gap-4">
        <div className="h-24 w-24 shrink-0 rounded-2xl bg-surface-low" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="h-4 w-full rounded-full bg-surface-container" />
          <div className="h-4 w-2/3 rounded-full bg-surface-container" />
          <div className="h-5 w-20 rounded-full bg-surface-container" />
        </div>
      </div>
      <div className="h-10 w-full rounded-full bg-surface-low" />
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <>
      <HeaderSkeleton title="w-28" />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16"
      >
        <span className="sr-only">Loading</span>
        <div className="animate-pulse flex flex-col gap-6 pb-4 pt-3">
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex flex-col gap-2">
              <div className="h-6 w-44 rounded-full bg-surface-container" />
              <div className="h-3 w-32 rounded-full bg-surface-container" />
            </div>
            <div className="h-7 w-24 rounded-full bg-surface-low" />
          </div>
          <div className="h-16 rounded-3xl bg-surface-lowest shadow-rest" />
          <div className="h-11 rounded-full bg-surface-lowest shadow-rest" />
          <div className="flex gap-2">
            <div className="h-10 w-28 rounded-full bg-surface-lowest shadow-rest" />
            <div className="h-10 w-24 rounded-full bg-surface-lowest shadow-rest" />
            <div className="h-10 w-20 rounded-full bg-surface-lowest shadow-rest" />
          </div>
          <div className="flex flex-col gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </main>
      <NavSkeleton />
    </>
  );
}

function SwitchRowSkeleton() {
  return (
    <div className="flex items-start justify-between gap-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 shrink-0 rounded-full bg-surface-container" />
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-4 w-32 rounded-full bg-surface-container" />
          <div className="h-3 w-44 rounded-full bg-surface-container" />
        </div>
      </div>
      <div className="mt-1 h-7 w-12 shrink-0 rounded-full bg-surface-high" />
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <>
      <HeaderSkeleton title="w-20" />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16"
      >
        <span className="sr-only">Loading</span>
        <div className="animate-pulse flex flex-col gap-8 pb-8 pt-3">
          <div className="relative overflow-hidden rounded-3xl bg-surface-lowest p-6 shadow-rest">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="h-12 w-12 rounded-full bg-secondary-container/60" />
                <div className="h-9 w-9 rounded-full bg-primary/30" />
                <div className="h-12 w-12 rounded-full bg-primary-fixed/60" />
              </div>
              <div className="h-6 w-48 rounded-full bg-surface-container" />
              <div className="h-6 w-40 rounded-full bg-surface-low" />
            </div>
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="h-3 w-36 rounded-full bg-surface-container" />
              <div className="h-3 w-16 rounded-full bg-surface-container" />
            </div>
            <div className="card flex flex-col gap-5 rounded-3xl p-6">
              <SwitchRowSkeleton />
              <div className="h-px bg-surface-container" />
              <SwitchRowSkeleton />
              <div className="h-px bg-surface-container" />
              <SwitchRowSkeleton />
            </div>
          </section>

          <section>
            <div className="mb-3 h-3 w-32 rounded-full bg-surface-container" />
            <div className="card flex flex-col gap-5 rounded-3xl p-6">
              <div className="flex flex-col gap-3">
                <div className="h-4 w-24 rounded-full bg-surface-container" />
                <div className="h-10 w-full rounded-full bg-surface-container" />
              </div>
              <div className="h-px bg-surface-container" />
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-40 rounded-full bg-surface-container" />
                  <div className="h-3 w-28 rounded-full bg-surface-container" />
                </div>
                <div className="h-11 w-20 rounded-full bg-surface-low" />
              </div>
            </div>
          </section>
        </div>
      </main>
      <NavSkeleton active="settings" />
    </>
  );
}

export function ActivitySkeleton() {
  return (
    <>
      <HeaderSkeleton title="w-20" />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16"
      >
        <span className="sr-only">Loading</span>
        <div className="animate-pulse flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-28 rounded-full bg-surface-container" />
            <div className="h-6 w-20 rounded-full bg-surface-low" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-7 w-32 rounded-full bg-surface-container" />
            <div className="h-4 w-64 rounded-full bg-surface-container" />
          </div>
          <div className="card flex flex-col divide-y divide-surface-container p-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-start gap-3 p-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-surface-low" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="h-3 w-40 rounded-full bg-surface-container" />
                  <div className="h-4 w-2/3 rounded-full bg-surface-container" />
                  <div className="h-3 w-16 rounded-full bg-surface-container/70" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

export function FulfilledSkeleton() {
  return (
    <>
      <HeaderSkeleton title="w-24" />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16"
      >
        <span className="sr-only">Loading</span>
        <div className="animate-pulse flex flex-col gap-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded-full bg-surface-container" />
            <div className="h-6 w-20 rounded-full bg-surface-low" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-7 w-44 rounded-full bg-surface-container" />
            <div className="h-4 w-56 rounded-full bg-surface-container" />
          </div>
          {Array.from({ length: 2 }, (_, section) => (
            <div key={section} className="flex flex-col gap-2">
              <div className="h-3 w-28 rounded-full bg-surface-container" />
              <div className="flex flex-col gap-3">
                <RowCardSkeleton />
                <RowCardSkeleton />
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

function FieldSkeleton({ short = false }: { short?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-3 ${short ? "w-16" : "w-24"} rounded-full bg-surface-container`} />
      <div className="h-14 rounded-2xl bg-surface-lowest shadow-field" />
    </div>
  );
}

export function ItemSkeleton() {
  return (
    <>
      <HeaderSkeleton title="w-24" />
      <main
        aria-busy="true"
        className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16"
      >
        <span className="sr-only">Loading</span>
        <div className="animate-pulse flex flex-col gap-4 pt-2">
          <div className="h-4 w-28 rounded-full bg-surface-container" />
          <div className="h-48 w-full rounded-2xl bg-surface-low" />
          <div className="h-5 w-20 rounded-full bg-surface-container" />
          <FieldSkeleton />
          <div className="grid grid-cols-2 gap-3">
            <FieldSkeleton short />
            <FieldSkeleton short />
          </div>
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="mt-1 flex gap-3">
            <div className="h-12 flex-1 rounded-full bg-primary/30" />
            <div className="h-12 w-24 rounded-full bg-surface-low" />
          </div>
          <div className="card flex items-center justify-between rounded-3xl p-5">
            <div className="h-10 w-20 rounded-full bg-surface-low" />
            <div className="h-4 w-12 rounded-full bg-surface-container" />
          </div>
        </div>
      </main>
    </>
  );
}

export function LoginSkeleton() {
  return (
    <main aria-busy="true" className="flex min-h-dvh items-center justify-center px-5 py-10">
      <span className="sr-only">Loading</span>
      <div className="animate-pulse w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center">
          <div className="mb-5 h-14 w-14 rounded-full bg-primary-fixed/60" />
          <div className="h-8 w-36 rounded-full bg-surface-container" />
          <div className="mt-2 h-4 w-52 rounded-full bg-surface-container" />
        </div>
        <div className="card flex flex-col gap-4 p-6">
          <div className="h-3 w-14 rounded-full bg-surface-container" />
          <div className="h-14 rounded-2xl bg-surface-low" />
          <div className="h-3 w-16 rounded-full bg-surface-container" />
          <div className="h-14 rounded-2xl bg-surface-low" />
          <div className="mt-2 h-12 rounded-full bg-primary/30" />
        </div>
        <div className="mx-auto mt-6 h-3 w-56 rounded-full bg-surface-container" />
      </div>
    </main>
  );
}
