import { AUDIENCE_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';
import { LandingStagger, LandingStaggerItem } from './LandingReveal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingAudience() {
  const { eyebrow, title, items } = AUDIENCE_CONTENT;

  return (
    <LandingSection id="audience" eyebrow={eyebrow} title={title} headerAlign="center">
      <LandingStagger className="cs-audience__grid" stagger={0.05}>
        {items.map((item) => (
          <LandingStaggerItem key={item.title}>
            <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="font-display text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg leading-relaxed">{item.body}</CardDescription>
              </CardContent>
            </Card>
          </LandingStaggerItem>
        ))}
      </LandingStagger>
    </LandingSection>
  );
}
