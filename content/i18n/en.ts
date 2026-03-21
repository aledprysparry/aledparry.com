import { SiteContent } from "./types";

export const en: SiteContent = {
  meta: {
    siteTitle: "Aled Parry — Digital Producer & Creative Director",
    siteDescription:
      "Digital producer and creative director specialising in bilingual broadcast, content strategy, and format development.",
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
      title: "Digital Producer & Creative Director",
      valueStatement:
        "I help broadcasters and brands create compelling bilingual content that connects with audiences across languages and platforms.",
      cta: "Work with me",
    },
    credibility: {
      heading: "Trusted by",
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
      cta: "Let's talk",
    },
  },
  work: {
    heading: "Work",
    description:
      "A selection of projects spanning broadcast, digital, and content strategy.",
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
      "I offer a focused set of services built on years of experience in broadcast and digital production.",
    items: [
      {
        title: "Digital Production",
        description:
          "End-to-end digital production for broadcast and online platforms. From concept development through to delivery, I manage the full production pipeline.",
        goodFor: "Broadcasters, production companies, digital-first brands",
      },
      {
        title: "Creative Direction",
        description:
          "Strategic creative leadership for campaigns, series, and brand projects. I shape the creative vision and ensure it's executed consistently across every touchpoint.",
        goodFor: "Brands launching campaigns, series producers, content teams",
      },
      {
        title: "Bilingual Content Strategy",
        description:
          "Content strategy that works authentically in both Welsh and English. Not translation — genuine bilingual thinking from the ground up.",
        goodFor:
          "Welsh-language broadcasters, public sector, bilingual organisations",
      },
      {
        title: "Format Development",
        description:
          "Original format creation and development for TV, digital, and social platforms. I develop formats that travel across languages and territories.",
        goodFor: "Broadcasters, distributors, production companies",
      },
    ],
    cta: {
      heading: "Not sure what you need?",
      body: "Let's have a conversation. I can help you figure out the right approach for your project.",
      button: "Get in touch",
    },
  },
  about: {
    heading: "About",
    hero: "I'm a digital producer and creative director based in Wales, working at the intersection of broadcast, technology, and bilingual storytelling.",
    bio: [
      "With over a decade of experience in broadcast and digital production, I've worked with some of the most recognisable names in Welsh and UK media. My work spans television, digital platforms, and brand content.",
      "I specialise in bilingual production — creating content that works authentically in both Welsh and English, not as a translation exercise, but as genuine dual-language storytelling.",
      "Whether it's producing a broadcast series, directing a digital campaign, or developing a new format, I bring the same commitment to craft, clarity, and creative ambition.",
    ],
    skills: {
      heading: "Background",
      items: [
        "Digital Production",
        "Creative Direction",
        "Broadcast Production",
        "Content Strategy",
        "Format Development",
        "Bilingual Content",
        "Project Management",
        "Stakeholder Management",
      ],
    },
    cta: {
      heading: "Let's work together",
      button: "Get in touch",
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
    success: "Thanks for getting in touch. I'll get back to you within 48 hours.",
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
