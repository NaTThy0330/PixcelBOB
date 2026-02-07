import React from 'react';
import { cn } from './ui/utils';

interface PixelCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const PixelCard: React.FC<PixelCardProps> = ({ 
  children, 
  className, 
  title 
}) => {
  return (
    <div className={cn(
      `bg-white border-4 border-gray-800 
       shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)]
       pixel-card relative`,
      className
    )}>
      {title && (
        <div className="bg-blue-600 border-b-4 border-gray-800 px-4 py-2">
          <h3 className="text-white font-mono">{title}</h3>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};