export default function BackgroundVideo() {
  return (
    <div className="absolute top-0 left-0 right-0 w-full h-[700px] md:h-[850px] pointer-events-none overflow-hidden z-0">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover opacity-15"
      >
        <source src="/bgvideo.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0E0E11]" />
    </div>
  );
}
