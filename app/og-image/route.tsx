import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fafaf9",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "24px",
              fontWeight: 500,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#64748b",
              fontFamily: "sans-serif",
            }}
          >
            Digital Producer & Creative Director
          </div>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#1c1917",
              lineHeight: 1.1,
            }}
          >
            Aled Parry
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "#78716c",
              maxWidth: "700px",
              textAlign: "center",
              lineHeight: 1.5,
              fontFamily: "sans-serif",
            }}
          >
            Bilingual Welsh/English broadcast, interactive and digital content
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            fontSize: "18px",
            color: "#a8a29e",
            fontFamily: "sans-serif",
          }}
        >
          aledparry.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
