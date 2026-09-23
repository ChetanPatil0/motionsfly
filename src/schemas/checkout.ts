import { z } from "zod";

export const checkoutSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  billingName: z.string().trim().min(2, "Name is required").max(150),
  billingAddress: z.string().trim().min(5, "Address is required").max(300),
  billingCity: z.string().trim().min(1, "City is required").max(100),
  billingCountry: z.string().trim().min(2, "Country is required").max(2), // ISO code
  billingPostalCode: z.string().trim().min(1, "Postal code is required").max(20),
  couponCode: z.string().trim().optional(),
  provider: z.enum(["RAZORPAY", "STRIPE", "PAYPAL"]),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;
