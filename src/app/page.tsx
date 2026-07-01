export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-blue-50">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-600 rounded-full mb-4"></div>
        <div className="text-xl font-semibold text-blue-900">Loading...</div>
      </div>
    </div>
  );
}
