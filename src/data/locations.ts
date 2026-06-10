import type { ProfileLocation } from '@/types/profile';

export const locations: ProfileLocation[] = [
  {
    id: "san-francisco",
    city: "San Francisco",
    lat: 37.774,
    lng: -122.419,
    color: "#60a5fa",
    connectionType: "live",
    subEntries: [
      {
        emoji: "🏗️",
        role: "Senior Software Engineer",
        company: "TechCorp Inc.",
        place: "📍 California",
        description:
          "Building scalable cloud-native platforms. Reduced infra provisioning time by 90% with reusable IaC modules. Full observability stack: metrics, traces, and incident response.",
        date: "Jan 2024 — Present",
      },
      {
        emoji: "🎓",
        role: "B.S. Computer Science",
        place: "State University",
        description:
          "Graduated 2022. Cloud Certified Solutions Architect.",
        date: "2018 — 2022",
      },
    ],
  },
  {
    id: "new-york",
    city: "New York",
    lat: 40.712,
    lng: -74.006,
    color: "#34d399",
    connectionType: "worked",
    subEntries: [
      {
        emoji: "💼",
        role: "Software Engineer",
        company: "StartupXYZ",
        place: "📍 New York, NY",
        description:
          "Designed and shipped full-stack features for a high-growth fintech platform. Owned backend services handling millions of daily transactions.",
        date: "Jun 2022 — Dec 2023",
      },
      {
        emoji: "🛠️",
        role: "SWE Intern",
        company: "StartupXYZ",
        place: "📍 New York, NY",
        description:
          "Built serverless microservices and internal tooling. Improved CI pipeline speed by 40%.",
        date: "May 2021 — Aug 2021",
      },
    ],
  },
  {
    id: "austin",
    city: "Austin",
    lat: 30.267,
    lng: -97.743,
    color: "#f97316",
    connectionType: "born",
    spread: 1.0,
    subEntries: [
      {
        emoji: "👶",
        role: "Born & Raised",
        place: "Austin, TX",
        description:
          "Grew up in the Live Music Capital of the World.",
        date: "2000",
      },
    ],
  },
  {
    id: "tokyo",
    city: "Tokyo",
    lat: 35.676,
    lng: 139.65,
    color: "#e879f9",
    connectionType: "travel",
    spread: 0.4,
    subEntries: [
      {
        emoji: "🗼",
        role: "Dream Vacation",
        place: "Japan",
        description:
          "Top of the bucket list. Cherry blossoms, Shibuya crossing, and the best food on Earth.",
        date: "Someday ✨",
      },
    ],
  },
  {
    id: "projects",
    city: "Remote",
    lat: -27.112,
    lng: -109.35,
    color: "#fbbf24",
    subEntries: [
      {
        emoji: "🚀",
        role: "Side Projects",
        place: "🌐 Distributed",
        description:
          "Open-source CLI tools, location-based web apps, and AI experiments. Always building something new.",
        date: "Ongoing",
      },
    ],
  },
];
