import { TRUSTED_BY } from '../../data/landingContent';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function LandingTrust() {
  const { label, items } = TRUSTED_BY;

  return (
    <section className="cs-trust" aria-label="Who CareSense is built for">
      <div className="cs-container">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <p className="text-base font-semibold text-muted-foreground">{label}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {items.map((item) => (
              <Badge key={item} variant="secondary" className="rounded-full px-4 py-1.5 text-base font-semibold">
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <Separator className="mt-5" />
      </div>
    </section>
  );
}
