import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItemProps {
  question: string;
  answer: string;
  value: string;
}

export default function FAQItem({ question, answer, value }: FAQItemProps) {
  return (
    <AccordionItem value={value} className="glassmorphism soft-shadow px-6 py-4 rounded-xl">
      <AccordionTrigger className="text-lg font-semibold text-primary hover:no-underline">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground text-base leading-relaxed pt-2">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}
