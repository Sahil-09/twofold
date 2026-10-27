import { Icon } from "./icons";

export function Reservations({ tokens }: { tokens: string[] }) {
  return (
    <section
      className="rounded-3xl bg-surface-container/80 p-4 shadow-rest"
      aria-label="Secret Surprise Vault"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-fixed text-primary">
          <Icon name="lock" className="h-5 w-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-label-lg font-semibold text-on-surface">Secret Surprise Vault</span>
          <span className="text-label-sm text-outline">
            {tokens.length === 0
              ? "Nothing hidden right now"
              : `${tokens.length} being planned • you won't see which`}
          </span>
        </div>
      </div>

      {tokens.length > 0 ? (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
          {tokens.map((token) => (
            <div
              key={token}
              className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-surface-low"
              role="img"
              aria-label="Something reserved"
            >
              <div className="h-12 bg-surface-high" />
              <div className="space-y-1.5 p-2.5">
                <div className="h-2 w-16 rounded-full bg-surface-high" />
                <div className="h-2 w-10 rounded-full bg-surface-high/70" />
              </div>
              <div className="absolute inset-0 grid place-items-center bg-surface/30 backdrop-blur-[3px]">
                <span className="text-label-sm font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                  Reserved
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
