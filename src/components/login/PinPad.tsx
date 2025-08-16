'use client';

type PinPadProps = {
    pin: string;
    maxLen: number;
    submitting: boolean;
    err?: string;
    onKey: (k: string) => void;
    onSubmit: () => void;
};

export default function PinPad({ pin, maxLen, submitting, err, onKey, onSubmit }: PinPadProps){
  const keys = ["1","2","3","4","5","6","7","8","9","C","0","\u21B5"];
  
  return (
    <div className="rounded-2xl border border-brand-line bg-brand-card p-5">
      <h2 className="text-lg font-semibold text-brand-text mb-4">Enter PIN</h2>

      <div className="flex gap-2 mb-4" role="status" aria-label="PIN progress">
        {Array.from({length:maxLen}).map((_,i)=>
          <div key={i} className={`h-3 w-3 rounded-full ${i<pin.length?'bg-brand-text':'bg-brand-line'}`} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2" role="group" aria-label="PIN keypad">
        {keys.map(k=>(
          <button
            key={k}
            onClick={()=> k==="\u21B5" ? onSubmit() : onKey(k)}
            disabled={submitting}
            className={[
              "rounded-xl py-4 border text-lg transition-colors",
              "bg-black/20 border-brand-line hover:bg-black/40 focus:outline-none focus:ring-2 focus:ring-brand-accent/60",
              k==="\u21B5" ? "col-span-3 bg-brand-accent hover:bg-brand-accent/90 text-white border-transparent" : "",
              submitting ? "opacity-60 cursor-not-allowed" : ""
            ].join(" ")}
            aria-label={k==="\u21B5" ? "Login" : (k==="C" ? "Clear" : `Digit ${k}`)}
          >
            {k==="\u21B5" ? (submitting ? "Logging in\u2026" : "Login") : k}
          </button>
        ))}
      </div>

      {err ? (
        <div className="mt-4 text-sm text-red-400 bg-red-400/10 border border-red-800/40 rounded-lg p-3">
          {err}
        </div>
      ) : null}

    </div>
  );
}
