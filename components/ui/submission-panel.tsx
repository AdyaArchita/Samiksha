import type { Submission } from "@/lib/types";

export function SubmissionPanel({ submission }: { submission: Submission }) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">
          Latest submission · Version <span className="tabular">{submission.version}</span>
        </h2>
        <time dateTime={submission.created_at} className="tabular text-xs text-muted">
          {new Date(submission.created_at).toLocaleString()}
        </time>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">
        {submission.body}
      </p>
      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block break-all text-sm font-semibold text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          Open submitted link
        </a>
      )}
      {submission.file_path && (
        <a
          href={`/api/files/signed?path=${encodeURIComponent(submission.file_path)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded text-sm font-semibold text-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          Download attachment
        </a>
      )}
    </section>
  );
}
