"use client";

import clsx from "clsx";

interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "textarea" | "select";
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  required?: boolean;
  className?: string;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  options,
  required = false,
  className,
}: FormFieldProps) {
  const inputClasses =
    "w-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 font-sans placeholder:text-stone-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors";

  return (
    <div className={clsx("space-y-1.5", className)}>
      <label
        htmlFor={name}
        className="block text-sm font-sans font-medium text-stone-700"
      >
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={5}
          className={inputClasses}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClasses}
        >
          <option value="">—</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={inputClasses}
        />
      )}
    </div>
  );
}
