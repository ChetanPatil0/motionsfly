import React from "react";

export function RazorpayIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.7 0L4.2 16.8H10.5L7 28L21.7 11.2H15.4L18.9 0H14.7Z"
        fill="#0C2340"
        className="fill-[#0C2340] dark:fill-white"
      />
      <text
        x="26"
        y="20"
        fill="#0C2340"
        className="fill-[#0C2340] dark:fill-white"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="17"
        letterSpacing="-0.5"
      >
        Razorpay
      </text>
    </svg>
  );
}

export function PaypalIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 26" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.8 2.2H4.1C3.6 2.2 3.2 2.6 3.1 3.1L0.8 17.7C0.7 18.1 1.0 18.5 1.5 18.5H4.8L5.7 12.8C5.8 12.3 6.2 11.9 6.7 11.9H8.7C12.7 11.9 15.2 9.9 15.8 6.1C16.1 4.5 15.6 3.4 14.7 2.7C13.7 2.2 12.3 2.2 10.8 2.2Z"
        fill="#003087"
      />
      <path
        d="M18.8 6.1C18.2 9.9 15.7 11.9 11.7 11.9H9.7C9.2 11.9 8.8 12.3 8.7 12.8L7.3 21.6C7.2 22.0 7.5 22.4 7.9 22.4H11.5C11.9 22.4 12.3 22.1 12.4 21.6L13.2 16.5C13.3 16.1 13.6 15.7 14.1 15.7H14.9C18.3 15.7 21.0 14.3 21.8 10.3C22.1 8.7 22.0 7.4 21.2 6.5C20.6 6.2 19.8 6.1 18.8 6.1Z"
        fill="#0079C1"
      />
      <text
        x="28"
        y="19"
        fill="#003087"
        className="fill-[#003087] dark:fill-[#0079C1]"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="18"
        fontStyle="italic"
        letterSpacing="-0.5"
      >
        PayPal
      </text>
    </svg>
  );
}

export function VisaBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-bold text-[10px] tracking-wider text-blue-700 bg-blue-50 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60 ${className}`}
    >
      VISA
    </span>
  );
}

export function MastercardBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-[10px] text-zinc-800 bg-zinc-100 border border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-800 ${className}`}
    >
      <span className="flex -space-x-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#EB001B]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#F79E1B]/90" />
      </span>
      <span>MC</span>
    </span>
  );
}

export function RupayBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-[10px] text-cyan-800 bg-cyan-50 border border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/60 ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#097938]" />
      <span>RuPay</span>
    </span>
  );
}

export function UpiBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-bold text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 ${className}`}
    >
      <span className="text-amber-500 font-extrabold">▲</span>
      <span>UPI / GPay</span>
    </span>
  );
}

export function NetbankingBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 font-medium text-[10px] text-violet-800 bg-violet-50 border border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800/60 ${className}`}
    >
      NetBanking
    </span>
  );
}

export function AmexBadge({ className = "h-5" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded px-1.5 py-0.5 font-bold text-[10px] tracking-wider text-sky-700 bg-sky-50 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60 ${className}`}
    >
      AMEX
    </span>
  );
}

export function StripeIcon({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M59.64 14.28c0-4.47-2.18-8.03-7.04-8.03-4.88 0-7.85 3.56-7.85 8s3.23 8.08 8.44 8.08c2.51 0 4.41-.57 5.86-1.48v-3.77c-1.45.85-3.1 1.34-5.18 1.34-2.1 0-3.92-.85-4.2-3.14h10c.03-.31.04-.69.04-1.08h-.07zm-10-1.44c.16-2.13 1.83-3.05 3.19-3.05 1.32 0 2.94.92 3.1 3.05h-6.29zm-9.76-6.59c-2.02 0-3.32.96-3.96 1.77V.48h-4.87v21.57h4.87v-9.67c0-2.31 1.7-3.8 3.8-3.8.44 0 .9.05 1.25.16V6.4a8.3 8.3 0 00-1.09-.15zm-14.77 1.8c-.85-.92-2.17-1.8-4.28-1.8-3.93 0-6.9 3.54-6.9 8.05 0 4.49 2.99 8.03 6.9 8.03 2.11 0 3.43-.88 4.28-1.8v1.52h4.88V6.25h-4.88v1.8zm-3.37 10.36c-2.39 0-3.95-1.92-3.95-4.41 0-2.52 1.56-4.44 3.95-4.44 2.36 0 3.92 1.92 3.92 4.44 0 2.49-1.56 4.41-3.92 4.41zM11.69 8.6c0-.98.81-1.63 2.12-1.63 1.9 0 4.3.59 6.2 1.63V4.49C18.11 3.65 15.82 3.3 13.81 3.3c-4.88 0-8.1 2.55-8.1 6.8 0 6.64 9.13 5.58 9.13 8.44 0 1.15-1 1.74-2.4 1.74-2.1 0-4.8-.82-6.91-2.01v4.25c2.35.98 4.88 1.43 6.91 1.43 5.06 0 8.4-2.5 8.4-6.83 0-7.14-9.15-5.83-9.15-8.52z"
        fill="#635BFF"
      />
    </svg>
  );
}

