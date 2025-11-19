const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

function validateFile(filePath) {
    const absolutePath = path.resolve(filePath);
    const css = fs.readFileSync(absolutePath, 'utf8');
    try {
        postcss.parse(css, { from: absolutePath });
        return null;
    } catch (error) {
        if (error.name === 'CssSyntaxError') {
            return {
                file: path.relative(process.cwd(), absolutePath),
                line: error.line,
                column: error.column,
                reason: error.reason,
                source: error.source || ''
            };
        }
        return {
            file: path.relative(process.cwd(), absolutePath),
            reason: error.message || 'Unknown error'
        };
    }
}

function main() {
    const files = process.argv.slice(2);
    if (files.length === 0) {
        console.error('Usage: node validate_css.js <file ...>');
        process.exit(1);
    }

    const issues = [];
    for (const filePath of files) {
        const issue = validateFile(filePath);
        if (issue) {
            issues.push(issue);
        }
    }

    process.stdout.write(JSON.stringify(issues));
}

main();
