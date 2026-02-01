import { RosterCard } from "./RosterCard";
import { useState } from 'react';

export const RosterGrid = () => {
  const players = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    role: "Forward",
    team: "Team Alpha",
  }));
  const [activeId, setActiveId] = useState<number | null>(null);

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
      {players.map((player) => (
        <RosterCard
          key={player.id}
          {...player}
          active={activeId === player.id}
          onClick={() => setActiveId(player.id)}
        />
      ))}
    </section>
  );
}
