import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-300 p-4">  
      <div className="text-center">
        <h1 className="mb-4 text-5xl font-bold text-gray-800">
          Welcome to Hidden Word Duel
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Multiplayer word guessing game
        </p>
        <div>
          <Link href="/login" className="rounded-md bg-primary px-6 py-3 font-bold text-white hover:bg-primary-hover">
            Let's Play
          </Link>
        </div>
      </div>
    </div>
  );
}
