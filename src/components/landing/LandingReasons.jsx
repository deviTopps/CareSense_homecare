import { FEATURES_CONTENT } from '../../data/landingContent';
import { FeatureIcon } from './featureIcons';
import LandingSection from './LandingSection';
import { LandingStagger, LandingStaggerItem } from './LandingReveal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingReasons() {
  const { eyebrow, title, subtitle, items } = FEATURES_CONTENT;

  return (
    <LandingSection id="features" eyebrow={eyebrow} title={title} headerAlign="center">
      {subtitle && <p className="cs-section-lead">{subtitle}</p>}
      <LandingStagger className="cs-features__grid" stagger={0.05}>
        {items.map((item) => (
          <LandingStaggerItem key={item.title}>
            <Card className="h-full border-border/80 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <span className="cs-features__icon mb-2" aria-hidden>
                  <FeatureIcon name={item.icon} />
                </span>
                <CardTitle className="font-display text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg leading-relaxed text-muted-foreground">
                  {item.body}
                </CardDescription>
              </CardContent>
            </Card>
          </LandingStaggerItem>
        ))}
      </LandingStagger>
    </LandingSection>
  );
}
