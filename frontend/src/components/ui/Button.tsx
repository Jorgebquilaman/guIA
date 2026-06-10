import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Spinner from './Spinner'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-iupa-green text-white hover:bg-iupa-green-secondary focus:ring-iupa-green',
  secondary: 'bg-iupa-green-light text-iupa-green hover:bg-[#d0ebe5] focus:ring-iupa-green',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-iupa-dark hover:bg-iupa-green-light focus:ring-iupa-green',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, children, disabled, className, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]}${className ? ` ${className}` : ''}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  ),
)

Button.displayName = 'Button'

export default Button
