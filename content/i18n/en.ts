import { SiteContent } from "./types";

export const en: SiteContent = {
  meta: {
    siteTitle: "Aled Parry — Award-Winning Digital Producer & Creative Director",
    siteDescription:
      "BAFTA-winning digital producer and creative director. Over 20 years creating interactive content, games, websites and apps for S4C, BBC, ITV, Sesame Street and more. Bilingual in English and Welsh.",
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
      title: "Award-Winning Digital Producer & Creative Director",
      valueStatement:
        "Hello & chroeso! I produce and create video content, games, websites and apps for broadcasters and brands worldwide. BAFTA winner. Bilingual in English and Welsh.",
      cta: "Work with me",
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
    hero: "I'm a BAFTA-winning digital producer and creative director based in Wales, with over 25 years of experience leading interactive content for broadcasters and brands across the UK and beyond.",
    bio: [
      "I started as a print and branding designer at the moment digital was emerging \u2014 and made the move early, retraining as a web designer and front-end developer. That combination of design instinct and technical fluency has defined everything I\u2019ve done since.",
      "As Creative Director at Cube Interactive, I led the team to become a leading provider of interactive digital content for S4C, BBC, Channel 4, ITV and Microsoft. Our work won multiple BAFTAs and Broadcast Digital Awards \u2014 including projects spanning children\u2019s apps for Teletubbies and Sesame Street, interactive game shows for Catchphrase and Family Fortunes, and original formats like Ludus, one of the world\u2019s first live play-along formats for children.",
      "More recently I\u2019ve been working with Tinint, part of the Tinopolis Group, creating digital productions and bringing stories to life as a self-shooting producer and editor \u2014 from filming through to final cut.",
      "I also build custom production tools that combine my creative and technical background to make workflows faster and smarter.",
      "Bilingual in English and Welsh, I bring genuine dual-language thinking to every project \u2014 not translation, but authentic content that connects with both audiences from the start.",
    ],
    skills: {
      heading: "Skills & Experience",
      items: [
        "Creative Direction",
        "Digital Production",
        "UX & UI Design",
        "Graphic & Web Design",
        "Project Management",
        "Interactive Content",
        "App Development",
        "Bilingual (English & Welsh)",
        "Adobe Creative Suite",
        "Team Leadership",
      ],
    },
    cta: {
      heading: "Got a project in mind?",
      button: "Let\u2019s talk \u2192",
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
