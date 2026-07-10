import { Shield, Lock, MapPin, CircleCheck } from 'lucide-react';
import { SECURITY_CONTENT } from '../../data/landingContent';
import LandingSection from './LandingSection';
import { LandingStagger, LandingStaggerItem } from './LandingReveal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ICONS = [Shield, Lock, MapPin, CircleCheck];

export default function LandingSecurity() {
  const { eyebrow, title, subtitle, items } = SECURITY_CONTENT;

  return (
    <LandingSection id="security" eyebrow={eyebrow} title={title} headerAlign="center" variant="muted">
      {subtitle ? <p className="cs-section-lead">{subtitle}</p> : null}
      <LandingStagger className="cs-security__grid" stagger={0.05}>
        {items.map((item, index) => {
          const Icon = ICONS[index] || Shield;
          return (
            <LandingStaggerItem key={item.title}>
              <Card className="h-full shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-start gap-3 space-y-0 pb-2">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle className="font-display text-xl pt-1.5">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pl-[3.75rem]">
                  <CardDescription className="text-lg leading-relaxed">{item.body}</CardDescription>
                </CardContent>
              </Card>
            </LandingStaggerItem>
          );
        })}
      </LandingStagger>
    </LandingSection>
  );
}
