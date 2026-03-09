import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ options, className = '', ...props }, ref) => (
  <select
    ref={ref}
    className={`h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] ${className}`}
    {...props}
  >
    {options.map((opt) => (
      <option key={opt} value={opt}>
        {opt}
      </option>
    ))}
  </select>
));

Select.displayName = 'Select';
export default Select;
