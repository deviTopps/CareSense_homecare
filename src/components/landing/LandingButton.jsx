import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MotionButton = motion.create(Button);
const MotionLink = motion.create(Link);

const VARIANT_MAP = {
  primary: 'cta',
  ghost: 'outline',
  light: 'outline',
  default: 'default',
  cta: 'cta',
  outline: 'outline',
};

const SIZE_MAP = {
  sm: 'sm',
  md: 'default',
  lg: 'lg',
};

/**
 * Animated landing CTA built on shadcn/ui Button + Motion.
 */
export default function LandingButton({
  children,
  href,
  to,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  showArrow = false,
  type = 'button',
  fullWidth = false,
  ariaLabel,
}) {
  const reduceMotion = useReducedMotion();
  const shadcnVariant = VARIANT_MAP[variant] || 'cta';
  const shadcnSize = SIZE_MAP[size] || 'default';

  const content = (
    <>
      <span>{children}</span>
      {showArrow ? <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /> : null}
    </>
  );

  const motionProps = {
    whileHover: reduceMotion
      ? undefined
      : { y: -2, scale: 1.02, transition: { type: 'spring', stiffness: 420, damping: 22 } },
    whileTap: reduceMotion
      ? undefined
      : { scale: 0.97, y: 0, transition: { type: 'spring', stiffness: 500, damping: 28 } },
  };

  const classes = cn('group', fullWidth && 'w-full', className);

  if (to) {
    return (
      <Button asChild variant={shadcnVariant} size={shadcnSize} className={classes}>
        <MotionLink to={to} onClick={onClick} aria-label={ariaLabel} {...motionProps}>
          {content}
        </MotionLink>
      </Button>
    );
  }

  if (href) {
    return (
      <Button asChild variant={shadcnVariant} size={shadcnSize} className={classes}>
        <motion.a href={href} onClick={onClick} aria-label={ariaLabel} {...motionProps}>
          {content}
        </motion.a>
      </Button>
    );
  }

  return (
    <MotionButton
      type={type}
      variant={shadcnVariant}
      size={shadcnSize}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      {...motionProps}
    >
      {content}
    </MotionButton>
  );
}
