const fs = require('fs');
const path = require('path');

const baseCssPath = path.resolve(__dirname, '..', 'assets', 'css', 'base.css');
const outputPath = path.resolve(__dirname, '..', 'data', 'design-tokens.json');

function getRootBlock(source) {
    const rootMatch = source.match(/:root\s*{([\s\S]*?)}/);
    if (!rootMatch) {
        throw new Error('Unable to locate :root block in base.css');
    }
    return rootMatch[1];
}

function extractTokens(block) {
    const tokenRegex = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
    const tokens = {};
    let match;

    while ((match = tokenRegex.exec(block)) !== null) {
        const [, name, rawValue] = match;
        tokens[name] = rawValue.trim();
    }

    if (!Object.keys(tokens).length) {
        throw new Error('No tokens found inside :root block.');
    }

    return Object.keys(tokens)
        .sort()
        .reduce((acc, key) => {
            acc[key] = tokens[key];
            return acc;
        }, {});
}

function writeManifest(tokens) {
    const payload = {
        generatedAt: new Date().toISOString(),
        source: path.relative(process.cwd(), baseCssPath),
        tokens
    };

    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
    console.log(`Design token manifest written to ${path.relative(process.cwd(), outputPath)}`);
}

function main() {
    const css = fs.readFileSync(baseCssPath, 'utf8');
    const rootBlock = getRootBlock(css);
    const tokens = extractTokens(rootBlock);
    writeManifest(tokens);
}

main();
