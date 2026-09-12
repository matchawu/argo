export default function Loading() {
  return (
    <main className="min-h-screen text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="animate-pulse">
          <div className="h-8 w-40 rounded-lg bg-zinc-800" />

          <div className="mt-3 h-4 w-56 rounded bg-zinc-900" />

          <div className="mt-8 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-24 rounded-2xl border border-zinc-800 bg-zinc-900"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}