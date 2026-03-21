import OpenAI from "openai";
import fs from "fs";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nano(prompt, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const r = await client.responses.create({
        model: "gpt-5-nano",
        tools: [{ type: "web_search_preview" }],
        input: prompt,
      });
      for (const item of r.output) {
        if (item.type === "message") {
          for (const block of item.content) {
            if (block.type === "output_text") return block.text;
          }
        }
      }
      return "(no output)";
    } catch (e) {
      if (e.status === 429 && i < retries - 1) {
        console.log(`  Rate limited. Waiting 60s... (attempt ${i + 1}/${retries})`);
        await sleep(60000);
      } else {
        throw e;
      }
    }
  }
}

async function run() {
  console.log("[1/4] Searching All About AI channel for Telegram bot video...");
  const step1 = await nano(
    'Search YouTube channel "All About AI" by Kristian Fagerlie (@AllAboutAI) for any video about connecting a bot to Telegram, Telegram integration, or Telegram notifications. Find the exact video title, URL, upload date, and description. Also check his GitHub (github.com/All-About-AI-YouTube) for any Telegram-related repos. Return everything you find.'
  );
  console.log(step1);
  console.log("\n---\n");

  await sleep(30000);
  console.log("[2/4] Extracting technical details from the video/description...");
  const step2 = await nano(
    `Based on what you know about All About AI's Telegram bot video, search for: the specific tools, libraries, APIs, and code he used. Search for "All About AI telegram bot tutorial", "AllAboutAI telegram python bot", "Kristian Fagerlie telegram integration". Find any GitHub repo links, code snippets, or step-by-step instructions. What Telegram Bot API methods did he use? Did he use python-telegram-bot, aiogram, or telethon? Return all technical details.`
  );
  console.log(step2);
  console.log("\n---\n");

  await sleep(30000);
  console.log("[3/4] Researching Telegram Bot API setup for our use case...");
  const step3 = await nano(
    'How to set up a Telegram bot that receives notifications from an automated system. I need: (1) How to create a bot via BotFather, (2) How to get a chat_id, (3) How to send messages via the Telegram Bot API using Node.js/TypeScript (fetch or a library), (4) How to send rich formatted messages with markdown, (5) How to send images/files, (6) Rate limits. Give me a complete technical guide with code examples.'
  );
  console.log(step3);
  console.log("\n---\n");

  await sleep(30000);
  console.log("[4/4] Searching for best Node.js Telegram libraries...");
  const step4 = await nano(
    'What are the best Node.js/TypeScript libraries for Telegram Bot API in 2026? Compare: node-telegram-bot-api, telegraf, grammy, and raw fetch to api.telegram.org. Which is most lightweight, best maintained, and best for just sending notifications (not building a full conversational bot)? Include npm install commands and basic send-message code examples for each.'
  );
  console.log(step4);

  // Save full report
  const report = `# Telegram Integration Research — ${new Date().toISOString()}\n\n## Step 1: All About AI Video Search\n${step1}\n\n---\n\n## Step 2: Technical Details from Video\n${step2}\n\n---\n\n## Step 3: Telegram Bot API Setup Guide\n${step3}\n\n---\n\n## Step 4: Best Node.js Libraries\n${step4}\n`;
  fs.writeFileSync("reports/telegram-research.md", report);
  console.log("\n✅ Full report saved to reports/telegram-research.md");
}

run().catch((e) => console.error("ERROR:", e.message));
