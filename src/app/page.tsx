import Dashboard from "@/components/dashboard";
import { loadSampleData } from "@/lib/data";

export default function Home() {
  const initialData = loadSampleData();
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Dashboard initialData={initialData} />
    </main>
  );
}
