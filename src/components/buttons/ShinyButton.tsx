import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

/** Mit href wird ein Link gerendert, sonst ein Button. */
type ShinyButtonProps =
  | (ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined })
  | (AnchorHTMLAttributes<HTMLAnchorElement> & { href: string });

/**
 * ref/elements/shiny_button.tsx with the same animation model (orbiting conic rim, dual
 * additive rotation, dot trail, breathing inner light). The rim is a dispersed white light:
 * a white core with spectral fringes that opens into the full spectrum on hover.
 */
export function ShinyButton({ children, className = '', ...props }: ShinyButtonProps) {
  if (props.href !== undefined) {
    return <a {...props} className={`ds-shiny ${className}`}><span>{children}</span></a>;
  }
  const { type = 'button', ...rest } = props;
  return (
    <button {...rest} type={type} className={`ds-shiny ${className}`}>
      <span>{children}</span>
    </button>
  );
}

export default ShinyButton;
