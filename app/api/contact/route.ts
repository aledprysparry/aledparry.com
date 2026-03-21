import { NextResponse } from "next/server";

const rateLimitMap = new Map<string, number>();

function cleanup() {
  const now = Date.now();
  rateLimitMap.forEach((timestamp, ip) => {
    if (now - timestamp > 10 * 60 * 1000) {
      rateLimitMap.delete(ip);
    }
  });
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const now = Date.now();
  const lastSent = rateLimitMap.get(ip);

  if (lastSent && now - lastSent < 10 * 60 * 1000) {
    return NextResponse.json(
      { error: "Please wait before sending another message." },
      { status: 429 }
    );
  }

  let body: {
    name?: string;
    email?: string;
    project?: string;
    budget?: string;
    timeline?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, project, budget, timeline } = body;

  if (!name || !email || !project) {
    return NextResponse.json(
      { error: "Name, email, and project description are required." },
      { status: 400 }
    );
  }

  try {
    // Dynamic import so the app doesn't crash if resend isn't configured
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "aledparry.com <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || "hello@aledparry.com",
      subject: `New enquiry from ${name}`,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        `Project: ${project}`,
        `Budget: ${budget || "Not specified"}`,
        `Timeline: ${timeline || "Not specified"}`,
      ].join("\n"),
    });

    rateLimitMap.set(ip, now);
    if (rateLimitMap.size > 100) cleanup();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message." },
      { status: 500 }
    );
  }
}
