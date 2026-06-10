import type { ProfileLocation } from '@/types/profile';

export const locations: ProfileLocation[] = [
  {
    id: "atlanta",
    city: "Atlanta",
    lat: 33.749,
    lng: -84.388,
    color: "#60a5fa",
    connectionType: "live",
    subEntries: [
      {
        emoji: "🏗️",
        role: "Senior Software Engineer",
        company: "Cargill Inc.",
        logo: "/cargill-logo.png",
        place: "📍 Georgia",
        description:
          "Architecting cloud-native platforms. Built reusable Terraform modules that cut infra provisioning by 90%. OpenTelemetry, Prometheus, Grafana, incident response.",
        date: "Nov 2024 — Present",
      },
      {
        emoji: "🎓",
        role: "B.S. Computer Science",
        place: "Emory University",
        description:
          "Graduated 2022. AWS Certified Solutions Architect — Associate.",
        date: "2018 — 2022",
      },
    ],
  },
  {
    id: "san-francisco",
    city: "San Francisco",
    lat: 37.774,
    lng: -122.419,
    color: "#34d399",
    connectionType: "worked",
    subEntries: [
      {
        emoji: "💼",
        role: "Solutions Architect",
        company: "Amazon Web Services",
        logo: "/aws-logo.svg",
        place: "📍 Seattle, WA",
        description:
          "Designed cloud-native solutions on EC2, Lambda, S3, RDS. Built serverless apps and automation with Python, JS, and SQL.",
        date: "Jul 2022 — Apr 2023",
      },
      {
        emoji: "🛠️",
        role: "SDE Intern",
        company: "Amazon Web Services",
        logo: "/aws-logo.svg",
        place: "📍 Seattle, WA",
        description:
          "Built serverless apps with Lambda, API Gateway, DynamoDB. Developed a scalable chatbot platform.",
        date: "May 2021 — Aug 2021",
      },
    ],
  },
  {
    id: "south-carolina",
    city: "South Carolina",
    lat: 34.001,
    lng: -81.035,
    color: "#f97316",
    connectionType: "born",
    spread: 1.0,
    subEntries: [
      {
        emoji: "👶",
        role: "Born",
        place: "Columbia, SC",
        description:
          "Born in the Palmetto State.",
        date: "1998",
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
          "LLM Agent Swarm CLI — auto-provisions servers for distributed AI agent swarms. Location discovery platform with geolocation & mapping APIs.",
        date: "Ongoing",
      },
    ],
  },
];
