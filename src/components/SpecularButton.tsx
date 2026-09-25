import { type ButtonHTMLAttributes, useRef } from 'react';

type SpecularButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  intensity?: number;
  tint?: string;
};

export default function SpecularButton({
  children,
  className = '',
  intensity = 0.8,
  tint = '#2ba8a0',
  onPointerMove,
  onPointerLeave,
  ...props
}: SpecularButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <button
      {...props}
      ref={buttonRef}
      className={`button specular-button ${className}`.trim()}
      style={{ '--specular-intensity': intensity, '--specular-tint': tint } as React.CSSProperties}
      onPointerMove={(event) => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (rect) {
          event.currentTarget.style.setProperty('--pointer-x', `${event.clientX - rect.left}px`);
          event.currentTarget.style.setProperty('--pointer-y', `${event.clientY - rect.top}px`);
        }
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.setProperty('--pointer-x', '50%');
        event.currentTarget.style.setProperty('--pointer-y', '0%');
        onPointerLeave?.(event);
      }}
    >
      <span>{children}</span>
      <span aria-hidden="true">↗</span>
    </button>
  );
}