import "./App.css";
import { PageContainer } from "./components/PageContainer";
import { Header } from "./components/Header";
import { RosterGrid } from "./components/RosterGrid";
import { getDateKey, groupByWeek, schedule } from "./utils";
import React from "react";

const CLEANED_STORAGE_KEY = "vitalikvilla.cleaned";

const getTodayStart = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const formatCountdown = (targetDate: Date, now: Date) => {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Today";

  const totalMinutes = Math.floor(diff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

export default function App() {
  const [personFilter, setPersonFilter] = React.useState("All");
  const [weekFilter, setWeekFilter] = React.useState<"all" | number>("all");
  const [next7Only, setNext7Only] = React.useState(false);
  const [now, setNow] = React.useState(new Date());

  const [cleanedDates, setCleanedDates] = React.useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(CLEANED_STORAGE_KEY);
      if (!stored) return new Set();
      return new Set(JSON.parse(stored));
    } catch {
      return new Set();
    }
  });

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const payload = JSON.stringify(Array.from(cleanedDates));
    localStorage.setItem(CLEANED_STORAGE_KEY, payload);
  }, [cleanedDates]);

  const people = React.useMemo(() => {
    const names: string[] = [];
    schedule.forEach((entry) => {
      if (!entry.free && !names.includes(entry.name)) {
        names.push(entry.name);
      }
    });
    return names;
  }, []);

  const allWeeks = React.useMemo(() => groupByWeek(schedule), []);
  const weekRanges = React.useMemo(
    () =>
      allWeeks.map((week, index) => ({
        index,
        start: week[0].date,
        end: week[week.length - 1].date,
      })),
    [allWeeks]
  );

  const filteredEntries = React.useMemo(() => {
    let entries = schedule.slice();

    if (personFilter !== "All") {
      entries = entries.filter(
        (entry) => !entry.free && entry.name === personFilter
      );
    }

    if (weekFilter !== "all") {
      const range = weekRanges.find((week) => week.index === weekFilter);
      if (range) {
        entries = entries.filter(
          (entry) => entry.date >= range.start && entry.date <= range.end
        );
      }
    }

    if (next7Only) {
      const start = getTodayStart();
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      entries = entries.filter(
        (entry) => entry.date >= start && entry.date <= end
      );
    }

    return entries;
  }, [personFilter, weekFilter, next7Only, weekRanges]);

  const filteredWeeks = React.useMemo(
    () => groupByWeek(filteredEntries),
    [filteredEntries]
  );

  const nextDuty = React.useMemo(() => {
    const today = getTodayStart();
    return schedule.find((entry) => !entry.free && entry.date >= today);
  }, [now]);

  const onToggleCleaned = React.useCallback((date: Date) => {
    const key = getDateKey(date);
    setCleanedDates((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const onJumpToNext = React.useCallback(() => {
    if (!nextDuty) return;
    const id = `day-${getDateKey(nextDuty.date)}`;
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [nextDuty]);

  const resetFilters = React.useCallback(() => {
    setPersonFilter("All");
    setWeekFilter("all");
    setNext7Only(false);
  }, []);

  return (
    <main
      className="
        min-h-screen
        bg-[#0f1a14]
        text-[#e6f2ea]
      "
    >
      <PageContainer>
        <Header />

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-green-800/60 bg-[#132019] p-5">
            <p className="text-xs uppercase tracking-wide text-green-300/70">
              Next up
            </p>
            {nextDuty ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {nextDuty.name}
                  </h2>
                  <p className="text-sm text-green-300/70">
                    {nextDuty.date.toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-green-200">
                    {formatCountdown(nextDuty.date, now)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-green-300/70">
                No more duty days on this schedule.
              </p>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onJumpToNext}
                disabled={!nextDuty}
                className="rounded-full border border-green-400/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-100 transition hover:border-green-300/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Jump to next duty
              </button>
              <button
                type="button"
                onClick={() => setNext7Only((value) => !value)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  next7Only
                    ? "border-green-300/80 bg-green-400/10 text-green-100"
                    : "border-green-900/60 text-green-200 hover:border-green-700/80"
                }`}
              >
                {next7Only ? "Showing next 7 days" : "Show next 7 days"}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-green-900/60 bg-[#111c16] p-5">
            <p className="text-xs uppercase tracking-wide text-green-300/70">
              Filters
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-green-200/70">
                Person
                <select
                  className="mt-2 w-full rounded-lg border border-green-900/70 bg-[#0f1a14] px-3 py-2 text-sm text-green-100"
                  value={personFilter}
                  onChange={(event) => setPersonFilter(event.target.value)}
                >
                  <option value="All">All</option>
                  {people.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-green-200/70">
                Week
                <select
                  className="mt-2 w-full rounded-lg border border-green-900/70 bg-[#0f1a14] px-3 py-2 text-sm text-green-100"
                  value={weekFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setWeekFilter(value === "all" ? "all" : Number(value));
                  }}
                >
                  <option value="all">All weeks</option>
                  {weekRanges.map((week) => (
                    <option key={week.index} value={week.index}>
                      Week {week.index + 1}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-green-200/70">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={next7Only}
                  onChange={(event) => setNext7Only(event.target.checked)}
                  className="h-4 w-4 rounded border-green-700 bg-[#0f1a14]"
                />
                Next 7 days only
              </label>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border border-green-900/60 px-3 py-1 text-[10px] uppercase tracking-wide text-green-200 hover:border-green-700/80"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {filteredWeeks.length === 0 ? (
          <div className="rounded-2xl border border-green-900/60 bg-[#111c16] p-8 text-center text-sm text-green-200/70">
            Nothing matches these filters yet.
          </div>
        ) : (
          <RosterGrid
            weeks={filteredWeeks}
            cleanedDates={cleanedDates}
            onToggleCleaned={onToggleCleaned}
            now={now}
          />
        )}
      </PageContainer>
    </main>
  );
}
