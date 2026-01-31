/**
 * Formula Management System
 * Stores, analyzes, and extracts viral content formulas from video titles
 */

import type { YouTubeVideo } from './youtube';

// ============================================================================
// Types
// ============================================================================

export interface ViralFormula {
  id: string;
  pattern: string;
  description: string;
  elements: FormulaElement[];
  examples: FormulaExample[];
  effectiveness: number; // 0-100 score based on average view performance
  category: FormulaCategory;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FormulaElement {
  type: ElementType;
  label: string;
  description: string;
  examples: string[];
}

export type ElementType =
  | 'extreme_action'
  | 'time_element'
  | 'dramatic_situation'
  | 'range_comparison'
  | 'competition'
  | 'stakes'
  | 'number'
  | 'challenge'
  | 'transformation'
  | 'mystery'
  | 'emotion'
  | 'celebrity'
  | 'location'
  | 'object'
  | 'question'
  | 'superlative'
  | 'contrast';

export type FormulaCategory =
  | 'challenge'
  | 'comparison'
  | 'transformation'
  | 'mystery'
  | 'educational'
  | 'emotional'
  | 'stunt'
  | 'giveaway'
  | 'experiment';

export interface FormulaExample {
  videoId?: string;
  title: string;
  channelName: string;
  viewCount?: number;
  extractedElements: Record<string, string>;
}

export interface FormulaExtractionResult {
  title: string;
  matchedFormulas: MatchedFormula[];
  suggestedPattern: string;
  elements: ExtractedElement[];
  confidence: number;
}

export interface MatchedFormula {
  formula: ViralFormula;
  matchScore: number;
  mappedElements: Record<string, string>;
}

export interface ExtractedElement {
  type: ElementType;
  value: string;
  position: { start: number; end: number };
}

export interface FormulaAnalytics {
  formulaId: string;
  totalVideosAnalyzed: number;
  averageViewCount: number;
  medianViewCount: number;
  topPerformingExample: FormulaExample | null;
  trendScore: number; // How much this formula is trending
}

// ============================================================================
// Default Formulas (Based on Known Viral Patterns)
// ============================================================================

export const DEFAULT_FORMULAS: ViralFormula[] = [
  {
    id: 'extreme-time-situation',
    pattern: '[Extreme Action] + [Time Element] + [Dramatic Situation]',
    description: 'Combines an extreme action with a specific time commitment and a dramatic or dangerous situation',
    elements: [
      {
        type: 'extreme_action',
        label: 'Extreme Action',
        description: 'An intense or unusual action that creates immediate curiosity',
        examples: ['I Spent', 'I Survived', 'I Lived', 'I Stayed'],
      },
      {
        type: 'time_element',
        label: 'Time Element',
        description: 'A specific duration that adds to the challenge',
        examples: ['50 Hours', '24 Hours', '7 Days', '100 Hours'],
      },
      {
        type: 'dramatic_situation',
        label: 'Dramatic Situation',
        description: 'A challenging, dangerous, or unusual situation',
        examples: ['Buried Alive', 'In Solitary Confinement', 'In The Wilderness', 'Underwater'],
      },
    ],
    examples: [
      {
        title: 'I Spent 50 Hours Buried Alive',
        channelName: 'MrBeast',
        viewCount: 150000000,
        extractedElements: {
          extreme_action: 'I Spent',
          time_element: '50 Hours',
          dramatic_situation: 'Buried Alive',
        },
      },
      {
        title: 'I Survived 24 Hours In A Nuclear Bunker',
        channelName: 'MrBeast',
        viewCount: 98000000,
        extractedElements: {
          extreme_action: 'I Survived',
          time_element: '24 Hours',
          dramatic_situation: 'In A Nuclear Bunker',
        },
      },
    ],
    effectiveness: 95,
    category: 'challenge',
    tags: ['survival', 'time-based', 'extreme'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'range-competition-stakes',
    pattern: '[Range Comparison] + [Competition] + [Stakes]',
    description: 'Pits different groups or ages against each other in a competition with clear stakes',
    elements: [
      {
        type: 'range_comparison',
        label: 'Range Comparison',
        description: 'A range that creates natural comparison and curiosity',
        examples: ['Ages 1-100', 'Kids vs Adults', '$1 vs $1,000,000', 'Amateur vs Pro'],
      },
      {
        type: 'competition',
        label: 'Competition',
        description: 'The competitive element or challenge',
        examples: ['Fight For', 'Compete For', 'Race For', 'Battle For'],
      },
      {
        type: 'stakes',
        label: 'Stakes',
        description: 'What participants are competing for',
        examples: ['$500,000', '$1,000,000', 'A House', 'A Car'],
      },
    ],
    examples: [
      {
        title: 'Ages 1-100 Fight For $500,000',
        channelName: 'MrBeast',
        viewCount: 200000000,
        extractedElements: {
          range_comparison: 'Ages 1-100',
          competition: 'Fight For',
          stakes: '$500,000',
        },
      },
    ],
    effectiveness: 92,
    category: 'comparison',
    tags: ['competition', 'money', 'inclusive'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'number-superlative-object',
    pattern: '[Number] + [Superlative] + [Object/Experience]',
    description: 'Uses specific numbers with superlatives to create curiosity about extreme items or experiences',
    elements: [
      {
        type: 'number',
        label: 'Number',
        description: 'A specific quantity or amount',
        examples: ['$1', '$100,000,000', '1,000', '100'],
      },
      {
        type: 'superlative',
        label: 'Superlative',
        description: 'Extreme descriptor',
        examples: ["World's Largest", "World's Smallest", 'Most Expensive', 'Cheapest'],
      },
      {
        type: 'object',
        label: 'Object/Experience',
        description: 'The item or experience being featured',
        examples: ['House', 'Car', 'Restaurant', 'Hotel'],
      },
    ],
    examples: [
      {
        title: "$1 vs $100,000,000 House!",
        channelName: 'MrBeast',
        viewCount: 180000000,
        extractedElements: {
          number: '$1 vs $100,000,000',
          superlative: 'implied comparison',
          object: 'House',
        },
      },
    ],
    effectiveness: 88,
    category: 'comparison',
    tags: ['comparison', 'money', 'luxury'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mystery-reveal',
    pattern: '[Mystery Hook] + [Surprising Element]',
    description: 'Creates curiosity with a mystery or question that promises a surprising answer',
    elements: [
      {
        type: 'mystery',
        label: 'Mystery Hook',
        description: 'A question or statement that creates curiosity',
        examples: ['Why', 'How', 'What Happens When', 'The Truth About'],
      },
      {
        type: 'dramatic_situation',
        label: 'Surprising Element',
        description: 'The unexpected or counterintuitive element',
        examples: ['Actually Works', "Shouldn't Exist", 'Nobody Knows', 'Is Impossible'],
      },
    ],
    examples: [
      {
        title: 'Why Machines That Predict The Future Are Real',
        channelName: 'Veritasium',
        viewCount: 15000000,
        extractedElements: {
          mystery: 'Why',
          dramatic_situation: 'Machines That Predict The Future Are Real',
        },
      },
    ],
    effectiveness: 85,
    category: 'mystery',
    tags: ['educational', 'curiosity', 'science'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'transformation-journey',
    pattern: '[Starting Point] + [Transformation] + [End Result]',
    description: 'Shows a dramatic transformation or journey from one state to another',
    elements: [
      {
        type: 'transformation',
        label: 'Starting Point',
        description: 'The initial state or condition',
        examples: ['I Had $0', 'I Was Broke', 'Starting From Nothing', 'Day 1'],
      },
      {
        type: 'time_element',
        label: 'Transformation Process',
        description: 'How the transformation happens',
        examples: ['In 30 Days', 'For 1 Year', 'Until', 'And Then'],
      },
      {
        type: 'dramatic_situation',
        label: 'End Result',
        description: 'The final state achieved',
        examples: ['Made $1,000,000', 'Became A CEO', 'Built An Empire', 'Changed Everything'],
      },
    ],
    examples: [
      {
        title: 'I Started A Business With $0 And Made $1,000,000',
        channelName: 'Ryan Trahan',
        viewCount: 25000000,
        extractedElements: {
          transformation: 'I Started A Business With $0',
          time_element: 'implied journey',
          dramatic_situation: 'Made $1,000,000',
        },
      },
    ],
    effectiveness: 82,
    category: 'transformation',
    tags: ['journey', 'success', 'money'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'experiment-reveal',
    pattern: '[Action/Experiment] + [Unexpected Outcome]',
    description: 'Presents an experiment or action with an unexpected or extreme outcome',
    elements: [
      {
        type: 'extreme_action',
        label: 'Action/Experiment',
        description: 'The experiment or action being performed',
        examples: ['I Built', 'I Tested', 'We Tried', 'I Made'],
      },
      {
        type: 'object',
        label: 'Subject',
        description: 'What the experiment involves',
        examples: ["World's Largest", 'Impossible', 'Dangerous', 'Illegal'],
      },
    ],
    examples: [
      {
        title: "I Built The World's Largest Lego Tower",
        channelName: 'MrBeast',
        viewCount: 120000000,
        extractedElements: {
          extreme_action: 'I Built',
          object: "World's Largest Lego Tower",
        },
      },
      {
        title: 'Building A Rocket With DIY Rocket Fuel',
        channelName: 'Mark Rober',
        viewCount: 40000000,
        extractedElements: {
          extreme_action: 'Building',
          object: 'A Rocket With DIY Rocket Fuel',
        },
      },
    ],
    effectiveness: 87,
    category: 'experiment',
    tags: ['science', 'building', 'extreme'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'last-to-leave',
    pattern: '[Challenge] + [Location/Situation] + [Prize]',
    description: 'Classic elimination challenge format with clear stakes',
    elements: [
      {
        type: 'challenge',
        label: 'Challenge',
        description: 'The endurance or elimination challenge',
        examples: ['Last To Leave', 'First To', 'Whoever', 'If You'],
      },
      {
        type: 'location',
        label: 'Location/Situation',
        description: 'Where or what the challenge involves',
        examples: ['The Circle', 'The Island', 'This House', 'The Pool'],
      },
      {
        type: 'stakes',
        label: 'Prize',
        description: 'What the winner receives',
        examples: ['Wins $100,000', 'Keeps It', 'Gets The House', 'Wins Everything'],
      },
    ],
    examples: [
      {
        title: 'Last To Leave Circle Wins $500,000',
        channelName: 'MrBeast',
        viewCount: 150000000,
        extractedElements: {
          challenge: 'Last To Leave',
          location: 'Circle',
          stakes: 'Wins $500,000',
        },
      },
    ],
    effectiveness: 90,
    category: 'challenge',
    tags: ['competition', 'endurance', 'money'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'giving-away',
    pattern: '[Giveaway Action] + [Valuable Item] + [Recipient/Context]',
    description: 'Generous giveaway format that creates feel-good engagement',
    elements: [
      {
        type: 'extreme_action',
        label: 'Giveaway Action',
        description: 'The act of giving',
        examples: ['I Gave', 'Giving Away', 'I Bought', 'Surprising'],
      },
      {
        type: 'object',
        label: 'Valuable Item',
        description: 'What is being given away',
        examples: ['A House', '$1,000,000', 'A Car', 'Everything'],
      },
      {
        type: 'emotion',
        label: 'Recipient/Context',
        description: 'Who receives or why it matters',
        examples: ['To A Stranger', 'To My Subscriber', 'To The Homeless', 'To My Mom'],
      },
    ],
    examples: [
      {
        title: 'I Gave My 100,000,000th Subscriber A Private Island',
        channelName: 'MrBeast',
        viewCount: 130000000,
        extractedElements: {
          extreme_action: 'I Gave',
          object: 'A Private Island',
          emotion: 'My 100,000,000th Subscriber',
        },
      },
    ],
    effectiveness: 88,
    category: 'giveaway',
    tags: ['philanthropy', 'emotional', 'money'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============================================================================
// LocalStorage Persistence
// ============================================================================

const FORMULAS_STORAGE_KEY = 'viral_formulas';
const FORMULA_ANALYTICS_KEY = 'formula_analytics';

export function loadFormulas(): ViralFormula[] {
  try {
    const stored = localStorage.getItem(FORMULAS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load formulas from localStorage:', error);
  }
  return [...DEFAULT_FORMULAS];
}

export function saveFormulas(formulas: ViralFormula[]): void {
  try {
    localStorage.setItem(FORMULAS_STORAGE_KEY, JSON.stringify(formulas));
  } catch (error) {
    console.error('Failed to save formulas to localStorage:', error);
  }
}

export function loadFormulaAnalytics(): Record<string, FormulaAnalytics> {
  try {
    const stored = localStorage.getItem(FORMULA_ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load formula analytics:', error);
  }
  return {};
}

export function saveFormulaAnalytics(analytics: Record<string, FormulaAnalytics>): void {
  try {
    localStorage.setItem(FORMULA_ANALYTICS_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to save formula analytics:', error);
  }
}

export function resetFormulasToDefault(): void {
  saveFormulas([...DEFAULT_FORMULAS]);
}

// ============================================================================
// Formula CRUD Operations
// ============================================================================

export function getFormulaById(id: string): ViralFormula | undefined {
  const formulas = loadFormulas();
  return formulas.find((f) => f.id === id);
}

export function addFormula(formula: Omit<ViralFormula, 'id' | 'createdAt' | 'updatedAt'>): ViralFormula {
  const formulas = loadFormulas();
  const newFormula: ViralFormula = {
    ...formula,
    id: generateFormulaId(formula.pattern),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  formulas.push(newFormula);
  saveFormulas(formulas);
  return newFormula;
}

export function updateFormula(id: string, updates: Partial<ViralFormula>): ViralFormula | null {
  const formulas = loadFormulas();
  const index = formulas.findIndex((f) => f.id === id);
  if (index === -1) return null;

  formulas[index] = {
    ...formulas[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveFormulas(formulas);
  return formulas[index];
}

export function deleteFormula(id: string): boolean {
  const formulas = loadFormulas();
  const filtered = formulas.filter((f) => f.id !== id);
  if (filtered.length === formulas.length) return false;
  saveFormulas(filtered);
  return true;
}

export function addExampleToFormula(formulaId: string, example: FormulaExample): ViralFormula | null {
  const formulas = loadFormulas();
  const index = formulas.findIndex((f) => f.id === formulaId);
  if (index === -1) return null;

  formulas[index].examples.push(example);
  formulas[index].updatedAt = new Date().toISOString();
  saveFormulas(formulas);
  return formulas[index];
}

// ============================================================================
// Pattern Matching & Analysis
// ============================================================================

/**
 * Keywords and patterns used for basic element detection
 * (Full extraction should be done by Claude for best results)
 */
const ELEMENT_PATTERNS: Record<ElementType, RegExp[]> = {
  extreme_action: [
    /^I (Spent|Survived|Lived|Stayed|Built|Made|Gave|Bought|Created|Tried)/i,
    /^(Building|Surviving|Living|Making|Giving)/i,
  ],
  time_element: [
    /(\d+)\s*(Hours?|Days?|Weeks?|Months?|Years?)/i,
    /For\s+(\d+)\s*(Hours?|Days?|Weeks?|Months?|Years?)/i,
  ],
  dramatic_situation: [
    /(Buried Alive|Solitary Confinement|Prison|Wilderness|Underwater|Dangerous|Impossible)/i,
  ],
  range_comparison: [
    /Ages?\s*\d+[-–]\d+/i,
    /(\$?\d+)\s*vs\s*(\$?[\d,]+)/i,
    /(Kids?|Children)\s*vs\s*(Adults?|Pros?)/i,
  ],
  competition: [
    /(Fight|Compete|Race|Battle|Challenge)\s*(For|To)/i,
    /Last To (Leave|Survive|Stand)/i,
  ],
  stakes: [
    /\$[\d,]+(?:,\d{3})*(?:\.\d{2})?/,
    /Wins?\s+\$[\d,]+/i,
    /(A\s+)?(House|Car|Island|Mansion|Yacht)/i,
  ],
  number: [
    /\$[\d,]+/,
    /\d{1,3}(?:,\d{3})+/,
    /\d+(?:\.\d+)?\s*(Million|Billion|Thousand|K|M|B)/i,
  ],
  challenge: [
    /^(Last To|First To|Whoever|If You)/i,
    /(Challenge|Contest|Competition)/i,
  ],
  transformation: [
    /(Started|Began|Was|Had)\s+(With\s+)?\$?0/i,
    /(From|To)\s+(Nothing|Zero|$0)/i,
  ],
  mystery: [
    /^(Why|How|What|Where|When|Who)/i,
    /(The Truth About|Nobody Knows|Secret)/i,
  ],
  emotion: [
    /(Stranger|Subscriber|Fan|Homeless|Mom|Dad|Family|Friend)/i,
    /(Crying|Emotional|Heartwarming|Surprising)/i,
  ],
  celebrity: [
    // This would be populated with celebrity name patterns
  ],
  location: [
    /(Circle|Island|House|Mansion|Bunker|Prison|Room|Forest|Desert)/i,
  ],
  object: [
    /(World's\s+)?(Largest|Smallest|Biggest|Most\s+Expensive)/i,
    /(House|Car|Phone|Computer|Building|Tower)/i,
  ],
  question: [
    /\?$/,
    /^(Is|Are|Can|Could|Would|Will|Do|Does)/i,
  ],
  superlative: [
    /(World's|Most|Best|Worst|Largest|Smallest|First|Last)/i,
  ],
  contrast: [
    /vs\.?/i,
    /(But|However|Except|Instead)/i,
  ],
};

/**
 * Basic element extraction from a title
 * Note: For best results, use Claude API for full semantic analysis
 */
export function extractBasicElements(title: string): ExtractedElement[] {
  const elements: ExtractedElement[] = [];

  for (const [elementType, patterns] of Object.entries(ELEMENT_PATTERNS)) {
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        elements.push({
          type: elementType as ElementType,
          value: match[0],
          position: {
            start: match.index || 0,
            end: (match.index || 0) + match[0].length,
          },
        });
        break; // Only take first match per element type
      }
    }
  }

  return elements;
}

/**
 * Matches a title against known formulas
 */
export function matchTitleToFormulas(title: string): MatchedFormula[] {
  const formulas = loadFormulas();
  const extractedElements = extractBasicElements(title);
  const matches: MatchedFormula[] = [];

  for (const formula of formulas) {
    const formulaElementTypes = formula.elements.map((e) => e.type);
    const matchedElementTypes = extractedElements
      .filter((e) => formulaElementTypes.includes(e.type))
      .map((e) => e.type);

    const matchScore = matchedElementTypes.length / formulaElementTypes.length;

    if (matchScore > 0.5) {
      const mappedElements: Record<string, string> = {};
      for (const element of extractedElements) {
        if (formulaElementTypes.includes(element.type)) {
          mappedElements[element.type] = element.value;
        }
      }

      matches.push({
        formula,
        matchScore,
        mappedElements,
      });
    }
  }

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);
  return matches;
}

/**
 * Generates a suggested pattern from extracted elements
 */
export function generateSuggestedPattern(elements: ExtractedElement[]): string {
  if (elements.length === 0) return '[Unknown Pattern]';

  const labels: Record<ElementType, string> = {
    extreme_action: 'Extreme Action',
    time_element: 'Time Element',
    dramatic_situation: 'Dramatic Situation',
    range_comparison: 'Range Comparison',
    competition: 'Competition',
    stakes: 'Stakes',
    number: 'Number',
    challenge: 'Challenge',
    transformation: 'Transformation',
    mystery: 'Mystery Hook',
    emotion: 'Emotional Element',
    celebrity: 'Celebrity',
    location: 'Location',
    object: 'Object',
    question: 'Question',
    superlative: 'Superlative',
    contrast: 'Contrast',
  };

  // Sort by position
  const sorted = [...elements].sort((a, b) => a.position.start - b.position.start);
  return sorted.map((e) => `[${labels[e.type]}]`).join(' + ');
}

/**
 * Full formula extraction analysis for a title
 * Returns extraction result that can be enhanced by Claude
 */
export function analyzeTitle(title: string): FormulaExtractionResult {
  const extractedElements = extractBasicElements(title);
  const matchedFormulas = matchTitleToFormulas(title);
  const suggestedPattern = generateSuggestedPattern(extractedElements);

  // Calculate confidence based on element coverage and formula matches
  let confidence = 0;
  if (matchedFormulas.length > 0) {
    confidence = Math.min(matchedFormulas[0].matchScore * 100, 100);
  } else if (extractedElements.length >= 2) {
    confidence = Math.min(extractedElements.length * 20, 60);
  }

  return {
    title,
    matchedFormulas,
    suggestedPattern,
    elements: extractedElements,
    confidence,
  };
}

/**
 * Batch analyze multiple video titles
 */
export function analyzeVideoTitles(videos: YouTubeVideo[]): FormulaExtractionResult[] {
  return videos.map((video) => analyzeTitle(video.title));
}

// ============================================================================
// Formula Statistics & Analytics
// ============================================================================

/**
 * Updates formula effectiveness based on video performance
 */
export function updateFormulaEffectiveness(
  formulaId: string,
  videos: YouTubeVideo[]
): void {
  const formulas = loadFormulas();
  const index = formulas.findIndex((f) => f.id === formulaId);
  if (index === -1) return;

  const viewCounts = videos
    .filter((v) => v.statistics?.viewCount)
    .map((v) => v.statistics!.viewCount);

  if (viewCounts.length === 0) return;

  const avgViews = viewCounts.reduce((a, b) => a + b, 0) / viewCounts.length;

  // Normalize to 0-100 scale (assuming 100M views = 100 effectiveness)
  const normalizedScore = Math.min(Math.round((avgViews / 100_000_000) * 100), 100);

  formulas[index].effectiveness = normalizedScore;
  formulas[index].updatedAt = new Date().toISOString();
  saveFormulas(formulas);
}

/**
 * Get formulas sorted by effectiveness
 */
export function getFormulasByEffectiveness(): ViralFormula[] {
  const formulas = loadFormulas();
  return [...formulas].sort((a, b) => b.effectiveness - a.effectiveness);
}

/**
 * Get formulas by category
 */
export function getFormulasByCategory(category: FormulaCategory): ViralFormula[] {
  const formulas = loadFormulas();
  return formulas.filter((f) => f.category === category);
}

/**
 * Search formulas by tags
 */
export function searchFormulasByTags(tags: string[]): ViralFormula[] {
  const formulas = loadFormulas();
  return formulas.filter((f) =>
    tags.some((tag) => f.tags.includes(tag.toLowerCase()))
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateFormulaId(pattern: string): string {
  const slug = pattern
    .toLowerCase()
    .replace(/\[|\]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 50);
  return `${slug}-${Date.now().toString(36)}`;
}

/**
 * Format large numbers for display
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Get all unique categories from formulas
 */
export function getAllCategories(): FormulaCategory[] {
  const formulas = loadFormulas();
  const categories = new Set(formulas.map((f) => f.category));
  return Array.from(categories);
}

/**
 * Get all unique tags from formulas
 */
export function getAllTags(): string[] {
  const formulas = loadFormulas();
  const tags = new Set(formulas.flatMap((f) => f.tags));
  return Array.from(tags).sort();
}

