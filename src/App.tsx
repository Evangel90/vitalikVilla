import "./App.css";
import { PageContainer } from "./components/PageContainer";
import { Header } from "./components/Header";
import { RosterGrid } from "./components/RosterGrid";

export default function App() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <PageContainer>
        <Header />
        <RosterGrid/>
      </PageContainer>
    </main>
  );
}
