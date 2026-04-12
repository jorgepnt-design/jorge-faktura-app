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
        bg-white rounded-2xl shadow-sm border border-slate-100
        ${paddingClasses[padding]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-200 transition-all active:scale-[0.99] w-full text-left' : ''}
        ${className}
      `}
    >
      {children}
    </Tag>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, color = 'text-brand-600 bg-brand-50', onClick }: StatCardProps) {
  return (
    <Card onClick={onClick} padding="md">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
          <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
      </div>
    </Card>
  );
}
