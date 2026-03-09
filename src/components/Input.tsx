import { type InputHTMLAttributes, forwardRef } from 'react';

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = '', ...props }, ref) => (
    <input
      ref={ref}
      className={`h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] ${className}`}
      {...props}
    />
  )
);

Input.displayName = 'Input';
export default Input;
