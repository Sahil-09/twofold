import { addCommentAction } from "@/app/actions/comments";
import { relativeTime } from "@/lib/format";
import type { CommentView } from "@/lib/view";
import { Icon } from "./icons";

/** Native <details> keeps the thread expandable without a client component. */
export function CommentThread({
  itemId,
  comments,
  mine,
  partnerName,
}: {
  itemId: string;
  comments?: CommentView[];
  mine: boolean;
  partnerName?: string;
}) {
  const count = comments?.length ?? 0;

  return (
    <details className="overflow-hidden rounded-2xl bg-surface-low">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 [&::-webkit-details-marker]:hidden">
        <Icon name="chat" className="h-4 w-4 shrink-0 text-outline" />
        <span className="text-label-sm font-semibold text-on-surface-variant">
          {count ? `${count} ${count === 1 ? "note" : "notes"}` : "Add a note"}
        </span>
        <Icon name="chevronDown" className="ml-auto h-3.5 w-3.5 text-outline" />
      </summary>

      <div className="flex flex-col gap-3 border-t border-outline-variant/40 px-3 py-3">
        {comments?.map((comment) => (
          <div key={comment.id} className="text-label-sm">
            <span className="font-semibold text-primary">
              {comment.byOwner === mine ? "You" : partnerName ?? "Them"}
            </span>{" "}
            <span className="text-outline">{relativeTime(comment.createdAt)}</span>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-on-surface-variant">
              {comment.body}
            </p>
          </div>
        ))}

        <form action={addCommentAction.bind(null, itemId)} className="flex flex-col gap-2">
          <textarea
            name="body"
            required
            maxLength={1000}
            rows={2}
            placeholder="Say something sweet…"
            aria-label="Add a note"
            className="field w-full resize-none"
          />
          <button type="submit" className="btn-primary h-9 self-end px-5 text-label-sm">
            Post note
          </button>
        </form>
      </div>
    </details>
  );
}
