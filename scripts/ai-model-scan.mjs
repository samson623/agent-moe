import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SOURCES = [
  { name: 'HuggingFace Trending', url: 'https://huggingface.co/models?sort=trending' },
  { name: 'HuggingFace Recent', url: 'https://huggingface.co/models?sort=modified' },
  { name: 'OpenAI Blog', url: 'https://openai.com/blog' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news' },
  { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/' },
  { name: 'Mistral AI News', url: 'https://mistral.ai/news/' },
  { name: 'xAI', url: 'https://x.ai' },
  { name: 'Reddit r/MachineLearning', url: 'https://www.reddit.com/r/MachineLearning/new/' },
  { name: 'Reddit r/LocalLLaMA', url: 'https://www.reddit.com/r/LocalLLaMA/new/' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/' },
  { name: 'The Verge AI', url: 'https://www.theverge.com/ai-artificial-intelligence' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/' },
  { name: 'The Decoder', url: 'https://the-decoder.com/' },
  { name: 'MarkTechPost', url: 'https://www.marktechpost.com/' },
  { name: 'YouTube AI Models Today', url: 'https://www.youtube.com/results?search_query=new+ai+model+released+today' },
  { name: 'ArXiv CS.AI Recent', url: 'https://arxiv.org/list/cs.AI/recent' },
];

async function scrapeSource(page, source) {
  try {
    await page.goto(source.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const text = await page.evaluate(() => document.body?.innerText?.slice(0, 15000) ?? '');
    const title = await page.title();
    const links = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href]'))
        .map(a => ({ text: a.innerText?.trim().slice(0, 120), href: a.href }))
        .filter(l => l.href.startsWith('http') && l.text.length > 5)
        .slice(0, 100)
    );
    return { name: source.name, url: source.url, title, text, links, error: null };
  } catch (err) {
    return { name: source.name, url: source.url, title: null, text: null, links: [], error: err.message };
  }
}

async function main() {
  console.log('Launching browser (headed)...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  const results = [];
  for (let i = 0; i < SOURCES.length; i++) {
    const source = SOURCES[i];
    console.log(`[${i + 1}/${SOURCES.length}] ${source.name} ...`);
    const r = await scrapeSource(page, source);
    results.push(r);
    if (r.error) console.log(`  FAILED: ${r.error}`);
    else console.log(`  OK — ${r.text?.length ?? 0} chars, ${r.links?.length ?? 0} links`);
  }

  await browser.close();

  writeFileSync('scripts/ai-scan-results.json', JSON.stringify(results, null, 2));
  console.log('\nResults saved to scripts/ai-scan-results.json');
}

main();
