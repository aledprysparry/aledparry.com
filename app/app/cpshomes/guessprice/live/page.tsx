"use client";

import dynamic from "next/dynamic";

const GuessThePrice = dynamic(
  () => import("@/cpshomes/components/GuessThePrice"),
  { ssr: false }
);

export default function LiveDisplayPage() {
  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #000;
          width: 100%;
          height: 100dvh;
        }
        /* Ensure fullscreen on iPad Safari — cover notch/home indicator */
        @supports (padding: env(safe-area-inset-top)) {
          html { padding: 0; }
        }
      `}</style>
      <GuessThePrice displayMode={true} />
    </>
  );
}
