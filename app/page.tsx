import BadgeUp from "./components/badgeup";
import BackgroundVideo from "./components/BackgroundVideo";
import Hero from "./components/hero";
import SliderLog from "./components/sliderlog";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full bg-[#0E0E11] text-white flex flex-col justify-between overflow-hidden pb-[48px]">
      <BackgroundVideo />

      {/* Top Banner */}
      <div className="relative z-10 flex flex-col w-full">
        <BadgeUp />
      </div>

      {/* Centered Hero with Logo & Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-8 sm:py-12">
        <Hero />
      </div>

      {/* Bottom Slider */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SliderLog />
      </div>
    </main>
  );
}




