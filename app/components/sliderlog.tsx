import Image from "next/image";

const partnerLogos = [
  { name: "Partner 1", src: "/loga/partner1.svg" },
  { name: "Partner 2", src: "/loga/partner2.svg" },
  { name: "Partner 3", src: "/loga/partner3.svg" },
  { name: "Partner 4", src: "/loga/partner4.svg" },
  { name: "Partner 5", src: "/loga/partner5.svg" },
  { name: "Partner 6", src: "/loga/partner6.svg" },
  { name: "Partner 7", src: "/loga/partner7.svg" },
];

export default function SliderLog() {
  // Duplicate array for infinite seamless looping marquee
  const logosToDisplay = [
    ...partnerLogos,
    ...partnerLogos,
    ...partnerLogos,
    ...partnerLogos,
  ];

  return (
    <section className="w-full relative overflow-hidden flex justify-center py-4">
      {/* Left Edge Dark Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-[#0E0E11] to-transparent z-10 pointer-events-none" />

      {/* Right Edge Dark Fade */}
      <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-[#0E0E11] to-transparent z-10 pointer-events-none" />

      {/* Marquee Track Container */}
      <div className="flex w-full overflow-hidden">
        <div className="flex items-center gap-[48px] animate-marquee-reverse whitespace-nowrap">
          {logosToDisplay.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="shrink-0 flex items-center justify-center transition-opacity duration-300 opacity-20 hover:opacity-100 cursor-pointer"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={160}
                height={48}
                className="h-9 md:h-11 w-auto object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
