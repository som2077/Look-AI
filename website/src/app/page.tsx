export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-12">
      <div className="flex max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-black">
          <svg
            viewBox="0 0 24 24"
            className="h-6 w-6 fill-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-black">
          Look AI
        </h1>
        <p className="text-lg text-zinc-600">
          Your AI-powered styling assistant. Find your perfect look in seconds.
        </p>
      </div>
    </main>
  );
}
