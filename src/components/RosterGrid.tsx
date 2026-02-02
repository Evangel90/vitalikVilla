import React from "react";
import { getDateKey, isSameDay } from "../utils";
import { RosterCard } from "./RosterCard";

type RosterGridProps = {
  weeks: Array<
    Array<{
      date: Date;
      name: string;
      free: boolean;
    }>
  >;
  cleanedDates: Set<string>;
  now: Date;
  confirmations: Record<string, string[]>;
  minConfirmations: number;
  validatorNameByEmail: Record<string, string>;
  currentValidator: { name: string; email: string } | null;
  onConfirm: (date: Date) => Promise<{ ok: boolean; message?: string }>;
  onRemoveConfirmation: (date: Date) => Promise<{ ok: boolean; message?: string }>;
};

export const RosterGrid = ({
  weeks,
  cleanedDates,
  now,
  confirmations,
  minConfirmations,
  validatorNameByEmail,
  currentValidator,
  onConfirm,
  onRemoveConfirmation,
}: RosterGridProps) => {
  const todayRef = React.useRef<HTMLDivElement | null>(null);
  const today = new Date();

  React.useEffect(() => {
    todayRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  return (
    <div className="space-y-10">
      {weeks.map((week, i) => (
        <section key={i}>
          <h2 className="mb-4 text-sm uppercase tracking-wide text-green-400/70">
            Week {i + 1}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {week.map((entry) => {
              const isToday = isSameDay(entry.date, today);
              const dateKey = getDateKey(entry.date);
              const confirmedBy = confirmations[dateKey] ?? [];

              return (
                <div
                  key={entry.date.toISOString()}
                  ref={isToday ? todayRef : null}
                  id={`day-${dateKey}`}
                >
                  <RosterCard
                    {...entry}
                    active={isToday}
                    cleaned={cleanedDates.has(dateKey)}
                    now={now}
                    confirmations={confirmedBy}
                    minConfirmations={minConfirmations}
                    validatorNameByEmail={validatorNameByEmail}
                    currentValidator={currentValidator}
                    onConfirm={onConfirm}
                    onRemoveConfirmation={onRemoveConfirmation}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
