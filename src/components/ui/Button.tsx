
import React from "react";
import { Slot } from "@radix-ui/react-slot"

export function Button({
  children,
  className = "",
  variant = "primary",
  asChild = false,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const Comp = asChild ? Slot : "button"
  
  const base = "px-4 py-3 rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
  
  const map = {
    primary: "bg-[--accent] text-black hover:opacity-90",
    secondary: "bg-[--muted] text-[--text] hover:bg-[#1c2130]",
    danger: "bg-[--danger] text-black hover:opacity-90",
    ghost: "hover:bg-accent/10 hover:text-accent-foreground",
  };
  
  return <Comp className={`${base} ${map[variant]} ${className}`} {...props}>{children}</Comp>;
}
