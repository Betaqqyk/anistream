const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const injectHTML = `                <div class="nav-dropdown">
                    <a href="javascript:void(0)" class="dropdown-toggle">อนิเมะจีน <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></a>
                    <div class="dropdown-menu">
                        <a href="/search.html?q=จีน ซับไทย">ซับไตเติ้ล</a>
                        <a href="/search.html?q=จีน พากย์ไทย">พากย์ไทย</a>
                    </div>
                </div>`;

let count = 0;
files.forEach(file => {
    let content = fs.readFileSync(path.join(dir, file), 'utf8');
    // Replace right after the popular.html link
    if (content.includes('nav-dropdown')) {
        console.log(`Skipped ${file} (already injected)`);
        return;
    }
    content = content.replace(/(<a href="\/popular\.html"(?: class="[^"]*")?>ยอดนิยม<\/a>)/, `$1\n${injectHTML}`);
    fs.writeFileSync(path.join(dir, file), content, 'utf8');
    count++;
    console.log(`Injected ${file}`);
});
console.log(`Done injecting ${count} files.`);
