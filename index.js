require("dotenv").config();
const express = require("express");
const { startScheduler, getStats, runProductionCycle, runSalesAudit } = require("./scheduler");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Dashboard
app.get("/", (req, res) => {
  const stats = getStats();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>OVERSEER — Control Panel</title>
      <meta http-equiv="refresh" content="60">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          background: #050810;
          color: #e2e8f0;
          font-family: 'Courier New', monospace;
          padding: 40px;
        }
        h1 {
          font-size: 28px;
          letter-spacing: 8px;
          color: #f8fafc;
          margin-bottom: 4px;
        }
        .sub {
          color: #475569;
          font-size: 11px;
          letter-spacing: 3px;
          margin-bottom: 40px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }
        .card {
          background: #080c14;
          border: 1px solid #0f172a;
          border-left: 3px solid #1e40af;
          padding: 20px;
          border-radius: 4px;
        }
        .card-label {
          font-size: 10px;
          color: #475569;
          letter-spacing: 2px;
          margin-bottom: 8px;
        }
        .card-value {
          font-size: 28px;
          font-weight: bold;
          color: #3b82f6;
        }
        .card-value.green { color: #10b981; }
        .card-value.yellow { color: #f59e0b; }
        .card-value.red { color: #ef4444; }
        .section-title {
          font-size: 11px;
          color: #475569;
          letter-spacing: 3px;
          margin-bottom: 12px;
          margin-top: 32px;
        }
        .status-row {
          background: #080c14;
          border: 1px solid #0f172a;
          padding: 12px 16px;
          border-radius: 4px;
          margin-bottom: 8px;
          font-size: 12px;
          color: #64748b;
          display: flex;
          justify-content: space-between;
        }
        .status-row span { color: #94a3b8; }
        .dot {
          display: inline-block;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          margin-right: 8px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .btn {
          display: inline-block;
          margin-right: 12px;
          margin-top: 24px;
          padding: 10px 24px;
          background: transparent;
          border: 1px solid #1e40af;
          color: #3b82f6;
          border-radius: 4px;
          font-family: monospace;
          font-size: 12px;
          letter-spacing: 2px;
          cursor: pointer;
          text-decoration: none;
        }
        .error-box {
          background: #1a0a0a;
          border: 1px solid #7f1d1d;
          padding: 12px 16px;
          border-radius: 4px;
          font-size: 11px;
          color: #ef4444;
          margin-bottom: 8px;
        }
        .net-positive { color: #10b981; }
        .net-negative { color: #ef4444; }
      </style>
    </head>
    <body>
      <h1>⬡ OVERSEER</h1>
      <div class="sub">AUTONOMOUS ECONOMIC ENGINE — LIVE DASHBOARD</div>

      <div class="grid">
        <div class="card">
          <div class="card-label">STATUS</div>
          <div class="card-value green" style="font-size:16px;padding-top:6px;">
            <span class="dot"></span>ONLINE
          </div>
        </div>
        <div class="card">
          <div class="card-label">UPTIME</div>
          <div class="card-value yellow" style="font-size:20px;">${hours}h ${minutes}m</div>
        </div>
        <div class="card">
          <div class="card-label">PRODUCTS CREATED</div>
          <div class="card-value">${stats.productsCreated}</div>
        </div>
        <div class="card">
          <div class="card-label">TOTAL SALES</div>
          <div class="card-value green">${stats.totalSales}</div>
        </div>
        <div class="card">
          <div class="card-label">GROSS REVENUE</div>
          <div class="card-value green">$${stats.totalRevenue.toFixed(2)}</div>
        </div>
        <div class="card">
          <div class="card-label">NET (after $20 cost)</div>
          <div class="card-value ${stats.totalRevenue - 20 >= 0 ? "green" : "red"}">
            $${(stats.totalRevenue - 20).toFixed(2)}
          </div>
        </div>
      </div>

      <div class="section-title">LAST ACTIVITY</div>
      <div class="status-row">
        <span>Last cycle run</span>
        <span>${stats.lastRun || "Pending..."}</span>
      </div>
      <div class="status-row">
        <span>Last product created</span>
        <span>${stats.lastProduct || "Pending..."}</span>
      </div>
      <div class="status-row">
        <span>Next production cycle</span>
        <span>Every 48 hours</span>
      </div>
      <div class="status-row">
        <span>Next sales audit</span>
        <span>Every 24 hours</span>
      </div>

      ${stats.errors.length > 0 ? `
        <div class="section-title">RECENT ERRORS</div>
        ${stats.errors.slice(-3).map(e => `
          <div class="error-box">${e.time} — ${e.error}</div>
        `).join("")}
      ` : ""}

      <div>
        <a class="btn" href="/trigger/production">▸ FORCE PRODUCTION CYCLE</a>
        <a class="btn" href="/trigger/audit">▸ FORCE SALES AUDIT</a>
        <a class="btn" href="/stats">▸ RAW STATS JSON</a>
      </div>

      <div class="section-title" style="margin-top:40px;">OPERATOR INSTRUCTIONS</div>
      <div class="status-row"><span>Your only job</span><span>Withdraw from Stripe/Gumroad</span></div>
      <div class="status-row"><span>Production cadence</span><span>1 new product every 48hrs</span></div>
      <div class="status-row"><span>Break-even</span><span>1 sale @ $20+ covers Claude Pro</span></div>
    </body>
    </html>
  `);
});

// Raw stats
app.get("/stats", (req, res) => {
  res.json(getStats());
});

// Manual triggers (for you to force a cycle if needed)
app.get("/trigger/production", async (req, res) => {
  res.send("Production cycle triggered — check logs");
  await runProductionCycle();
});

app.get("/trigger/audit", async (req, res) => {
  res.send("Sales audit triggered — check logs");
  await runSalesAudit();
});

// Start
app.listen(PORT, () => {
  console.log(`[OVERSEER] Dashboard live on port ${PORT}`);
  startScheduler();
});
