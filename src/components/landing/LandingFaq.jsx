import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FAQ_CONTENT } from '../../data/landingContent';
import LandingReveal from './LandingReveal';

export default function LandingFaq() {
  const { heading, items } = FAQ_CONTENT;

  return (
    <section className="cs-faq" id="faq" aria-labelledby="faq-heading">
      <div className="cs-container cs-faq__container">
        <LandingReveal>
          <h2 id="faq-heading" className="cs-faq__heading">
            {heading}
          </h2>
        </LandingReveal>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-[clamp(1.125rem,1.8vw,1.3125rem)] text-foreground">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-[clamp(1.0625rem,1.6vw,1.1875rem)] leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
