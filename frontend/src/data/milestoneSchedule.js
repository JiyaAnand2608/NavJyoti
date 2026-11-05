/**
 * Developmental Milestone Observational Checklist
 * Aligned with early childhood development observation benchmarks (RBSK / WHO ECD standards).
 * 
 * IMPORTANT HEALTHCARE NOTE:
 * These milestones are observational checkpoints for parents and frontline health workers
 * to support early awareness and timely guidance. They do NOT represent a clinical diagnosis
 * or a medical developmental score.
 */
export const MILESTONE_DOMAINS = [
  { id: "motor", name: "Motor Development", description: "Gross & fine physical movements and balance" },
  { id: "language", name: "Language & Communication", description: "Vocalisations, sounds, gestures, and words" },
  { id: "cognitive", name: "Cognitive & Problem Solving", description: "Curiosity, exploration, and understanding relationships" },
  { id: "social", name: "Social & Emotional", description: "Interaction with family, facial expressions, and play" },
];

export const MILESTONE_SCHEDULE = [
  {
    ageBand: "0–2 Months",
    minAgeMonths: 0,
    maxAgeMonths: 2,
    items: [
      { id: "m_0_1", domain: "motor", title: "Lifts head briefly while on tummy", guidance: "Can raise chin off bed/floor for a few seconds." },
      { id: "m_0_2", domain: "language", title: "Startles or reacts to sudden loud sounds", guidance: "Blinks, quiets down or turns toward sound." },
      { id: "m_0_3", domain: "social", title: "Smiles responsively to parent's voice", guidance: "Smiles back when caregiver speaks gently." },
      { id: "m_0_4", domain: "cognitive", title: "Briefly follows moving faces with eyes", guidance: "Tracks high-contrast objects in close view." },
    ],
  },
  {
    ageBand: "2–4 Months",
    minAgeMonths: 2,
    maxAgeMonths: 4,
    items: [
      { id: "m_2_1", domain: "motor", title: "Holds head steady without support", guidance: "Keeps head erect when held upright in arms." },
      { id: "m_2_2", domain: "motor", title: "Brings hands together toward mouth", guidance: "Discovers hands and begins sucking on fingers." },
      { id: "m_2_3", domain: "language", title: "Makes cooing sounds (ooh, aah)", guidance: "Experiments with vocal vowel sounds when happy." },
      { id: "m_2_4", domain: "social", title: "Laughs and chuckles during playful interaction", guidance: "Shows clear pleasure when played with." },
    ],
  },
  {
    ageBand: "6–9 Months",
    minAgeMonths: 6,
    maxAgeMonths: 9,
    items: [
      { id: "m_6_1", domain: "motor", title: "Sits without support for brief periods", guidance: "Maintains balance on floor without toppling." },
      { id: "m_6_2", domain: "motor", title: "Transfers small toy from one hand to the other", guidance: "Demonstrates bilateral coordination." },
      { id: "m_6_3", domain: "language", title: "Babbles repetitive syllables ('ba-ba', 'ma-ma')", guidance: "Strings consonant-vowel combinations." },
      { id: "m_6_4", domain: "social", title: "Responds to own name when called", guidance: "Turns head and makes eye contact upon hearing name." },
    ],
  },
  {
    ageBand: "9–12 Months",
    minAgeMonths: 9,
    maxAgeMonths: 12,
    items: [
      { id: "m_9_1", domain: "motor", title: "Pulls up to standing holding furniture", guidance: "Uses support to stand on feet." },
      { id: "m_9_2", domain: "language", title: "Understands simple words like 'no' or 'come'", guidance: "Shows comprehension through pauses or gestures." },
      { id: "m_9_3", domain: "social", title: "Waves goodbye ('ta-ta') on request", guidance: "Uses simple social gestures appropriately." },
      { id: "m_9_4", domain: "cognitive", title: "Finds hidden object under a cloth", guidance: "Demonstrates object permanence." },
    ],
  },
  {
    ageBand: "12–18 Months",
    minAgeMonths: 12,
    maxAgeMonths: 18,
    items: [
      { id: "m_12_1", domain: "motor", title: "Walks independently across room", guidance: "Takes steady steps without holding caregiver." },
      { id: "m_12_2", domain: "language", title: "Uses 3 to 5 single meaningful words", guidance: "Says recognizable words for water, milk, mom, etc." },
      { id: "m_12_3", domain: "cognitive", title: "Drinks from a cup or drinks with assistance", guidance: "Demonstrates functional object usage." },
      { id: "m_12_4", domain: "social", title: "Points to show something of interest", guidance: "Shared attention: points to birds, animals, or toys." },
    ],
  },
];
