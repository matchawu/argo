import { createClient } from "@/lib/supabase/server";

export default async function TestDbPage() {
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("*");

  if (error) {
    return (
      <main className="p-10">
        <h1>Database Error</h1>
        <pre>{error.message}</pre>
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="mb-6 text-3xl font-bold">
        Supabase Lessons
      </h1>

      <pre>
        {JSON.stringify(lessons, null, 2)}
      </pre>
    </main>
  );
}