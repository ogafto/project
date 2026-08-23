"use client";

import React, { useState, useEffect } from "react";

export default function BackgroundVideo() {
  const [videoError, setVideoError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || videoError) {
    return (
      <div className="absolute top-0 left-0 right-0 w-full h-[700px] md:h-[850px] pointer-events-none overflow-hidden z-0 select-none bg-[#0E0E11]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-[#0E0E11]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0E0E11]/60 to-[#0E0E11]" />
      </div>
    );
  }

  return (
    <div className="absolute top-0 left-0 right-0 w-full h-[700px] md:h-[850px] pointer-events-none overflow-hidden z-0 select-none bg-[#0E0E11]">
      <video
        autoPlay
        loop
        muted
        playsInline
        onError={() => setVideoError(true)}
        className="w-full h-full object-cover opacity-15"
      >
        <source src="/bgvideo.mp4" type="video/mp4" onError={() => setVideoError(true)} />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0E0E11]/60 to-[#0E0E11]" />
    </div>
  );
}
