/**
 * Platform specifications for content validation
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
  },
  Reddit: {
    maxCaptionLength: 40000,
    idealLength: 500,
    maxHashtags: 0,
    videoDuration: "N/A",
    bestTimes: ["8am", "12pm", "6pm"],
    tone: "helpful, authentic, community-first, no self-promotion"
  },
  Mumsnet: {
    maxCaptionLength: 20000,
    idealLength: 400,
    maxHashtags: 0,
    videoDuration: "N/A",
    bestTimes: ["9am", "1pm", "8pm"],
    tone: "warm, practical, parent-to-parent, evidence-based"
  }
};

export type Platform = keyof typeof PLATFORM_SPECS;
export type ExamLevel = 'GCSE' | 'A-Level' | 'IB';
