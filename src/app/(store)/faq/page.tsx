import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

export const metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Do I need an account to buy a product?",
    a: "No. Guest checkout is available for one-time purchases of products and tutorials — you'll receive your invoice and secure download link by email. A registered account is only required for subscriptions, so we can track renewals and give you ongoing access.",
  },
  {
    q: "How do secure downloads work?",
    a: "After payment is confirmed, we generate a private, time-limited download link. Links expire after a set period and allow a limited number of downloads, both shown in your account or order confirmation email.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major Credit/Debit Cards (Visa, Mastercard, RuPay, American Express), UPI (Google Pay, PhonePe, Paytm), Netbanking for customers in India, and Stripe or PayPal for international payments (USD). All available options are displayed at checkout.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Yes. Cancel from Account → Subscription at any time. You'll keep premium access until the end of your current billing period — no partial refund is issued for the remaining time.",
  },
  {
    q: "What's the difference between Paid and Premium tutorials?",
    a: "Paid tutorials are purchased individually, once, like a product. Premium tutorials are included with an active subscription — as soon as your subscription lapses, premium access is removed.",
  },
  {
    q: "Can I get a refund?",
    a: "See our Refund & Cancellation Policy for details — in short, digital products are non-refundable once downloaded except in the case of a verified technical issue.",
  },
];

export default function FaqPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h1>
      <p className="mt-2 text-muted-foreground">Answers to common questions about orders, downloads, and subscriptions.</p>

      <Accordion type="single" collapsible className="mt-8">
        {FAQS.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent>{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
