import type { Submission } from "@/lib/types";

export function SubmissionPanel({ submission }: { submission: Submission }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Latest submission · Version {submission.version}
        </h2>
        <time dateTime={submission.created_at} className="text-xs text-slate-500">
          {new Date(submission.created_at).toLocaleString()}
        </time>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
        {submission.body}
      </p>
      {submission.link && (
        <a
          href={submission.link}
          target="_blank"
          rel="noreferrer"
          className="mt-4 block break-all text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Open submitted link
        </a>
      )}
      {submission.file_path && (
        <a
          href={`/api/files/signed?path=${encodeURIComponent(submission.file_path)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex rounded text-sm font-semibold text-indigo-700 underline decoration-indigo-300 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          Download attachment
        </a>
      )}
    </section>
  );
}
