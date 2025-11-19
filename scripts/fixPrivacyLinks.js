const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const targetFile = 'privacy.html';

const toPosix = (value) => value.split(path.sep).join('/');

const getHtmlFiles = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        if (entry.name.startsWith('.')) {
            continue;
        }

        const absolute = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (['node_modules', 'assets', 'data', 'reports', 'scripts', '.git'].includes(entry.name)) {
                continue;
            }
            files.push(...getHtmlFiles(absolute));
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            files.push(absolute);
        }
    }

    return files;
};

const htmlFiles = getHtmlFiles(projectRoot);

const makeRelativeHref = (filePath) => {
    const relative = toPosix(path.relative(projectRoot, filePath));
    const dir = path.posix.dirname(relative);
    if (dir === '.' || dir === '') {
        return targetFile;
    }
    const backPath = path.posix.relative(dir, '.');
    return path.posix.join(backPath, targetFile);
};

let updatedFiles = 0;

for (const file of htmlFiles) {
    const relativeHref = makeRelativeHref(file);
    const original = fs.readFileSync(file, 'utf8');
    let updated = original;
    if (updated.includes('href="#" data-i18n="footer.privacy"')) {
        updated = updated.split('href="#" data-i18n="footer.privacy"').join(`href="${relativeHref}" data-i18n="footer.privacy"`);
    }
    if (updated.includes('href="/privacy"')) {
        updated = updated.split('href="/privacy"').join(`href="${relativeHref}"`);
    }

    if (updated !== original) {
        fs.writeFileSync(file, updated);
        updatedFiles += 1;
    }
}

console.log(`Updated privacy links in ${updatedFiles} file(s).`);
