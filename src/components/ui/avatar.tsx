"use client";
import Image from "next/image";

export default function Avatar({ src, name, size = 64 }: {
  src?: string;
  name: string;
  size?: number;
}) {
  const initials = name?.trim()?.split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase()).join("") || "U";
  
  return (
    <div
      className="relative rounded-full bg-[var(--muted)] border border-[var(--line)] flex items-center justify-center overflow-hidden"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name} width={size} height={size} className="object-cover" />
      ) : (
        <span
          className="text-[var(--text)]/80 font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
