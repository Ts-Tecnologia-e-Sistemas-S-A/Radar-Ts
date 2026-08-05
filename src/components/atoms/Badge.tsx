import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'blue' | 'purple' | 'rose' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'purple',
  size = 'md',
  icon,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-bold',
    md: 'text-xs px-2.5 py-1 font-extrabold',
  };

  const variantStyles = {
    emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    amber: 'bg-amber-100 text-amber-900 border border-amber-300',
    blue: 'bg-blue-100 text-blue-900 border border-blue-300',
    purple: 'bg-purple-100 text-purple-900 border border-purple-300',
    rose: 'bg-rose-100 text-rose-900 border border-rose-300',
    slate: 'bg-slate-100 text-slate-800 border border-slate-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
