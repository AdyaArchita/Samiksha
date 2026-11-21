"use client";

import Link from "next/link";
import { Button } from "./button";
import type { TaskFilter, TaskSort } from "@/lib/task-presentation";
import { buildTaskListHref } from "@/lib/task-presentation";

export function TaskListControls({
  pathname,
  query,
  sort,
  status,
}: {
  pathname: string;
  query: string;
  sort: TaskSort;
  status: TaskFilter;
}) {
  const clearSearchHref = buildTaskListHref(pathname, { status, sort });

  return (
    <form
      action={pathname}
      method="get"
      className="flex flex-wrap items-end gap-3"
    >
      {status !== "all" && (
        <input type="hidden" name="status" value={status} />
      )}
      <div className="min-w-[14rem] flex-1">
        <label
          htmlFor="task-search"
          className="text-sm font-medium text-foreground"
        >
          Search tasks
        </label>
        <span className="mt-1 flex">
          <input
            id="task-search"
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search title or assignee"
            className={`min-h-11 w-full border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent [&::-webkit-search-cancel-button]:appearance-none ${
              query ? "rounded-l-lg" : "rounded-lg"
            }`}
          />
          {query && (
            <Link
              href={clearSearchHref}
              aria-label="Clear search"
              title="Clear search"
              className="grid min-h-11 w-11 shrink-0 place-items-center rounded-r-lg border border-l-0 border-border bg-surface text-lg font-medium text-muted hover:bg-background focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            >
              <span aria-hidden="true">×</span>
            </Link>
          )}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <label
          htmlFor="task-sort"
          className="whitespace-nowrap text-sm font-medium text-foreground"
        >
          Sort by
        </label>
        <select
          id="task-sort"
          name="sort"
          defaultValue={sort}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="min-h-11 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        >
          <option value="due_asc">Due date (soonest first)</option>
          <option value="due_desc">Due date (latest first)</option>
          <option value="updated_desc">Recently updated</option>
        </select>
      </div>
      <Button
        type="submit"
        variant="secondary"
        className="min-h-11"
      >
        Search
      </Button>
    </form>
  );
}
