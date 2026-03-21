export type Locale = "en" | "cy";

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

export interface ServiceItem {
  title: string;
  description: string;
  goodFor: string;
}

export interface SiteContent {
  meta: {
    siteTitle: string;
    siteDescription: string;
  };
  nav: {
    home: string;
    work: string;
    services: string;
    about: string;
    contact: string;
    languageToggle: string;
  };
  home: {
    hero: {
      name: string;
      title: string;
      valueStatement: string;
      cta: string;
    };
    credibility: {
      heading: string;
    };
    featuredWork: {
      heading: string;
      viewAll: string;
    };
    testimonials: {
      heading: string;
      items: Testimonial[];
    };
    footerCta: {
      heading: string;
      body: string;
      cta: string;
    };
  };
  work: {
    heading: string;
    description: string;
    filterAll: string;
    types: Record<string, string>;
  };
  caseStudy: {
    briefLabel: string;
    roleLabel: string;
    approachLabel: string;
    outcomeLabel: string;
    nextProject: string;
    prevProject: string;
    backToWork: string;
  };
  services: {
    heading: string;
    description: string;
    items: ServiceItem[];
    cta: {
      heading: string;
      body: string;
      button: string;
    };
  };
  about: {
    heading: string;
    hero: string;
    bio: string[];
    skills: {
      heading: string;
      items: string[];
    };
    cta: {
      heading: string;
      button: string;
    };
  };
  contact: {
    heading: string;
    description: string;
    form: {
      name: string;
      email: string;
      project: string;
      budget: { label: string; options: string[] };
      timeline: { label: string; options: string[] };
      submit: string;
    };
    success: string;
    error: string;
    directContact: string;
    emailLabel: string;
    linkedinLabel: string;
  };
  footer: {
    copyright: string;
  };
  notFound: {
    heading: string;
    body: string;
    cta: string;
  };
}
