const cron = require("node-cron");
const { generateProductIdea, generatePromptPack, generateDescription } = require("./content/generator");
const { createProduct, getSales, getProducts } = require("./pipelines/gumroad");

let stats = {
  productsCreated: 0,
  totalSales: 0,
  totalRevenue: 0,
  lastRun: null,
  lastProduct: null,
  errors: [],
};

async function runProductionCycle() {
  console.log("\n[OVERSEER] ▸ Production cycle starting...");
  stats.lastRun = new Date().toISOString();

  try {
    // 1. Check existing products to avoid duplicates
    console.log("[OVERSEER] Fetching existing products...");
    const existingProducts = await getProducts();
    console.log(`[OVERSEER] Found ${existingProducts.length} existing products`);

    // 2. Generate new product idea
    console.log("[OVERSEER] Generating product idea...");
    const idea = await generateProductIdea(existingProducts);
    console.log(`[OVERSEER] Idea: ${idea.name} @ $${idea.price}`);

    // 3. Generate content and description in parallel
    console.log("[OVERSEER] Generating content...");
    const [content, description] = await Promise.all([
      generatePromptPack(idea),
      generateDescription(idea),
    ]);
    console.log("[OVERSEER] Content generated successfully");

    // 4. Post to Gumroad
    console.log("[OVERSEER] Posting to Gumroad...");
    const result = await createProduct({
      name: idea.name,
      description,
      price: idea.price,
      content,
    });

    if (result.success) {
      stats.productsCreated++;
      stats.lastProduct = idea.name;
      console.log(`[OVERSEER] ✓ Product live: ${idea.name}`);
    } else {
      stats.errors.push({ time: new Date().toISOString(), error: result.error });
      console.log(`[OVERSEER] ✗ Product failed: ${result.error}`);
    }
  } catch (err) {
    stats.errors.push({ time: new Date().toISOString(), error: err.message });
    console.error("[OVERSEER CYCLE ERROR]", err.message);
  }
}

async function runSalesAudit() {
  console.log("\n[OVERSEER] ▸ Sales audit starting...");

  try {
    const sales = await getSales();
    stats.totalSales = sales.length;
    stats.totalRevenue = sales.reduce((sum, s) => sum + (s.price / 100), 0);

    console.log(`[OVERSEER] Sales: ${stats.totalSales} | Revenue: $${stats.totalRevenue.toFixed(2)}`);

    // Scale logic — if revenue is healthy, increase production
    if (stats.totalRevenue > 50) {
      console.log("[OVERSEER] ▸ Revenue threshold hit — scaling production");
    }

    if (stats.totalRevenue > 200) {
      console.log("[OVERSEER] ▸ $200 threshold hit — ready for pipeline expansion");
    }

  } catch (err) {
    console.error("[OVERSEER AUDIT ERROR]", err.message);
  }
}

function startScheduler() {
  console.log("[OVERSEER] Scheduler online");

  // Run production cycle every 48 hours
  // Keeps product catalog growing without flooding Gumroad
  cron.schedule("0 9 */2 * *", async () => {
    await runProductionCycle();
  });

  // Run sales audit every 24 hours at 8am
  cron.schedule("0 8 * * *", async () => {
    await runSalesAudit();
  });

  // Initial run on startup after 10 second delay
  setTimeout(async () => {
    await runProductionCycle();
    await runSalesAudit();
  }, 10000);
}

function getStats() {
  return stats;
}

module.exports = { startScheduler, getStats, runProductionCycle, runSalesAudit };
