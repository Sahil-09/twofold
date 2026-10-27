/**
 * Painted the instant a tab is tapped: the root layout reads only a cookie, so this skeleton is
 * the first thing the router can show while the page's data is still in flight.
 */
export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-28 pt-16" aria-busy="true">
      <span className="sr-only">Loading</span>
      <div className="flex animate-pulse flex-col gap-4 pt-2">
        <div className="h-7 w-2/3 rounded-full bg-surface-container" />
        <div className="h-4 w-2/5 rounded-full bg-surface-container" />
        <div className="card h-16" />
        <div className="h-12 rounded-full bg-surface-lowest shadow-rest" />
        <div className="card h-36" />
        <div className="card h-36" />
      </div>
    </main>
  );
}
