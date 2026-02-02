import "./App.css";
import { PageContainer } from "./components/PageContainer";
import { Header } from "./components/Header";
import { RosterGrid } from "./components/RosterGrid";
import { getDateKey, groupByWeek, schedule, PEOPLE, VALIDATORS } from "./utils";
import React from "react";
import { supabase } from "./supabase";

const MIN_CONFIRMATIONS = 3;

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

  const [confirmations, setConfirmations] = React.useState<Record<string, string[]>>({});
  const [userEmail, setUserEmail] = React.useState("");
  const [userPassword, setUserPassword] = React.useState("");
  const [authError, setAuthError] = React.useState("");
  const [authReady, setAuthReady] = React.useState(false);
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<{
    email: string;
  } | null>(null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!supabase) {
      setAuthReady(true);
      return;
    }
    const client = supabase;
    let isMounted = true;
    client.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const email = data.session?.user?.email ?? null;
      setCurrentUser(email ? { email } : null);
      setAuthReady(true);
    });
    const { data: authListener } = client.auth.onAuthStateChange(
      (_event, session) => {
        const email = session?.user?.email ?? null;
        setCurrentUser(email ? { email } : null);
        setAuthReady(true);
      }
    );
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadConfirmations = React.useCallback(async () => {
    if (!supabase) return;
    const client = supabase;
    const { data, error } = await client
      .from("confirmations")
      .select("date, validators");
    if (error) return;
    const next: Record<string, string[]> = {};
    data?.forEach((row) => {
      if (Array.isArray(row.validators)) {
        next[row.date] = row.validators as string[];
      }
    });
    setConfirmations(next);
  }, []);

  React.useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    void loadConfirmations();
    const channel = client
      .channel("confirmations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "confirmations" },
        () => {
          void loadConfirmations();
        }
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [loadConfirmations]);

  const people = React.useMemo(() => {
    return PEOPLE.slice();
  }, []);

  const validatorNameByEmail = React.useMemo(() => {
    const map: Record<string, string> = {};
    VALIDATORS.forEach((validator) => {
      map[validator.email] = validator.name;
    });
    return map;
  }, []);

  const currentValidator = React.useMemo(() => {
    if (!currentUser?.email) return null;
    const name = validatorNameByEmail[currentUser.email];
    if (!name) return null;
    return { name, email: currentUser.email };
  }, [currentUser, validatorNameByEmail]);

  const isUnauthorized =
    currentUser?.email && !validatorNameByEmail[currentUser.email];

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

  const todayKey = React.useMemo(() => getDateKey(getTodayStart()), [now]);
  const todayConfirmations = confirmations[todayKey] ?? [];
  const todayValidated = todayConfirmations.length >= MIN_CONFIRMATIONS;

  const onConfirm = React.useCallback(
    async (date: Date) => {
      if (!currentValidator) {
        return { ok: false, message: "Sign in with a validator account." };
      }
      const key = getDateKey(date);
      const dutyEntry = schedule.find((entry) => getDateKey(entry.date) === key);
      if (dutyEntry && !dutyEntry.free && dutyEntry.name === currentValidator.name) {
        return { ok: false, message: "On-duty person cannot confirm their own cleaning." };
      }
      if (!supabase) {
        return { ok: false, message: "Supabase is not configured yet." };
      }
      const client = supabase;
      try {
        const { data, error } = await client
          .from("confirmations")
          .select("validators")
          .eq("date", key)
          .maybeSingle();
        if (error) throw error;
        const existing = Array.isArray(data?.validators) ? data?.validators : [];
        if (existing.includes(currentValidator.email)) {
          return { ok: true };
        }
        const next = [...existing, currentValidator.email];
        const { error: upsertError } = await client
          .from("confirmations")
          .upsert(
            {
              date: key,
              validators: next,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "date" }
          );
        if (upsertError) throw upsertError;
        return { ok: true };
      } catch {
        return { ok: false, message: "Unable to confirm right now." };
      }
    },
    [currentValidator]
  );

  const onRemoveConfirmation = React.useCallback(
    async (date: Date) => {
      if (!currentValidator) {
        return { ok: false, message: "Sign in with a validator account." };
      }
      if (!supabase) {
        return { ok: false, message: "Supabase is not configured yet." };
      }
      const client = supabase;
      try {
        const key = getDateKey(date);
        const { data, error } = await client
          .from("confirmations")
          .select("validators")
          .eq("date", key)
          .maybeSingle();
        if (error) throw error;
        const existing = Array.isArray(data?.validators) ? data?.validators : [];
        if (!existing.includes(currentValidator.email)) {
          return { ok: true };
        }
        const next = existing.filter(
          (email: string) => email !== currentValidator.email
        );
        const { error: upsertError } = await client
          .from("confirmations")
          .upsert(
            {
              date: key,
              validators: next,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "date" }
          );
        if (upsertError) throw upsertError;
        return { ok: true };
      } catch {
        return { ok: false, message: "Unable to remove right now." };
      }
    },
    [currentValidator]
  );

  const cleanedDates = React.useMemo(() => {
    const cleaned = new Set<string>();
    Object.entries(confirmations).forEach(([key, list]) => {
      if (list.length >= MIN_CONFIRMATIONS) {
        cleaned.add(key);
      }
    });
    return cleaned;
  }, [confirmations]);

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

  const onSignIn = React.useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setAuthError("");
      setIsSigningIn(true);
      if (!supabase) {
        setAuthError("Supabase is not configured yet.");
        setIsSigningIn(false);
        return;
      }
      const client = supabase;
      try {
        const { error } = await client.auth.signInWithPassword({
          email: userEmail,
          password: userPassword,
        });
        if (error) throw error;
        setUserPassword("");
      } catch {
        setAuthError("Sign-in failed. Check email and password.");
      } finally {
        setIsSigningIn(false);
      }
    },
    [userEmail, userPassword]
  );

  const onSignOut = React.useCallback(async () => {
    if (!supabase) return;
    const client = supabase;
    await client.auth.signOut();
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
                  {getDateKey(nextDuty.date) === todayKey && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-wide text-green-200/70">
                      <span>Today</span>
                      {todayValidated && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-400/50 bg-green-500/10 px-2 py-0.5 text-[10px] text-green-100">
                          ✓ Validated
                        </span>
                      )}
                    </div>
                  )}
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

          <div className="space-y-4">
            <div className="rounded-2xl border border-green-900/60 bg-[#111c16] p-5">
              <p className="text-xs uppercase tracking-wide text-green-300/70">
                Validator Access
              </p>
              <div className="mt-4">
                {!supabase ? (
                  <div className="space-y-2 text-xs text-green-200/70">
                    <p>Supabase is not configured yet.</p>
                    <p>Add your keys to <span className="text-green-100">.env</span> and restart the dev server.</p>
                  </div>
                ) : authReady ? (
                  currentUser ? (
                    <div className="space-y-3 text-sm text-green-200/80">
                      <div>
                        Signed in as{" "}
                        <span className="font-semibold text-green-100">
                          {currentUser.email}
                        </span>
                      </div>
                      {currentValidator ? (
                        <div className="text-[11px] text-green-200/60">
                          Validator: {currentValidator.name}
                        </div>
                      ) : (
                        <div className="text-[11px] text-red-300/80">
                          This email is not on the validator list.
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={onSignOut}
                        className="rounded-full border border-green-900/60 px-3 py-1 text-[10px] uppercase tracking-wide text-green-200 hover:border-green-700/80"
                      >
                        Sign out
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={onSignIn} className="space-y-3">
                      <input
                        type="email"
                        value={userEmail}
                        onChange={(event) => setUserEmail(event.target.value)}
                        placeholder="Email"
                        className="w-full rounded-lg border border-green-900/70 bg-[#0f1a14] px-3 py-2 text-sm text-green-100"
                        required
                      />
                      <input
                        type="password"
                        value={userPassword}
                        onChange={(event) => setUserPassword(event.target.value)}
                        placeholder="Password"
                        className="w-full rounded-lg border border-green-900/70 bg-[#0f1a14] px-3 py-2 text-sm text-green-100"
                        required
                      />
                      {authError && (
                        <p className="text-xs text-red-300/80">{authError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={isSigningIn}
                        className="w-full rounded-full border border-green-400/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-green-100 transition hover:border-green-300/80 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSigningIn ? "Signing in..." : "Sign in"}
                      </button>
                    </form>
                  )
                ) : (
                  <p className="text-xs text-green-200/70">Loading auth...</p>
                )}
                {isUnauthorized && (
                  <p className="mt-2 text-[11px] text-red-300/80">
                    Update the validator email list in `src/utils.ts`.
                  </p>
                )}
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
            now={now}
            confirmations={confirmations}
            minConfirmations={MIN_CONFIRMATIONS}
            validatorNameByEmail={validatorNameByEmail}
            currentValidator={currentValidator}
            onConfirm={onConfirm}
            onRemoveConfirmation={onRemoveConfirmation}
          />
        )}
      </PageContainer>
    </main>
  );
}
