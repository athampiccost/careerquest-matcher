
import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  Linkedin,
  MessageCircle,
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { JobCatalogueItem } from "@shared/career";

type JobFilters = {
  query: string;
  company: string;
  position: string;
  skill: string;
  jobType: "all" | "job_posting" | "walk_in";
  openDateFrom: string;
  openDateTo: string;
  closedDateFrom: string;
  closedDateTo: string;
  sortBy: "latest" | "closing" | "company";
  limit: number;
};

const emptyFilters: JobFilters = {
  query: "",
  company: "",
  position: "",
  skill: "",
  jobType: "all",
  openDateFrom: "",
  openDateTo: "",
  closedDateFrom: "",
  closedDateTo: "",
  sortBy: "latest",
  limit: 24,
};

function formatDate(value: string | null) {
  if (!value) return "Not listed";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function getJobSource(url: string | null) {
  if (!url) return "Source not listed";

  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("technopark.in")) {
      return "Technopark";
    }

    if (hostname.includes("infopark.in")) {
      return "Infopark";
    }

    return hostname.replace(/^www\./, "");
  } catch {
    return "Source not listed";
  }
}

function shareText(job: JobCatalogueItem) {
  return `${job.role} at ${job.company}${job.url ? `\n${job.url}` : ""}`;
}

function JobCard({ job }: { job: JobCatalogueItem }) {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    shareText(job),
  )}`;

  const linkedInUrl = job.url
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
        job.url,
      )}`
    : null;

  return (
    <article className="rounded-2xl border border-[#dcebef] bg-white/80 p-5 shadow-[0_8px_24px_rgba(26,90,115,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#e7f8f5] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#177a72]">
              {job.jobType === "walk_in" ? "Walk-in" : "Job posting"}
            </span>

            <span className="rounded-full bg-[#e7f2ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#216fc9]">
              {getJobSource(job.url)}
            </span>

            <span className="text-[11px] text-[#75919e]">
              #{job.id}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-bold tracking-[-0.04em] text-[#1c3e54]">
            {job.role}
          </h3>

          <p className="mt-1 text-sm font-semibold text-[#52778a]">
            {job.company}
          </p>
        </div>

        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 text-xs font-bold text-[#216fc9] hover:text-[#12549b]"
          >
            Open listing ↗
          </a>
        )}
      </div>

      <p className="mt-4 text-sm leading-5 text-[#5e7c8b]">
        {job.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {job.skills.map((skill) => (
          <span
            key={skill}
            className="rounded-md bg-[#f0faf9] px-2 py-1 text-[10px] font-semibold text-[#237773]"
          >
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-5 grid gap-2 text-[11px] text-[#668695] sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[#2785d2]" />
          Opened: {formatDate(job.postedDate)}
        </span>

        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-[#ff7568]" />
          Closes: {formatDate(job.closingDate)}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e5f0f2] pt-4">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#e8f9ee] px-3 text-xs font-bold text-[#218a4d] transition-colors hover:bg-[#d3f3df]"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          WhatsApp
        </a>

        {linkedInUrl && (
          <a
            href={linkedInUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#e7f2ff] px-3 text-xs font-bold text-[#216fc9] transition-colors hover:bg-[#d7eaff]"
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        )}
      </div>
    </article>
  );
}

export default function JobExplorer() {
  const [draftFilters, setDraftFilters] = useState<JobFilters>(emptyFilters);
  const [filters, setFilters] = useState<JobFilters>(emptyFilters);

  const jobsQuery = trpc.career.browseJobs.useQuery(filters);

  const setField = <K extends keyof JobFilters>(
    key: K,
    value: JobFilters[K],
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const search = () => {
    setFilters({ ...draftFilters });
  };

  const reset = () => {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  };

  return (
    <section className="mb-9 rounded-[1.7rem] border border-white/90 bg-white/75 p-6 shadow-[0_18px_44px_rgba(18,79,110,0.08)] backdrop-blur-xl sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono-label text-[10px] text-[#168f87]">
            Normal job search
          </p>

          <h2 className="mt-1 text-2xl font-bold tracking-[-0.055em] text-[#18384f]">
            Find a role by company, position, skill, or date
          </h2>

          <p className="mt-2 max-w-3xl text-sm leading-5 text-[#668798]">
            Search the backend job catalogue without uploading a resume. Share
            any listing directly on WhatsApp or LinkedIn.
          </p>
        </div>

        <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[#668798]">
          <BriefcaseBusiness className="h-4 w-4 text-[#2785d2]" />
          {jobsQuery.data?.total ?? 0} results
        </span>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="md:col-span-2">
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Any keyword
          </span>

          <span className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#7ca0ae]" />

            <input
              value={draftFilters.query}
              onChange={(event) =>
                setField("query", event.target.value)
              }
              placeholder="Search jobs, company, or description"
              className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[#53c9c1] focus:ring-2 focus:ring-[#53c9c1]/20"
            />
          </span>
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Company
          </span>

          <input
            value={draftFilters.company}
            onChange={(event) =>
              setField("company", event.target.value)
            }
            placeholder="e.g. Techversant"
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none transition focus:border-[#53c9c1] focus:ring-2 focus:ring-[#53c9c1]/20"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Position
          </span>

          <input
            value={draftFilters.position}
            onChange={(event) =>
              setField("position", event.target.value)
            }
            placeholder="e.g. DevOps Engineer"
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none transition focus:border-[#53c9c1] focus:ring-2 focus:ring-[#53c9c1]/20"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Skillset
          </span>

          <input
            value={draftFilters.skill}
            onChange={(event) =>
              setField("skill", event.target.value)
            }
            placeholder="e.g. Docker, React"
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none transition focus:border-[#53c9c1] focus:ring-2 focus:ring-[#53c9c1]/20"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Job kind
          </span>

          <select
            value={draftFilters.jobType}
            onChange={(event) =>
              setField(
                "jobType",
                event.target.value as JobFilters["jobType"],
              )
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          >
            <option value="all">All kinds</option>
            <option value="job_posting">Job posting</option>
            <option value="walk_in">Walk-in</option>
          </select>
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Open date from
          </span>

          <input
            type="date"
            value={draftFilters.openDateFrom}
            onChange={(event) =>
              setField("openDateFrom", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Open date to
          </span>

          <input
            type="date"
            value={draftFilters.openDateTo}
            onChange={(event) =>
              setField("openDateTo", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Closed date from
          </span>

          <input
            type="date"
            value={draftFilters.closedDateFrom}
            onChange={(event) =>
              setField("closedDateFrom", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Closed date to
          </span>

          <input
            type="date"
            value={draftFilters.closedDateTo}
            onChange={(event) =>
              setField("closedDateTo", event.target.value)
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          />
        </label>

        <label>
          <span className="mono-label mb-1.5 block text-[9px] text-[#577d8e]">
            Sort by
          </span>

          <select
            value={draftFilters.sortBy}
            onChange={(event) =>
              setField(
                "sortBy",
                event.target.value as JobFilters["sortBy"],
              )
            }
            className="h-10 w-full rounded-lg border border-[#d6e9ed] bg-white px-3 text-sm outline-none focus:border-[#53c9c1]"
          >
            <option value="latest">Newest first</option>
            <option value="closing">Closing soon</option>
            <option value="company">Company name</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={search}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#173b55] px-4 text-sm font-bold text-white shadow-[4px_5px_0_#4dd7cb] transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Search jobs
        </button>

        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#cfe5e8] bg-white px-4 text-sm font-semibold text-[#547687] hover:bg-[#f4fbfb]"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
      </div>

      {jobsQuery.isLoading ? (
        <p className="mt-7 text-sm text-[#668798]">
          Loading job listings…
        </p>
      ) : jobsQuery.isError ? (
        <p className="mt-7 rounded-xl bg-[#fff0ed] p-4 text-sm text-[#a84d43]">
          Job listings are temporarily unavailable. Please try again.
        </p>
      ) : jobsQuery.data?.jobs.length ? (
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          {jobsQuery.data.jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      ) : (
        <p className="mt-7 rounded-xl bg-[#f0faf9] p-4 text-sm text-[#52798c]">
          No jobs matched these filters. Try removing a filter or changing the
          dates.
        </p>
      )}
    </section>
  );
}
