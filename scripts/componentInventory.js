const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const root = path.resolve(__dirname, "..");
const targetFiles = [
    "index.html",
    "digipunt.html",
    path.join("cvdb", "index.html"),
    "inschrijven.html",
    "opleidingen.html",
    "overons.html",
    "python.html",
    "security.html",
    "support.html",
    "vacatures.html",
    "wiezijnwe.html",
    "systeembeheerder.html",
    "contact.html"
];

const categories = {
    buttons: new Set(),
    cards: new Set(),
    banners: new Set(),
    features: new Set(),
    info: new Set(),
    ctas: new Set(),
    forms: new Set(),
    grids: new Set(),
};

const keywords = [
    { key: "buttons", pattern: /btn|button/i },
    { key: "cards", pattern: /card/i },
    { key: "banners", pattern: /hero|banner|callout/i },
    { key: "features", pattern: /feature|highlight/i },
    { key: "info", pattern: /info|benefit|detail|stats/i },
    { key: "ctas", pattern: /cta|actions|enrollment/i },
    { key: "forms", pattern: /form|input|field|label/i },
    { key: "grids", pattern: /grid|container|wrapper|section/i },
];

for (const relative of targetFiles) {
    const filePath = path.join(root, relative);
    const html = fs.readFileSync(filePath, "utf8");
    const $ = cheerio.load(html, { decodeEntities: false });

    $("[class]").each((_, el) => {
        const classes = $(el)
            .attr("class")
            .split(/\s+/)
            .map((token) => token.trim())
            .filter(Boolean);

        for (const cls of classes) {
            for (const { key, pattern } of keywords) {
                if (pattern.test(cls)) {
                    categories[key].add(cls);
                }
            }
        }
    });
}

const output = Object.fromEntries(
    Object.entries(categories).map(([key, value]) => [key, Array.from(value).sort()])
);

const reportPath = path.join(root, "reports", "phase9_component_inventory.json");
fs.writeFileSync(reportPath, JSON.stringify(output, null, 2));

console.log(`Component inventory written to ${path.relative(root, reportPath)}`);
