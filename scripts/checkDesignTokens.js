const fs = require('fs');
const path = require('path');

const manifestPath = path.resolve(__dirname, '..', 'data', 'design-tokens.json');
const cssCandidates = [
    path.resolve(__dirname, '..', 'assets', 'css', 'main.css'),
    path.resolve(__dirname, '..', 'assets', 'css', 'components.css'),
    path.resolve(__dirname, '..', 'assets', 'css', 'static.css')
];

function requireManifest() {
    if (!fs.existsSync(manifestPath)) {
        throw new Error('Token manifest missing. Run "npm run tokens:extract" first.');
    }
    const payload = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (!payload.tokens || typeof payload.tokens !== 'object') {
        throw new Error('Token manifest malformed.');
    }
    return new Set(Object.keys(payload.tokens));
}

function getLocation(source, index) {
    const preceding = source.slice(0, index);
    const lines = preceding.split(/\r?\n/);
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

function lintFile(filePath, tokens) {
    const content = fs.readFileSync(filePath, 'utf8');
    const literalPattern = /#[0-9a-fA-F]{3,6}\b/g;
    const varPattern = /var\(--([a-z0-9-]+)/gi;
    const issues = [];

    let match;
    while ((match = literalPattern.exec(content)) !== null) {
        const location = getLocation(content, match.index);
        issues.push({
            type: 'literal-color',
            value: match[0],
            location
        });
    }

    while ((match = varPattern.exec(content)) !== null) {
        const tokenName = match[1];
        if (!tokens.has(tokenName)) {
            const location = getLocation(content, match.index);
            issues.push({
                type: 'unknown-token',
                value: tokenName,
                location
            });
        }
    }

    return issues;
}

function main() {
    const knownTokens = requireManifest();
    const files = cssCandidates.filter(fs.existsSync);

    if (!files.length) {
        console.warn('No CSS files found to lint.');
        return;
    }

    const allIssues = [];

    files.forEach(filePath => {
        const relPath = path.relative(process.cwd(), filePath);
        const issues = lintFile(filePath, knownTokens);
        if (issues.length) {
            issues.forEach(issue => {
                allIssues.push({ file: relPath, ...issue });
            });
        }
    });

    if (allIssues.length) {
        console.error('Design token check failed with the following issues:');
        allIssues.forEach(issue => {
            const { file, type, value, location } = issue;
            console.error(`- [${type}] ${file}:${location.line}:${location.column} -> ${value}`);
        });
        process.exitCode = 1;
        return;
    }

    console.log('Design token check passed for', files.map(f => path.relative(process.cwd(), f)).join(', '));
}

main();
