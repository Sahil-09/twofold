import Link from "next/link";
import { Icon, type IconName } from "./icons";

const items: { key: "mine" | "theirs" | "settings"; label: string; href: string; icon: IconName }[] =
  [
    { key: "mine", label: "My List", href: "/", icon: "heart" },
    { key: "theirs", label: "Partner's List", href: "/?tab=theirs", icon: "gift" },
    { key: "settings", label: "Settings", href: "/settings", icon: "tune" },
  ];

/** Floating bottom pill from the Stitch screens. The partner dot is server-computed, never decorative. */
export function BottomNav({
  active,
  hasNew = false,
}: {
  active: "mine" | "theirs" | "settings";
  hasNew?: boolean;
}) {
  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 pb-safe">
      <div className="px-4 pb-2">
        <div className="pointer-events-auto mx-auto flex h-16 max-w-md items-center justify-around rounded-full bg-surface/90 px-5 shadow-nav backdrop-blur-xl">
          {items.map((item) => {
            const current = item.key === active;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center rounded-full px-3 transition-colors ${
                  current
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="relative">
                  <Icon name={item.icon} className="h-5 w-5" />
                  {item.key === "theirs" && hasNew ? (
                    <span className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span className="mt-0.5 text-label-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
