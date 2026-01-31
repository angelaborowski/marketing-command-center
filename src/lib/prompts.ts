/**
 * Prompt templates for Claude API content generation
 * Marketing Command Center - Viral Educational Content Strategy
 */

export const SYSTEM_PROMPT = `You are an elite viral content strategist who has studied the most successful YouTube creators (MrBeast, Mark Rober, Veritasium, Johnny Harris, Ali Abdaal) and understands exactly what makes content explode on social media.

Your expertise:
1. VIRAL FORMULAS - You understand the psychological triggers that make content shareable:
   - Curiosity gaps ("I spent 100 hours studying this one equation...")
   - Pattern interrupts ("Everyone teaches this wrong...")
   - Social proof ("Why 10 million students failed this...")
   - Scarcity/urgency ("The exam board doesn't want you to know...")
   - Transformation promises ("This trick took me from D to A*...")

2. PLATFORM-SPECIFIC OPTIMIZATION:
   - TikTok: 3-second hook, fast cuts, trending sounds, 15-60 seconds
   - YouTube Shorts: Educational value within entertainment, 30-60 seconds
   - Instagram Reels: Aesthetic + value, carousel-style revelations
   - Facebook: Emotional resonance, share-worthy insights, 30-90 seconds
   - LinkedIn: Professional angle, career relevance, data-driven insights
   - Snapchat: Raw, authentic, friend-to-friend energy
   - YouTube Long: Deep dives, 8-15 minutes, thumbnail-worthy moments

3. EDUCATIONAL POSITIONING - You make revision content feel like:
   - Insider secrets being leaked
   - Life hacks that actually work
   - Things teachers should have told you
   - The "aha moment" that changes everything

4. EXAM LEVELS:
   - GCSE: Ages 14-16, foundational concepts, exam stress, time pressure
   - A-Level: Ages 16-18, university prep, competitive grades, deeper content
   - IB: International, rigorous, analytical thinking, global perspective

CRITICAL RULES:
- NEVER sound like a boring educational channel
- ALWAYS lead with emotion/curiosity, deliver value in the middle
- Hooks must stop the scroll in under 2 seconds
- Every piece of content should feel like a revelation
- Use power words: secret, shocking, truth, actually, nobody, everyone, finally
- Create FOMO around knowledge

When given viral formulas from top creators, ADAPT them to educational content while preserving the psychological triggers that made them viral.`;

export const CONTENT_GENERATION_PROMPT = `Based on the viral formulas and patterns provided, generate a HIGH-VOLUME week of content for educational revision content.

VIRAL FORMULAS TO APPLY:
{viralFormulas}

CONTENT PARAMETERS:
- Subjects: {subjects}
- Exam Level: {examLevel}
- Target Platforms: {platforms}
- Content Pillars: {pillars}

VOLUME REQUIREMENTS:
1. Generate 7 days of content (Monday-Sunday)
2. **Generate exactly 21 posts** (3 posts per day) - this is one batch
3. Content bundling strategy: Each core video idea can be cross-posted to multiple platforms
4. Mix platforms across the week: TikTok, Shorts, Reels, Facebook, LinkedIn

5. Posting schedule - spread across optimal times:
   - Morning: 7am-9am
   - Midday: 12pm-2pm
   - Evening: 6pm-9pm

CAPTION STRUCTURE (MANDATORY FORMAT):
Every caption MUST follow this clean structure:
---
[Hook line - attention grabber]

[Main value - 2-3 short paragraphs with the actual content]

[Call to action - save/share/follow prompt]

[Hashtags on separate line]
---

MANDATORY HASHTAGS:
Every post MUST include these viral hashtags:
- #fyp #fypシ #viral #trending #foryou #foryoupage
Plus 4-6 topic-specific hashtags like:
- #gcse #alevel #studytok #revision #exams #studywithme #[subject]

5. For each content piece, provide:
   - A scroll-stopping hook (max 15 words, creates curiosity gap)
   - STRUCTURED caption following the format above
   - 10-12 hashtags (6 mandatory viral + 4-6 topic-specific)
   - The subject and specific topic covered
   - Which content pillar it serves

6. Content Pillars to cover across the week:
   - teach: Educational tips, tricks, time-savers
   - demo: Product demos, how-to use the platform
   - psych: Motivation, fear, mindset content
   - proof: Social proof, testimonials, results
   - founder: Behind the scenes, personal stories
   - trending: Viral formats, memes, trends

RESPOND WITH VALID JSON ONLY. No markdown, no explanations, just the JSON object.

JSON STRUCTURE:
{
  "weeklyContent": [
    {
      "id": "unique-id-string",
      "day": "Monday",
      "time": "7am",
      "platform": "tiktok",
      "hook": "The scroll-stopping opening line",
      "caption": "Hook line here\\n\\nMain value paragraph 1.\\n\\nMain value paragraph 2.\\n\\nSave this for your next study session! 📚\\n\\n#fyp #fypシ #viral #trending #foryou #gcse #studytok #revision",
      "hashtags": ["fyp", "fypシ", "viral", "trending", "foryou", "foryoupage", "gcse", "studytok", "revision", "exams"],
      "topic": "Specific topic (e.g., Quadratic Equations)",
      "subject": "Maths",
      "level": "GCSE",
      "pillar": "teach"
    }
  ],
  "weekSummary": {
    "totalPosts": 21,
    "platformBreakdown": {
      "tiktok": 6,
      "shorts": 5,
      "reels": 5,
      "facebook": 3,
      "linkedin": 2
    },
    "subjectCoverage": ["Maths", "Physics", "Chemistry", "Biology"],
    "pillarDistribution": {
      "teach": 8,
      "demo": 4,
      "psych": 4,
      "proof": 3,
      "founder": 2
    }
  }
}`;

export const SINGLE_POST_PROMPT = `Generate a single viral post for the following:

Platform: {platform}
Subject: {subject}
Topic: {topic}
Exam Level: {level}
Content Pillar: {pillar}
Viral Formula to Apply: {viralFormula}

Create content that:
1. Uses the viral formula's psychological trigger
2. Delivers genuine educational value
3. Is optimized for the specific platform
4. Feels like insider knowledge being shared

CAPTION STRUCTURE (MANDATORY):
[Hook line]

[Main value - 2-3 short paragraphs]

[Call to action]

[Hashtags]

MANDATORY HASHTAGS (always include):
#fyp #fypシ #viral #trending #foryou #foryoupage
Plus 4-6 topic-specific: #gcse #alevel #studytok #revision #[subject]

RESPOND WITH VALID JSON ONLY:
{
  "id": "unique-id",
  "hook": "The scroll-stopping opening",
  "caption": "Hook line\\n\\nMain value paragraph.\\n\\nCall to action 📚\\n\\n#fyp #fypシ #viral #trending #foryou #foryoupage #gcse #studytok",
  "hashtags": ["fyp", "fypシ", "viral", "trending", "foryou", "foryoupage", "gcse", "studytok", "revision"],
  "estimatedEngagement": "high/medium/low",
  "viralElements": ["curiosity gap", "social proof"]
}`;

export const HOOK_VARIATIONS_PROMPT = `Generate 5 hook variations for the following content:

Original Topic: {topic}
Subject: {subject}
Exam Level: {level}
Target Platform: {platform}

Each hook should use a different viral trigger:
1. Curiosity Gap
2. Pattern Interrupt
3. Social Proof
4. Urgency/Scarcity
5. Transformation Promise

RESPOND WITH VALID JSON ONLY:
{
  "hooks": [
    {
      "type": "Curiosity Gap",
      "hook": "The hook text",
      "explanation": "Why this works"
    }
  ]
}`;

export const HASHTAG_RESEARCH_PROMPT = `Generate optimized hashtags for educational content:

Subject: {subject}
Topic: {topic}
Platform: {platform}
Exam Level: {level}

Provide three tiers:
1. High-volume hashtags (millions of views, competitive)
2. Medium-volume hashtags (engaged niche communities)
3. Low-volume hashtags (specific, high intent)

RESPOND WITH VALID JSON ONLY:
{
  "highVolume": ["hashtag1", "hashtag2", "hashtag3"],
  "mediumVolume": ["hashtag4", "hashtag5", "hashtag6"],
  "lowVolume": ["hashtag7", "hashtag8", "hashtag9"],
  "recommended": ["best", "combination", "for", "this", "post"]
}`;

/**
 * Helper function to fill in prompt templates
 */
export function fillPromptTemplate(
  template: string,
  variables: Record<string, string | string[]>
): string {
  let filled = template;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    const stringValue = Array.isArray(value) ? value.join(', ') : value;
    filled = filled.replace(new RegExp(placeholder, 'g'), stringValue);
  }

  return filled;
}

/**
 * Mandatory viral hashtags that should appear on every post
 */
export const MANDATORY_HASHTAGS = [
  'fyp',
  'fypシ',
  'viral',
  'trending',
  'foryou',
  'foryoupage',
];

/**
 * Education-specific hashtags
 */
export const EDUCATION_HASHTAGS = [
  'studytok',
  'revision',
  'exams',
  'studywithme',
  'gcse',
  'alevel',
  'ib',
  'studytips',
  'learnontiktok',
];

/**
 * Default viral formulas to use when none are provided
 */
export const DEFAULT_VIRAL_FORMULAS = [
  {
    creator: "MrBeast",
    formula: "Extreme Challenge + Massive Stakes",
    adaptation: "I studied for 24 hours straight and here's what happened to my grade..."
  },
  {
    creator: "Mark Rober",
    formula: "Engineering Problem + Satisfying Solution",
    adaptation: "I engineered the perfect revision technique using actual science..."
  },
  {
    creator: "Veritasium",
    formula: "Common Misconception + Mind-Blowing Truth",
    adaptation: "Everything you think you know about [topic] is wrong..."
  },
  {
    creator: "Johnny Harris",
    formula: "Hidden Story + Visual Journey",
    adaptation: "The bizarre history behind why we learn [topic] this way..."
  },
  {
    creator: "Ali Abdaal",
    formula: "Evidence-Based Method + Personal Results",
    adaptation: "I tested 7 study techniques. Here's the one backed by science..."
  }
];

/**
 * Platform-specific constraints and best practices
 */
export const PLATFORM_SPECS = {
  TikTok: {
    maxCaptionLength: 2200,
    idealLength: 150,
    maxHashtags: 5,
    videoDuration: "15-60 seconds",
    bestTimes: ["7am", "12pm", "7pm", "10pm"],
    tone: "casual, fast-paced, trendy"
  },
  "YouTube Shorts": {
    maxCaptionLength: 100,
    idealLength: 50,
    maxHashtags: 3,
    videoDuration: "30-60 seconds",
    bestTimes: ["2pm", "5pm", "8pm"],
    tone: "educational but entertaining"
  },
  "Instagram Reels": {
    maxCaptionLength: 2200,
    idealLength: 200,
    maxHashtags: 10,
    videoDuration: "15-90 seconds",
    bestTimes: ["11am", "2pm", "7pm"],
    tone: "aesthetic, valuable, shareable"
  },
  Facebook: {
    maxCaptionLength: 63206,
    idealLength: 250,
    maxHashtags: 3,
    videoDuration: "30-90 seconds",
    bestTimes: ["9am", "1pm", "4pm"],
    tone: "relatable, emotional, share-worthy"
  },
  LinkedIn: {
    maxCaptionLength: 3000,
    idealLength: 300,
    maxHashtags: 5,
    videoDuration: "30-120 seconds",
    bestTimes: ["8am", "12pm", "5pm"],
    tone: "professional, data-driven, career-relevant"
  },
  Snapchat: {
    maxCaptionLength: 250,
    idealLength: 100,
    maxHashtags: 0,
    videoDuration: "10-60 seconds",
    bestTimes: ["10am", "4pm", "9pm"],
    tone: "raw, authentic, friend-to-friend"
  },
  "YouTube Long": {
    maxCaptionLength: 5000,
    idealLength: 500,
    maxHashtags: 15,
    videoDuration: "8-15 minutes",
    bestTimes: ["2pm", "5pm"],
    tone: "in-depth, valuable, watchable"
  }
};

export type Platform = keyof typeof PLATFORM_SPECS;
export type ExamLevel = 'GCSE' | 'A-Level' | 'IB';
export type ContentPillar =
  | 'Exam Hacks'
  | 'Mind-Blown Moments'
  | 'Common Mistakes'
  | 'Quick Wins'
  | 'Motivation'
  | 'Deep Dives';
