import React from "react";
import {weeks, isSameDay} from "../utils";
import { RosterCard } from "./RosterCard";

export const RosterGrid = () => {
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

              return (
                <div
                  key={entry.date.toISOString()}
                  ref={isToday ? todayRef : null}
                >
                  <RosterCard
                    {...entry}
                    active={isToday}
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
