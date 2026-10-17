import { SITE_URL } from "./site";

/** Stable @id for the Person node defined on /about; other pages reference it instead of re-describing the author. */
export const PERSON_ID = `${SITE_URL}/about/#person`;

export const personJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/about`,
      mainEntity: { "@id": PERSON_ID },
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Benedict Neo",
      url: `${SITE_URL}/about`,
      description:
        "Machine learning engineer at OpenEvidence in Miami, working on AI for healthcare. Previously glioma research at UCSF, co-authoring papers on embedding models and LLM evaluation for oncology; data science intern at Tesla in 2022 and 2023.",
      jobTitle: "Machine Learning Engineer",
      worksFor: {
        "@type": "Organization",
        name: "OpenEvidence",
        url: "https://www.openevidence.com",
      },
      affiliation: {
        "@type": "Organization",
        name: "University of California, San Francisco",
        url: "https://www.ucsf.edu",
      },
      alumniOf: [
        { "@type": "CollegeOrUniversity", name: "Iowa State University" },
        { "@type": "CollegeOrUniversity", name: "University of San Francisco" },
      ],
      knowsAbout: [
        "Machine Learning",
        "Large Language Models",
        "Medical AI",
        "Radiation Oncology",
        "Clinical NLP",
      ],
      award:
        "AAPM John R. Cameron Early-Career Investigator Symposium, 3rd Place (2025)",
      sameAs: [
        "https://scholar.google.com/citations?user=E76b3pMAAAAJ",
        "https://orcid.org/0000-0001-7520-3839",
        "https://www.linkedin.com/in/benedictneo/",
        "https://github.com/benthecoder",
        "https://benedictxneo.medium.com",
        "https://devpost.com/benthecoder",
        "https://www.kaggle.com/benthecoder",
        "https://huggingface.co/benthecoder",
        "https://www.youtube.com/@benxneo",
      ],
    },
  ],
};
