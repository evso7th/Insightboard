
import Dashboard from "@/components/dashboard";
import { loadSampleData } from "@/lib/data";

export default async function Home() {
  const initialData = await (loadSampleData() as any);
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Dashboard initialData={initialData} />
    </main>
  );
}
