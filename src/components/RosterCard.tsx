type CardProps = {
  name: string;
  role: string;
  team: string;
  active?: boolean;
  onClick?: () => void;
};


export const RosterCard = ({ name, role, team, active, onClick }: CardProps) => {
  return (
    <div
      tabIndex={0}
      onClick={onClick}
      className={`
        rounded-xl
        border
        bg-white
        p-4
        sm:p-5

        transition
        duration-200
        ease-out
        cursor-pointer

        ${active
          ? "border-gray-900 shadow-lg"
          : "border-gray-200 hover:-translate-y-0.5 hover:shadow-lg hover:border-gray-300"
        }

        focus:outline-none
        focus:ring-2
        focus:ring-gray-900
        focus:ring-offset-2
      `}
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gray-200" />

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

