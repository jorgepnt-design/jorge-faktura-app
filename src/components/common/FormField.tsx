import React from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, required, error, hint, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`
        w-full h-10 px-3 rounded-xl border bg-white text-sm text-slate-900
        dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500
        placeholder:text-slate-400 transition-colors
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600
        ${error ? 'border-red-400' : 'border-slate-300'}
        ${className}
      `}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`
        w-full px-3 py-2.5 rounded-xl border bg-white text-sm text-slate-900
        dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-500
        placeholder:text-slate-400 transition-colors resize-y min-h-[80px]
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600
        ${error ? 'border-red-400' : 'border-slate-300'}
        ${className}
      `}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`
        w-full h-10 px-3 rounded-xl border bg-white text-sm text-slate-900
        dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100
        transition-colors appearance-none
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
        disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900 dark:disabled:text-slate-600
        ${error ? 'border-red-400' : 'border-slate-300'}
        ${className}
      `}
    >
      {children}
    </select>
  );
}
