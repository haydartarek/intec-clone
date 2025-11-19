const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const jsRoot = path.resolve(__dirname, '..', 'assets', 'js');
const hexPatternSource = '#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b';
const mode = detectMode();

function detectMode() {
    if (process.argv.includes('--all')) {
        return 'all';
    }
    if (process.env.TOKENS_LINT_JS_MODE && process.env.TOKENS_LINT_JS_MODE.toLowerCase() === 'all') {
        return 'all';
    }
    return 'diff';
}

function ensureJsRoot() {
    if (!fs.existsSync(jsRoot)) {
        throw new Error(`JS source directory missing: ${jsRoot}`);
    }
}

function getLocation(source, index) {
    const preceding = source.slice(0, index);
    const lines = preceding.split(/\r?\n/);
    return {
        line: lines.length,
        column: lines[lines.length - 1].length + 1
    };
}

function extractLine(source, lineNumber) {
    const lines = source.split(/\r?\n/);
    return lines[lineNumber - 1] || '';
}

function findMatches(text) {
    const pattern = new RegExp(hexPatternSource, 'g');
    const matches = [];
    let match;
    while ((match = pattern.exec(text)) !== null) {
        matches.push({ index: match.index, value: match[0] });
    }
    return matches;
}

function collectJsFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectJsFiles(fullPath));
            return;
        }
        if (entry.isFile() && entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    });
    return files;
}

function lintAllFiles() {
    ensureJsRoot();
    const issues = [];
    const jsFiles = collectJsFiles(jsRoot);

    jsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        findMatches(content).forEach(match => {
            const location = getLocation(content, match.index);
            issues.push({
                file: path.relative(process.cwd(), filePath),
                line: location.line,
                column: location.column,
                value: match.value,
                sample: extractLine(content, location.line).trim(),
                scope: 'full-scan'
            });
        });
    });

    return issues;
}

function runGitDiff(args) {
    const result = spawnSync('git', args, { encoding: 'utf8' });
    if (result.error) {
        if (result.error.code === 'ENOENT') {
            return { error: 'git-not-found' };
        }
        throw result.error;
    }
    if (result.status === 128 && /not a git repository/i.test(result.stderr || '')) {
        return { error: 'not-git' };
    }
    if (result.status !== 0) {
        const message = (result.stderr || result.stdout || '').trim();
        throw new Error(message || `git ${args.join(' ')} failed.`);
    }
    return { stdout: result.stdout || '' };
}

function parseDiff(diffText, scopeLabel) {
    const issues = [];
    let currentFile = null;
    let currentLine = null;
    const fileHeader = /^\+\+\+ b\/(.+)$/;

    diffText.split(/\r?\n/).forEach(line => {
        const fileMatch = fileHeader.exec(line);
        if (fileMatch) {
            const filePath = fileMatch[1].replace(/^\.\//, '');
            if (filePath.endsWith('.js') && filePath.startsWith('assets/js')) {
                currentFile = filePath;
            } else {
                currentFile = null;
            }
            return;
        }

        if (!currentFile) {
            return;
        }

        if (line.startsWith('@@')) {
            const match = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/.exec(line);
            if (match) {
                currentLine = parseInt(match[1], 10) - 1;
            }
            return;
        }

        if (line.startsWith('+') && !line.startsWith('+++')) {
            currentLine = (currentLine ?? 0) + 1;
            const content = line.slice(1);
            findMatches(content).forEach(match => {
                issues.push({
                    file: currentFile,
                    line: currentLine,
                    column: match.index + 1,
                    value: match.value,
                    sample: content.trim(),
                    scope: scopeLabel
                });
            });
            return;
        }

        if (line.startsWith('-') && !line.startsWith('---')) {
            return;
        }

        if (line.startsWith(' ')) {
            currentLine = (currentLine ?? 0) + 1;
        }
    });

    return issues;
}

function lintDiffs() {
    ensureJsRoot();
    const diffs = [
        { label: 'staged', args: ['diff', '--cached', '--unified=0', '--', 'assets/js'] },
        { label: 'working', args: ['diff', '--unified=0', '--', 'assets/js'] }
    ];

    const issues = [];
    const seen = new Set();
    let anyDiffOutput = false;

    for (const diff of diffs) {
        const result = runGitDiff(diff.args);
        if (result.error === 'git-not-found' || result.error === 'not-git') {
            return { issues: [], skipped: true, reason: result.error };
        }

        if (result.stdout && result.stdout.trim().length) {
            anyDiffOutput = true;
        }

        const parsed = parseDiff(result.stdout || '', diff.label);
        parsed.forEach(issue => {
            const key = `${issue.file}:${issue.line}:${issue.column}:${issue.value}`;
            if (!seen.has(key)) {
                seen.add(key);
                issues.push(issue);
            }
        });
    }

    return { issues, skipped: false, anyDiffOutput };
}

function reportAndExit(issues) {
    console.error('Design token check failed for JavaScript sources:');
    issues.forEach(issue => {
        const { file, line, column, value, scope, sample } = issue;
        console.error(`- ${file}:${line}:${column} (${value}) [${scope}] ${sample}`);
    });
    process.exitCode = 1;
}

function main() {
    if (mode === 'all') {
        const issues = lintAllFiles();
        if (issues.length) {
            reportAndExit(issues);
            return;
        }
        console.log('Design token JS check passed (full scan).');
        return;
    }

    const result = lintDiffs();
    if (result.skipped) {
        console.warn('Git repository not detected. Re-run with "--all" to enforce a full scan.');
        return;
    }

    if (!result.anyDiffOutput) {
        console.log('Design token JS check passed (no JavaScript changes detected).');
        return;
    }

    if (result.issues.length) {
        reportAndExit(result.issues);
        return;
    }

    console.log('Design token JS check passed (no new literal colors in JavaScript diffs).');
}

main();
