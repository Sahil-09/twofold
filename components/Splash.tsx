import { Icon, Pulse } from "./icons";

/** Cold-start overlay. Pure CSS, and only shown when launched as an installed app. */
export function Splash() {
  return (
    <div className="splash" aria-hidden>
      <div className="flex flex-col items-center gap-3">
        <div className="animate-pop grid h-14 w-14 place-items-center rounded-full bg-primary-fixed text-primary shadow-rest">
          <Icon name="heart" className="h-7 w-7" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-headline-lg font-bold tracking-[-0.02em]">Twofold</span>
          <Pulse className="bg-primary-container" />
        </div>
        <p className="text-body-md text-on-surface-variant">Two wishlists, one quiet place.</p>
      </div>
    </div>
  );
}
