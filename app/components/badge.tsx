interface BadgeProps {
  tag?: string;
  text?: string;
}

export default function Badge({
  tag = "New",
  text = "Platforma e-commerce",
}: BadgeProps) {
  return (
    <div className="inline-flex items-center pl-[4px] pt-[4px] pb-[4px] pr-[8px] bg-[#0E0E11]/75 backdrop-blur-md border border-white/[0.08] rounded-[6px] gap-[6px]">
      <span className="bg-[#FF5B28] text-white text-[12px] font-semibold px-[8px] py-[2px] rounded-[4px] leading-none inline-flex items-center justify-center">
        {tag}
      </span>
      <span className="text-[#A1A1AA] text-[14px] font-normal leading-none">
        {text}
      </span>
    </div>
  );
}
