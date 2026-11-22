import { getInitials, type TaskHistoryEvent } from "@/lib/task-presentation";
import type { TaskStatus } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { StatusBadge } from "./status-badge";

const eventStatuses: Record<TaskHistoryEvent["kind"], TaskStatus> = {
  assigned: "assigned",
  submitted: "submitted",
  resubmitted: "submitted",
  changes_requested: "changes_requested",
  approved: "approved",
};

export function TaskTimeline({
  events,
  error = false,
}: {
  events: TaskHistoryEvent[];
  error?: boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground">Activity history</h2>
      {error ? (
        <div className="mt-4">
          <EmptyState title="History could not be loaded" variant="error">
            Refresh the page to try again.
          </EmptyState>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No activity has been recorded yet.</p>
      ) : (
        <ol className="mt-5 space-y-6 border-l border-border pl-4">
          {events.map((event) => (
            <li key={event.id} className="min-w-0">
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <StatusBadge
                    status={eventStatuses[event.kind]}
                    label={event.kind === "resubmitted" ? "Resubmitted" : undefined}
                  />
                  <time
                    dateTime={event.createdAt}
                    className="tabular text-xs text-muted"
                  >
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full bg-background text-xs font-semibold text-foreground"
                  >
                    {getInitials(event.actor)}
                  </span>
                  <p className="text-sm text-muted">{event.actor}</p>
                </div>
                {event.description && (
                  <p className="mt-1 text-sm text-muted">{event.description}</p>
                )}
                {event.feedback && (
                  <div className="mt-3 rounded-lg border border-status-changes-ring bg-status-changes-bg p-3 text-sm text-status-changes-fg">
                    <p className="font-semibold">Feedback</p>
                    <p className="mt-1 whitespace-pre-wrap">{event.feedback}</p>
                  </div>
                )}
                {event.submission && (
                  <div className="mt-3 rounded-lg bg-background p-3">
                    <p className="tabular text-xs font-semibold uppercase tracking-wide text-muted">
                      v{event.submission.version}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {event.submission.body}
                    </p>
                    {event.submission.link && (
                      <a
                        href={event.submission.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      >
                        Open submitted link
                      </a>
                    )}
                    {event.submission.file_path && (
                      <a
                        href={`/api/files/signed?path=${encodeURIComponent(event.submission.file_path)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm font-medium text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
                      >
                        Download attachment
                      </a>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
