import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'borderless';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-xl border transition-all duration-200 overflow-hidden';

  const variants = {
    default: 'bg-white border-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.02)]',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)]',
    borderless: 'bg-slate-50 border-transparent'
  };

  const hoverStyles = hoverable
    ? 'hover:border-slate-200 hover:translate-y-[-2px] hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)]'
    : '';

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
