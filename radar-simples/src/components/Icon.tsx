interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  className?: string;
}

/** Ícone Material Symbols — carregado via Google Fonts em index.html. */
export default function Icon({ name, size = 20, filled = false, className = '' }: IconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size, fontVariationSettings: filled ? "'FILL' 1" : undefined }}
    >
      {name}
    </span>
  );
}
