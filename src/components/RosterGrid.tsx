import { RosterCard } from "./RosterCard";
// import { useState, useEffect } from 'react';
// import { SkeletonCard } from "./SkeletonCard";
import {roster, isSameDay} from '../App';

export const RosterGrid = () => {
  // const players = Array.from({ length: 12 }).map((_, i) => ({
  //   id: i,
  //   name: `Player ${i + 1}`,
  //   role: "Forward",
  //   team: "Team Alpha",
  // }));
  // const [activeId, setActiveId] = useState<number | null>(null);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const t = setTimeout(() => setLoading(false), 1200);
  //   return () => clearTimeout(t);
  // }, []);

  const today = new Date();

  return (
    <section
      className="
        grid
        grid-cols-1
        sm:grid-cols-2
        lg:grid-cols-3
        xl:grid-cols-4
        gap-4
        sm:gap-6
      "
    >
      {roster.map((entry) => (
        <RosterCard
          key={entry.id}
          name={entry.name}
          role={entry.role}
          date={entry.date}
          active={isSameDay(entry.date, today)}
        />
      ))}
    </section>
  );
}
