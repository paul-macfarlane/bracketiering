"use client";

interface ContentionToggleProps {
  value: 1 | 2 | 3;
  onChange: (n: 1 | 2 | 3) => void;
  className?: string;
}

export function ContentionToggle({
  value,
  onChange,
  className,
}: ContentionToggleProps) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className ?? ""}`}>
      <span className="text-muted-foreground">Contention:</span>
      <div className="inline-flex rounded-md border border-border">
        {([1, 2, 3] as const).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`px-2.5 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
              value === n
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {n === 1 ? "1st" : `Top ${n}`}
          </button>
        ))}
      </div>
    </div>
  );
}
