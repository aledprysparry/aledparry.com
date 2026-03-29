"use client";

import dynamic from "next/dynamic";
import Head from "next/head";

const GuessThePrice = dynamic(
  () => import("@/components/demos/GuessThePrice"),
  { ssr: false }
);

export default function LiveDisplayPage() {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </Head>
      <style jsx global>{`
        html, body { margin: 0; padding: 0; overflow: hidden; background: #000; }
        body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
      `}</style>
      <GuessThePrice displayMode={true} />
    </>
  );
}
