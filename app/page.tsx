import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-10 px-6 py-16 text-center">
      <div>
        <h1 className="text-3xl font-semibold">name as many as you can in 3 minutes</h1>
      </div>

      <div className="flex w-full flex-col gap-4">
        <Link href="/play/women" className="text-lg underline underline-offset-4">
          name a woman
        </Link>
        <Link href="/play/men" className="text-lg underline underline-offset-4">
          name a man
        </Link>
        <Link href="/play/games" className="text-lg underline underline-offset-4">
          name a video game
        </Link>
      </div>
    </main>
  );
}
