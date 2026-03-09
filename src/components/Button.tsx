import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border';

    const variants: Record<string, string> = {
      default:
        'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--primary))] hover:brightness-110',
      outline:
        'bg-transparent border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
      ghost: 'bg-transparent border-transparent text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]',
      secondary:
        'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border-[hsl(var(--border))] hover:brightness-110',
    };

    const sizes: Record<string, string> = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-8 w-8 p-0',
    };

    return (
      <button ref={ref} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
