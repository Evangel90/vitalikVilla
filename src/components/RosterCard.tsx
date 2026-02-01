type CardProps = {
  name: string;
  role: string;
  team: string;
};

export const RosterCard = ({ name, role, team }: CardProps) => {
  return (
    <div
      className="
        rounded-xl
        border
        border-gray-200
        bg-white
        p-4
        sm:p-5
        hover:shadow-md
        transition
      "
    >
      <div className="flex items-center gap-3">
        <div
          className="
            h-10 w-10
            sm:h-12 sm:w-12
            rounded-full
            bg-gray-200
          "
        />

        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-medium truncate">
            {name}
          </h3>

          <p className="text-xs sm:text-sm text-gray-500">
            {role} · {team}
          </p>
        </div>
      </div>
    </div>
  );
}
