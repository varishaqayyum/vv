import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Does Statement Clinic write my personal statement?",
    answer:
      "No. Statement Clinic never writes or rewrites your statement for you. It reviews what you've already written and shows you what's working, what's missing, and what you could develop further — the words stay yours.",
  },
  {
    question: "Is the basic check free?",
    answer:
      "Yes. The structured check covering all three UCAS questions, your quality/skill coverage, and areas to strengthen is completely free.",
  },
  {
    question: "Can I get feedback from a real person?",
    answer:
      "Yes. Alongside the free automated check, you can request a paid Human Review, where a reviewer reads your statement and gives you detailed, question-by-question written feedback.",
  },
  {
    question: "Is Statement Clinic affiliated with UCAS or a university?",
    answer:
      "No. Statement Clinic is an independent tool and isn't affiliated with, endorsed by, or connected to UCAS, Imperial College London, or any other university.",
  },
];

export function Faq() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {FAQS.map((item, i) => (
        <AccordionItem key={item.question} value={`item-${i}`}>
          <AccordionTrigger className="text-left text-base">{item.question}</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
