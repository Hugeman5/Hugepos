'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

type PinPadProps = {
  pin: string;
  setPin: Dispatch<SetStateAction<string>>;
  isPending: boolean;
  disabled?: boolean;
};

export function PinPad({ pin, setPin, isPending, disabled = false }: PinPadProps) {
  const handleNumberClick = (num: string) => {
    if (disabled) return;
    if (pin.length < 4) {
      setPin((prev) => prev + num);
    }
  };

  const handleBackspace = () => {
    if (disabled) return;
    setPin((prev) => prev.slice(0, -1));
  };

  const dots = [0, 1, 2, 3];

  return (
    <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2" aria-label="PIN progress">
          {dots.map((i) => (
            <div
              key={i}
              className={
                'h-2.5 w-2.5 rounded-full ' + (i < pin.length ? 'bg-primary' : 'bg-muted-foreground/30')
              }
            />
          ))}
        </div>
        <Input
            type="password"
            value={pin}
            readOnly
            className="w-48 text-center text-2xl tracking-[1rem] font-mono"
            maxLength={4}
            placeholder="••••"
            aria-label="PIN input"
            disabled={disabled}
        />
        <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <Button
                key={num}
                type="button"
                variant="outline"
                className="h-16 w-16 text-2xl"
                onClick={() => handleNumberClick(num.toString())}
                disabled={isPending || disabled}
            >
                {num}
            </Button>
            ))}
            <div className="h-16 w-16"></div> {/* Placeholder */}
            <Button
                type="button"
                variant="outline"
                className="h-16 w-16 text-2xl"
                onClick={() => handleNumberClick('0')}
                disabled={isPending || disabled}
            >
            0
            </Button>
            <Button type="button" variant="outline" className="h-16 w-16" onClick={handleBackspace} disabled={isPending || disabled}>
                <X className="h-8 w-8" />
            </Button>
        </div>
    </div>
  );
}
