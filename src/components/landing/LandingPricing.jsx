import { Check } from 'lucide-react';
import { PRICING_CONTENT } from '../../data/landingContent';
import LandingButton from './LandingButton';
import LandingReveal, { LandingStagger, LandingStaggerItem } from './LandingReveal';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LandingPricing() {
  const { heading, description, perPatient, setup, example } = PRICING_CONTENT;

  return (
    <section className="cs-pricing" id="pricing" aria-labelledby="pricing-heading">
      <div className="cs-container">
        <LandingReveal className="cs-pricing__intro">
          <h2 id="pricing-heading" className="cs-pricing__heading">
            {heading}
          </h2>
          {description && <p className="cs-pricing__description">{description}</p>}
        </LandingReveal>

        <LandingStagger className="cs-pricing__layout" stagger={0.08}>
          <LandingStaggerItem>
            <Card className="border-0 bg-primary text-primary-foreground shadow-lg">
              <CardHeader>
                <div className="flex items-baseline gap-2">
                  <CardTitle className="font-display text-5xl md:text-6xl tracking-tight text-white">
                    {perPatient.price}
                  </CardTitle>
                  <span className="text-lg text-white/80">{perPatient.unit}</span>
                </div>
                <CardDescription className="text-lg text-white/80 max-w-md">
                  {perPatient.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {perPatient.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-base md:text-lg text-white">
                      <Check className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <LandingButton
                  href={perPatient.buttonUrl}
                  showArrow
                  className="bg-white text-primary hover:bg-white/90"
                >
                  {perPatient.buttonText}
                </LandingButton>
              </CardFooter>
            </Card>
          </LandingStaggerItem>

          <LandingStaggerItem className="flex flex-col gap-4">
            <Card className="shadow-sm">
              <CardHeader>
                <Badge variant="secondary" className="w-fit mb-1 text-sm">
                  {setup.label}
                </Badge>
                <CardTitle className="font-display text-3xl md:text-4xl">{setup.price}</CardTitle>
                <CardDescription className="text-lg">{setup.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {setup.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-base md:text-lg text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {example ? (
              <Card className="border-primary/20 bg-primary/5 shadow-none">
                <CardHeader className="pb-3">
                  <Badge variant="outline" className="w-fit border-primary/30 text-primary text-sm">
                    {example.label}
                  </Badge>
                  <CardDescription className="text-lg font-semibold text-foreground pt-1">
                    {example.text}
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}
          </LandingStaggerItem>
        </LandingStagger>
      </div>
    </section>
  );
}
