const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const root = path.resolve(__dirname, "..");
const targets = [
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

const classConversions = [
    { match: "btn-primary", add: ["btn", "btn--primary"] },
    { match: "btn-accent", add: ["btn", "btn--accent"] },
    { match: "btn-outline", add: ["btn", "btn--outline"] },
    { match: "btn-soft", add: ["btn", "btn--soft"] },
    { match: "btn-intake-primary", add: ["btn", "btn--primary", "btn--wide"] },
    { match: "btn-intake-ghost", add: ["btn", "btn--outline", "btn--wide"] },
    { match: "btn-submit", add: ["btn", "btn--primary", "btn--form"] },
    { match: "btn-sm", add: ["btn--sm"] },
    { match: "btn-lg", add: ["btn--lg"] },
    { match: "btn-block", add: ["btn--block"] },
    { match: "button", add: ["btn"] },
    { match: "button--primary", add: ["btn", "btn--primary"] },
    { match: "button--accent", add: ["btn", "btn--accent"] },
    { match: "button--soft", add: ["btn", "btn--soft"] },
    { match: "button--outline", add: ["btn", "btn--outline"] },
    { match: "button--about", add: ["btn", "btn--primary", "btn--about"] },
    { match: "button--sm", add: ["btn--sm"] },
    { match: "button--lg", add: ["btn--lg"] }
];

const insertUnique = (tokens, insertAt, values) => {
    let offset = 0;
    values.forEach((value) => {
        if (!tokens.includes(value)) {
            tokens.splice(insertAt + offset, 0, value);
            offset += 1;
        }
    });
};

const ensureBase = (tokens) => {
    const modifierIndex = tokens.findIndex((cls) => cls.startsWith("btn--") && cls !== "btn--block");
    if (modifierIndex !== -1 && !tokens.includes("btn")) {
        tokens.splice(modifierIndex, 0, "btn");
    }
};

const run = () => {
    targets.forEach((relative) => {
        const filePath = path.join(root, relative);
        const html = fs.readFileSync(filePath, "utf8");
        const $ = cheerio.load(html, { decodeEntities: false });
        let changed = false;

        $("[class]").each((_, el) => {
            const tokens = $(el)
                .attr("class")
                .split(/\s+/)
                .map((token) => token.trim())
                .filter(Boolean);

            const original = tokens.slice();

            classConversions.forEach(({ match, add }) => {
                let index = tokens.indexOf(match);
                while (index !== -1) {
                    tokens.splice(index, 1);
                    insertUnique(tokens, index, add);
                    index = tokens.indexOf(match);
                }
            });

            ensureBase(tokens);

            if (tokens.join(" ") !== original.join(" ")) {
                changed = true;
                $(el).attr("class", tokens.join(" "));
            }
        });

        if (changed) {
            fs.writeFileSync(filePath, $.html());
            console.log(`Updated button classes in ${relative}`);
        }
    });
};

run();
