"use client";

export default function Keypad({
  onPress,
  disabled
}: {
  onPress: (k: string) => void;
  disabled?: boolean;
}) {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "↵"];
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map(k => (
        <button
          key={k}
          disabled={disabled}
          onClick={() => onPress(k)}
          className={`rounded-xl border border-[--line] bg-[--muted] text-[--text] py-4 text-lg
                      hover:bg-[#1c2130] ${k === "↵" ? "col-span-3 bg-[var(--accent)] text-black hover:opacity-90" : ""}`}
        >
          {k === "↵" ? "Login" : k}
        </button>
      ))}
    </div>
  );
}
