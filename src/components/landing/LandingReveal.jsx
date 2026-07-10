import { motion, useReducedMotion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1];

/**
 * Scroll-reveal wrapper for landing sections and cards.
 */
export default function LandingReveal({
  children,
  className = '',
  delay = 0,
  y = 18,
  as = 'div',
  once = true,
}) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (reduceMotion) {
    const Tag = as === 'li' || as === 'article' || as === 'section' ? as : 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </Component>
  );
}

export function LandingStagger({ children, className = '', stagger = 0.06 }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function LandingStaggerItem({ children, className = '', as = 'div' }) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  if (reduceMotion) {
    const Tag = as === 'li' || as === 'article' ? as : 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <Component
      className={className}
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.4, ease: EASE },
        },
      }}
    >
      {children}
    </Component>
  );
}
