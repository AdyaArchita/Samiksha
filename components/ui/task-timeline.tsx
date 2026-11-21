import type { TaskHistoryEvent } from "@/lib/task-presentation";
import { EmptyState } from "./empty-state";

export function TaskTimeline({
  events,
  error = false,
}: {
  events: TaskHistoryEvent[];
  error?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Activity history</h2>
      {error ? (
        <div className="mt-4">
          <EmptyState title="History could not be loaded" variant="error">
            Refresh the page to try again.
          </EmptyState>
        </div>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No activity has been recorded yet.</p>
      ) : (
        <ol className="mt-5">
          {events.map((event, index) => (
            <li key={event.id} className="relative flex gap-3 pb-7 last:pb-0">
              {index < events.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-[0.4375rem] top-3 h-full w-px bg-slate-200"
                />
              )}
              <span
                aria-hidden="true"
                className={`relative mt-1 size-4 shrink-0 rounded-full border-2 border-white ring-1 ${
                  event.kind === "approved"
                    ? "bg-emerald-500 ring-emerald-600"
                    : event.kind === "changes_requested"
                      ? "bg-rose-500 ring-rose-600"
                      : event.kind === "submitted" || event.kind === "resubmitted"
                        ? "bg-amber-500 ring-amber-600"
                        : "bg-sky-500 ring-sky-600"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="font-semibold text-slate-900">{event.title}</h3>
                  <time
                    dateTime={event.createdAt}
                    className="text-xs text-slate-500"
                  >
                    {new Date(event.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-1 text-sm text-slate-600">{event.actor}</p>
                {event.description && (
                  <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                )}
                {event.feedback && (
                  <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
                    <p className="font-semibold">Feedback</p>
                    <p className="mt-1 whitespace-pre-wrap">{event.feedback}</p>
                  </div>
                )}
                {event.submission && (
                  <div className="mt-3 rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Version {event.submission.version}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                      {event.submission.body}
                    </p>
                    {event.submission.link && (
                      <a
                        href={event.submission.link}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block break-all text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      >
                        Open submitted link
                      </a>
                    )}
                    {event.submission.file_path && (
                      <a
                        href={`/api/files/signed?path=${encodeURIComponent(event.submission.file_path)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 block text-sm font-medium text-indigo-700 underline decoration-indigo-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
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
