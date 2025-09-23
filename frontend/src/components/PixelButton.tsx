import React from 'react';
import { cn } from './ui/utils';

interface PixelButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export const PixelButton: React.FC<PixelButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    border-4 border-solid
    pixel-button
    transition-all duration-100
    image-rendering-pixelated
    select-none
    font-mono
  `;

  const variantClasses = {
    primary: `
      bg-blue-500 border-blue-600 text-white
      hover:bg-blue-400 hover:border-blue-500
      active:bg-blue-600 active:border-blue-700
      shadow-[4px_4px_0px_0px_rgba(37,99,235,0.8)]
      hover:shadow-[2px_2px_0px_0px_rgba(37,99,235,0.8)]
      active:shadow-[1px_1px_0px_0px_rgba(37,99,235,0.8)]
    `,
    secondary: `
      bg-gray-500 border-gray-600 text-white
      hover:bg-gray-400 hover:border-gray-500
      active:bg-gray-600 active:border-gray-700
      shadow-[4px_4px_0px_0px_rgba(75,85,99,0.8)]
      hover:shadow-[2px_2px_0px_0px_rgba(75,85,99,0.8)]
      active:shadow-[1px_1px_0px_0px_rgba(75,85,99,0.8)]
    `,
    success: `
      bg-green-500 border-green-600 text-white
      hover:bg-green-400 hover:border-green-500
      active:bg-green-600 active:border-green-700
      shadow-[4px_4px_0px_0px_rgba(34,197,94,0.8)]
      hover:shadow-[2px_2px_0px_0px_rgba(34,197,94,0.8)]
      active:shadow-[1px_1px_0px_0px_rgba(34,197,94,0.8)]
    `,
    danger: `
      bg-red-500 border-red-600 text-white
      hover:bg-red-400 hover:border-red-500
      active:bg-red-600 active:border-red-700
      shadow-[4px_4px_0px_0px_rgba(239,68,68,0.8)]
      hover:shadow-[2px_2px_0px_0px_rgba(239,68,68,0.8)]
      active:shadow-[1px_1px_0px_0px_rgba(239,68,68,0.8)]
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm min-h-8',
    md: 'px-4 py-2 text-base min-h-10',
    lg: 'px-6 py-3 text-lg min-h-12',
  };

  const disabledClasses = disabled
    ? 'bg-gray-300 border-gray-400 text-gray-500 cursor-not-allowed shadow-none'
    : '';

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabledClasses,
        className
      )}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};