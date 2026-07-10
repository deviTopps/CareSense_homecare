import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, MapPin, FileText } from 'lucide-react';
import LandingButton from './LandingButton';
import { HERO_CONTENT } from '../../data/landingContent';
import { Badge } from '@/components/ui/badge';

const HIGHLIGHT_ICONS = [CalendarDays, MapPin, FileText];

export default function LandingHero() {
  const { brand, title, titleAccent, subtitle, primaryCta, secondaryCta, highlights } = HERO_CONTENT;
  const titleParts = title.split(titleAccent);
  const reduceMotion = useReducedMotion();

  const rise = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <section className="cs-hero" id="home" aria-labelledby="hero-title">
      <div className="cs-hero__atmosphere" aria-hidden>
        <span className="cs-hero__orb cs-hero__orb--a" />
        <span className="cs-hero__orb cs-hero__orb--b" />
        <span className="cs-hero__orb cs-hero__orb--c" />
        <span className="cs-hero__grid" />
      </div>

      <div className="cs-container cs-hero__inner">
        <div className="cs-hero__copy">
          <motion.div {...rise(0)}>
            <Badge className="cs-hero__badge border-0 bg-primary/15 text-primary hover:bg-primary/20 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide">
              <span className="cs-hero__flag" aria-hidden>
                <svg viewBox="0 0 36 24" width="22" height="15" role="img">
                  <rect width="36" height="8" y="0" fill="#CE1126" />
                  <rect width="36" height="8" y="8" fill="#FCD116" />
                  <rect width="36" height="8" y="16" fill="#006B3F" />
                  <polygon
                    points="18,9.2 18.9,11.8 21.7,11.8 19.4,13.4 20.3,16 18,14.4 15.7,16 16.6,13.4 14.3,11.8 17.1,11.8"
                    fill="#000"
                  />
                </svg>
              </span>
              {brand}
            </Badge>
          </motion.div>

          <motion.h1 id="hero-title" className="cs-hero__title" {...rise(0.06)}>
            {titleParts[0]}
            <span className="cs-hero__title-accent">{titleAccent}</span>
            {titleParts[1] || ''}
          </motion.h1>

          <motion.p className="cs-hero__lede" {...rise(0.12)}>
            {subtitle}
          </motion.p>

          <motion.div className="cs-hero__cta" {...rise(0.18)}>
            <LandingButton href={primaryCta.href} size="lg" showArrow className="cs-hero__btn">
              {primaryCta.label}
            </LandingButton>
            {secondaryCta ? (
              <LandingButton to={secondaryCta.href} variant="ghost" size="lg" className="cs-hero__btn">
                {secondaryCta.label}
              </LandingButton>
            ) : null}
          </motion.div>

          {highlights?.length ? (
            <motion.ul className="cs-hero__highlights" {...rise(0.24)}>
              {highlights.map((item, index) => {
                const Icon = HIGHLIGHT_ICONS[index] || CalendarDays;
                return (
                  <li key={item} className="cs-hero__highlight">
                    <Icon className="size-4" aria-hidden />
                    <span>{item}</span>
                  </li>
                );
              })}
            </motion.ul>
          ) : null}
        </div>

        <motion.div
          className="cs-hero__visual"
          {...(reduceMotion
            ? {}
            : {
                initial: { opacity: 0, y: 28, scale: 0.98 },
                animate: { opacity: 1, y: 0, scale: 1 },
                transition: { duration: 0.7, delay: 0.28, ease: [0.22, 1, 0.36, 1] },
              })}
        >
          <div className="cs-hero__glow" aria-hidden />
          <div className="cs-device" role="img" aria-label="CareSense dashboard in a browser window">
            <div className="cs-device__chrome">
              <div className="cs-device__dots" aria-hidden>
                <span className="cs-device__dot cs-device__dot--red" />
                <span className="cs-device__dot cs-device__dot--yellow" />
                <span className="cs-device__dot cs-device__dot--green" />
              </div>
              <div className="cs-device__address">
                <span className="cs-device__lock" aria-hidden />
                <span className="cs-device__url">caresense.health</span>
              </div>
            </div>
            <div className="cs-device__screen">
              <img
                src="/mockups/optimized/HomePage.jpg"
                alt="CareSense dashboard showing visits and patient overview"
                className="cs-hero__img"
                width={1200}
                height={750}
                decoding="async"
                fetchPriority="high"
                loading="eager"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
