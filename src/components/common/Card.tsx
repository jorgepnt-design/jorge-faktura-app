import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
};

export default function Card({ children, className = '', onClick, padding = 'md' }: CardProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      onClick={onClick}
      className={`
        bg-white rounded-2xl shadow-card border border-slate-100
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer hover:shadow-card-hover hover:border-slate-200 transition-all active:scale-[0.99] w-full text-left' : ''}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}
