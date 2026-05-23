import { SiteContent } from "./types";

export const en: SiteContent = {
  meta: {
    siteTitle: "Aled Parry – Creative Technologist & Founder",
    siteDescription:
      "Creative technologist and founder working between media, AI and bilingual digital products. BAFTA-winning background in broadcast and interactive content. Builder of Nodiadau.com.",
  },
  nav: {
    home: "Home",
    work: "Work",
    services: "Services",
    about: "About",
    contact: "Contact",
    languageToggle: "CY",
  },
  home: {
    hero: {
      name: "Aled Parry",
      title: "Creative Technologist & Founder",
      valueStatement:
        "Hello & croeso! I work at the intersection of media formats, AI infrastructure and bilingual digital products. From scaling national daily gaming rituals like Cwis Bob Dydd to building bilingual AI tools like Nodiadau.com, I design and engineer products that solve complex media and workflow challenges. BAFTA winner. Bilingual in English and Welsh.",
      cta: "Read the full story",
    },
    credibility: {
      heading: "Worked with",
    },
    featuredWork: {
      heading: "Selected Work",
      viewAll: "View all projects",
    },
    testimonials: {
      heading: "What people say",
      items: [
        {
          quote:
            "Aled brought a rare combination of creative vision and technical expertise to our project. The results exceeded our expectations.",
          author: "Sarah Jones",
          role: "Head of Digital, S4C",
        },
        {
          quote:
            "Working with Aled transformed our approach to bilingual content. He understands both languages and both audiences.",
          author: "Rhodri Davies",
          role: "Executive Producer, BBC Cymru Wales",
        },
        {
          quote:
            "A true creative collaborator who delivers on time and on brief, every time.",
          author: "Elin Williams",
          role: "Brand Director, Tinopolis",
        },
      ],
    },
    footerCta: {
      heading: "Got a project in mind?",
      body: "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.",
      cta: "Get in touch",
    },
  },
  work: {
    heading: "Work",
    description:
      "A product and case study archive spanning founder projects, broadcast formats, AI tooling and creative pipelines.",
    filterAll: "All",
    types: {
      broadcast: "Broadcast",
      digital: "Digital",
      content: "Content",
      format: "Format",
    },
  },
  caseStudy: {
    briefLabel: "The Brief",
    roleLabel: "My Role",
    approachLabel: "Approach",
    outcomeLabel: "Outcome",
    nextProject: "Next project",
    prevProject: "Previous project",
    backToWork: "Back to all work",
  },
  services: {
    heading: "Services",
    description:
      "Three pillars of work, built on years of moving between broadcast, digital product and AI infrastructure.",
    items: [
      {
        title: "Product Strategy & Adaptation",
        description:
          "Bringing formats to life. Navigating regulatory compliance, structuring user retention loops, and converting traditional broadcast and media formats into digital-first products that audiences actually return to. The work behind Cwis Bob Dydd and Cwis-iau.",
        goodFor: "Broadcasters, format owners, education and public-sector teams",
      },
      {
        title: "Creative Workflow & Pipeline Engineering",
        description:
          "Lowering production bottlenecks. Designing custom, lightweight technical tools – browser-based live graphics engines, optimised CGI/VFX pipelines, automated social cut-down systems – that let lean teams deliver broadcast-quality output on a fraction of the budget.",
        goodFor: "Indie producers, in-house studios, broadcast teams working lean",
      },
      {
        title: "Bilingual AI Integration",
        description:
          "Protecting linguistic integrity. Engineering specialised, context-aware AI tools and language applications that streamline bilingual workflows and automation without watering down minoritised languages. The work behind Nodiadau.com.",
        goodFor: "Welsh-language broadcasters, bilingual organisations, public sector",
      },
    ],
    groups: [
      {
        title: "Production & Content",
        items: [
          {
            title: "Freelance Producer",
            description:
              "Broadcast, branded and digital-first production across factual, entertainment and social content. Experienced in agile workflows, multi-platform delivery and rapid-turnaround productions.",
            goodFor: "Broadcasters, production companies, agencies",
          },
          {
            title: "Shooting Producer / Cameraman",
            description:
              "Self-shooting producer and DOP for lean, agile productions – broadcasters, agencies and direct-to-brand clients.",
            goodFor: "Lean productions, mid-tier docs, branded content",
          },
        ],
      },
      {
        title: "Digital & Product",
        items: [
          {
            title: "Digital Producer",
            description:
              "Developing audience-focused digital experiences, interactive formats and social-first workflows that bridge production and technology.",
            goodFor: "Broadcasters, brands and agencies launching digital products",
          },
          {
            title: "Creative Technology",
            description:
              "Building bilingual AI tools, live graphics systems and workflow automation for Welsh and English media teams.",
            goodFor: "Welsh-language broadcasters, bilingual organisations, public sector",
          },
        ],
      },
    ],
    cta: {
      heading: "Not sure where your project fits?",
      body: "Most interesting briefs sit across two of these. Let's talk through it.",
      button: "Get in touch",
    },
  },
  about: {
    heading: "About",
    hero: "I\u2019m a creative technologist and founder working between media formats, AI infrastructure and bilingual digital products.",
    bio: [
      "My background is broadcast and interactive media \u2013 over twenty years of producing programmes, apps, games and content for S4C, BBC, CBBC, ITV, Sesame Street and more. A BAFTA winner with a Graphic Communication grounding that still shapes how I approach storytelling, design and user experience.",
      "More recently I\u2019ve become much more interested in the technology behind the content. Nodiadau.com is the obvious example \u2013 a language tool I had to build because no one else was going to build it properly for Welsh.",
    ],
    sections: [
      {
        heading: "The Foundation",
        intro: "Two decades of work in some of the most demanding corners of media:",
        items: [
          "BAFTA-winning interactive and digital projects",
          "Daily-engagement formats for S4C and broadcasters",
          "Children\u2019s and family content for CBBC, Sesame Street and CYW",
          "Bilingual Welsh / English productions across TV and digital",
          "Format development, production management and creative direction",
        ],
        outro: "That work built the editorial instinct and operational discipline that everything else sits on.",
      },
      {
        heading: "The Friction",
        intro: "Over time, the same handful of systemic problems kept getting in the way of good work:",
        items: [
          "Rigid compliance laws blocking young audiences from joining quiz formats",
          "Indie filmmakers priced out of high-end VFX and post-production",
          "Generic AI tools quietly watering down the nuance of the Welsh language",
          "Broadcasters expecting creators to self-fund increasingly polished pilots",
          "Bilingual teams losing hours to admin that should be automated",
        ],
        outro: "Each of those problems was easier to engineer around than to manage around.",
      },
      {
        heading: "The Evolution",
        intro: "So the work moved upstream \u2013 from managing these problems to building software that fixes them:",
        items: [
          "Nodiadau.com \u2013 bilingual dictation and AI productivity for Welsh / English teams",
          "Live browser-based graphics tooling for lean pilot production",
          "Open-source VFX pipelines making cinematic worldbuilding accessible to indies",
          "Classroom-safe spin-offs of audience formats, like Cwis-iau",
        ],
        outro: "Nodiadau isn\u2019t a side-project. It\u2019s the inevitable culmination of every previous part of the job.",
      },
    ],
    skills: {
      heading: "Skills & Experience",
      items: [
        "Product Strategy",
        "Creative Direction",
        "Digital Production",
        "Format Development",
        "AI Tooling & Workflow",
        "Bilingual (English & Welsh)",
        "UX & UI Design",
        "Frontend Engineering",
        "Live Graphics & Pipeline Tools",
        "Team Leadership",
      ],
    },
    cta: {
      heading: "Let\u2019s Work Together",
      button: "Get in touch \u2192",
    },
  },
  contact: {
    heading: "Contact",
    description:
      "Have a project in mind? I'd love to hear about it. Fill in the form below or reach out directly.",
    form: {
      name: "Name",
      email: "Email",
      project: "Tell me about your project",
      budget: {
        label: "Budget range",
        options: [
          "Under £5,000",
          "£5,000 – £15,000",
          "£15,000 – £50,000",
          "£50,000+",
          "Not sure yet",
        ],
      },
      timeline: {
        label: "Timeline",
        options: [
          "Less than 1 month",
          "1–3 months",
          "3–6 months",
          "6+ months",
          "Ongoing / retainer",
        ],
      },
      submit: "Send message",
    },
    success: "Your mail app should be opening with the message ready to send. Hit send when you're happy with it and I'll get back to you within 48 hours.",
    error: "Something went wrong. Please try again or email me directly.",
    directContact: "Or reach out directly",
    emailLabel: "Email",
    linkedinLabel: "LinkedIn",
  },
  footer: {
    copyright: "© {year} Aled Parry. All rights reserved.",
  },
  notFound: {
    heading: "Page not found",
    body: "The page you're looking for doesn't exist or has been moved.",
    cta: "Go home",
  },
};
