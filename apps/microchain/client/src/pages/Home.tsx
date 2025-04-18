import Terminal from "@/components/Terminal/Terminal";

export default function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black font-['VT323',monospace]">
      <Terminal />
    </div>
  );
}
