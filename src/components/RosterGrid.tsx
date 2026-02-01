import { RosterCard } from "./RosterCard";

export const RosterGrid = () => {
  const players = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    name: `Player ${i + 1}`,
    role: "Forward",
    team: "Team Alpha",
  }));

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
        <RosterCard key={player.id} {...player} />
      ))}
    </section>
  );
}
