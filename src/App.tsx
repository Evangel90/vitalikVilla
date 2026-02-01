import "./App.css";
import { PageContainer } from "./components/PageContainer";
import { Header } from "./components/Header";
import { RosterGrid } from "./components/RosterGrid";

const startDate = new Date(2026, 1, 1); // Feb = 1 (0-indexed)
const endDate = new Date(2026, 3, 30);  // April = 3

const generateDates = (start: Date, end: Date) => {
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

const dates = generateDates(startDate, endDate);

export const roster = dates.map((date, index) => ({
  id: index,
  name: `Person ${index + 1}`,
  role: "On Duty",
  date,
}));

export const isSameDay = (a: Date, b: Date) => {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


export default function App() {
  return (
    <main
      className="
    min-h-screen
    bg-gray-950
    text-gray-100
  "
    >
      <PageContainer>
        <Header />
        <RosterGrid />
      </PageContainer>
    </main>
  );
}
