# 浏览器验证新菜单

dev server 默认 9456（`npm run dev`，用户通常在跑，先 `lsof -nP -i :9456` 确认）。
用 `tabbit` skill 驱动真实浏览器；下面的程序可直接喂给
`"$HOME/.local/bin/tabbit-cli" nodejs --task menu-verify --request-id <id>`。

三段程序分开跑：**A** 走主页卡片（注册、封面、跳转），**B** 走图片页（渲染、裁切、滚动），
**C** 走全局搜索（`tags` / `docs` 是否被检索与跳转正确识别）。
三段**共用同一个浏览器页**（同一个 task 下就一个 page），**必须串行执行** —— 并行跑会互相导航，
出现 `pageRoot: false` 这类假失败（实测踩过）。

---

## A. 主页卡片 → 点击跳转

要点：主页用自研 touch 手势切卡片（`touchstart/move/end`，不是 pointer 事件），
Playwright 的 mouse API 触发不了，必须用 `page.evaluate` 合成 `TouchEvent`。
首切阈值 10px，向左滑（dx 为负）= 下一张；轻点前置卡片（`dx/dy < 10`）触发路由跳转。

```js
const base = 'http://127.0.0.1:9456';
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(base + '/', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.home-card', { timeout: 20000 });
await page.waitForTimeout(1500);

const swipe = async (dx) => {
  await page.evaluate((dx) => {
    const mask = document.querySelector('.touch-mask');
    const mk = (x, y) => new Touch({ identifier: 1, target: mask, clientX: x, clientY: y, pageX: x, pageY: y });
    const fire = (type, x, y, active) => {
      const t = mk(x, y);
      mask.dispatchEvent(new TouchEvent(type, {
        touches: active ? [t] : [], targetTouches: active ? [t] : [], changedTouches: [t],
        bubbles: true, cancelable: true,
      }));
    };
    const r = mask.getBoundingClientRect();
    const y = r.top + r.height / 2;
    const x0 = r.left + r.width * 0.7;
    fire('touchstart', x0, y, true);
    fire('touchmove', x0 + dx, y, true);
    fire('touchend', x0 + dx, y, false);
  }, dx);
  await page.waitForTimeout(150);
};

const frontTitle = () => page.$eval('.home-card--front .edict-title', e => e.textContent.trim()).catch(() => null);

const seen = [];
let found = false;
for (let i = 0; i < 12; i++) {
  const t = await frontTitle();
  if (t) seen.push(t);
  if (t && t.includes('<新菜单标题关键字>')) { found = true; break; }
  await swipe(-60);
}

const card = found ? await page.$eval('.home-card--front', el => {
  const img = el.querySelector('img');
  return {
    label: el.querySelector('.edict-package').textContent.trim() + ' · ' + el.querySelector('.edict-title').textContent.trim(),
    naturalW: img ? img.naturalWidth : 0,
    naturalH: img ? img.naturalHeight : 0,
  };
}) : null;

// 轻点前置卡片 → 路由跳转
await page.evaluate(() => {
  const mask = document.querySelector('.touch-mask');
  const r = mask.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const mk = () => new Touch({ identifier: 2, target: mask, clientX: x, clientY: y, pageX: x, pageY: y });
  const fire = (type, active) => {
    const t = mk();
    mask.dispatchEvent(new TouchEvent(type, {
      touches: active ? [t] : [], targetTouches: active ? [t] : [], changedTouches: [t],
      bubbles: true, cancelable: true,
    }));
  };
  fire('touchstart', true);
  fire('touchend', false);
});
await page.waitForTimeout(1200);

const landed = await page.evaluate(() => ({
  url: location.pathname,
  // 注意是 CSS 选择器，类名前要带点：'.xia-hou-yuan-shen-su'
  pageRoot: !!document.querySelector('.<页面根类名>'),
  hasInkBackground: !!document.querySelector('.layout__bg'), // BlankLayout 应为 false
}));

return { seen, found, card, landed, errors: errors.slice(0, 8) };
```

**判读**

- `card.label` 应为 `<packageName> · <name>`；`naturalW/naturalH` 为 0 → 图片没匹配上，回去核对 `image.src` 文件名。
- `landed.url` 为注册的 route，`pageRoot` 为 true（占位符要填**带点的类选择器**，写成裸类名会恒为 false），
  `hasInkBackground` 与所选布局一致（`BlankLayout` 无 `.layout__bg`）。
- `errors` 必须为空；若出现 `Failed to fetch dynamically imported module`，检查 `component` 的 import 路径。
- 滑不到新卡片时，看 `seen` 里已有的标题：新菜单默认排在最后，必要时多滑几张（上限 11 张渲染窗口）。

---

## B. 图片页（用了 `@/ui/ImageGallery` 的页面）

必须先把视口设成手机竖屏（`setViewportSize`）：桌面宽度下横排、竖排的走法不同，桌面默认视口会掩盖问题。
改完页面文件记得 `goto` 重新加载，别依赖 HMR 的中间态。

```js
const base = 'http://127.0.0.1:9456';
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.setViewportSize({ width: 390, height: 844 });
await page.goto(base + '<route>', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.gallery__img', { timeout: 20000 });
await page.waitForTimeout(1400);

const out = await page.evaluate(() => {
  const root = document.querySelector('.gallery');   // 容器即滚动视口，无裱框
  const imgs = [...document.querySelectorAll('.gallery__img')];
  const cs = getComputedStyle(root);
  const rr = root.getBoundingClientRect();
  const rects = imgs.map(el => el.getBoundingClientRect());
  return {
    count: imgs.length,
    // 渲染宽高比 vs 原始宽高比：偏差应 ~1e-5（证明没被裁切或拉伸）
    ratioDrift: imgs.map((el, i) => {
      const nat = el.naturalWidth / el.naturalHeight;
      return +(Math.abs(nat - rects[i].width / rects[i].height) / nat).toFixed(6);
    }),
    // 每张图都铺满容器宽度（不缩图凑一屏）
    fullWidth: rects.every(r => Math.abs(r.width - rr.width) < 1.5),
    // 无装饰：容器自身不留内边距 / 描边 / 圆角
    bare: cs.paddingTop === '0px' && cs.borderTopWidth === '0px' && parseFloat(cs.borderTopLeftRadius) === 0,
    scrollable: root.scrollHeight > root.clientHeight + 1,
    scrollbarHidden: cs.scrollbarWidth === 'none',
    splashGone: !document.querySelector('.app-splash'),
  };
});
return { out, errors: errors.slice(0, 5) };
```

**判读**

| 检查 | 期望 |
|---|---|
| `count` | 与页面 `images` 数量一致 |
| `ratioDrift` | 全部 < `0.0001`，否则图片被裁切/拉伸了 |
| `fullWidth` | `true` —— 每张图都铺满容器宽度 |
| `bare` | `true` —— 容器无内边距 / 描边 / 圆角 |
| `scrollable` | 内容超一屏为 `true`；一屏放得下为 `false`（此时整组居中） |
| `scrollbarHidden` | `true` |
| `splashGone` | `true` —— `usePageReady()` 生效，图片加载完才解除 Splash |
| `errors` | 空数组 |

---

## C. 全局搜索（注册表写了 `tags` / `docs` 时）

走真实入口，别直接改 `useGlobalSearch`：**玉玺单击**打开蒙层（长按是控制台）。
两个要点：① 玉玺靠 `pointerdown/up` 判定，Playwright 的 `mouse.click` 可用；
② 蒙层要等索引就绪才出结果（首次打开会动态 import 拼音库，dev 下几百 ms），所以等内容出现要 `waitForSelector('.search-row')`，别只 sleep。

```js
const base = 'http://127.0.0.1:9456';
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.setViewportSize({ width: 390, height: 844 });   // 手机竖屏：蒙层满屏，贴近真实
await page.goto(base + '<route>', { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.jade-seal', { timeout: 20000 });
await page.waitForTimeout(1400);

// 单击玉玺 → 搜索蒙层（长按是控制台，别用 down/wait/up 那套）
const box = await page.locator('.jade-seal').boundingBox();
await page.mouse.click(Math.round(box.x + box.width / 2), Math.round(box.y + box.height / 2));
await page.waitForSelector('.search-field__input', { timeout: 5000 });

const search = async (q) => {
  await page.locator('.search-field__input').fill(q);
  await page.waitForTimeout(350);
  return page.evaluate(() => [...document.querySelectorAll('.search-row')].map(n => ({
    text: n.textContent.trim().replace(/\s+/g, ' ').slice(0, 40),
    disabled: n.classList.contains('search-row--disabled'),
    marks: [...n.querySelectorAll('mark')].map(m => m.textContent),
  })));
};

// ① tags：菜单名之外的叫法（汉字 / 全拼 / 首字母三路都试）
const byTag = await search('<tags 里的词，如 规则>');
const byPinyin = await search('<该词的拼音，如 guize>');
const byAcronym = await search('<或首字母，如 xhys>');

// ② docs：文档正文里的词 → 结果行应挂在本菜单名下且可点
const byDoc = await search('<文档正文里的词>');
const docRow = byDoc.find(r => r.text.startsWith('文档'));

// ③ 点文档行 → 跳本菜单页 + 滚动高亮到那一句
await page.locator('.search-row:not(.search-row--disabled)').first().click();
await page.waitForSelector('mark.md-hit', { timeout: 8000 });
await page.waitForTimeout(1000);
const landed = await page.evaluate(() => {
  const mark = document.querySelector('mark.md-hit');
  const scroller = document.querySelector('.<页面根类名>');
  return {
    url: location.pathname,
    query: location.search.includes('keyword='),
    mark: mark ? mark.textContent : null,
    inView: mark ? (() => { const r = mark.getBoundingClientRect(); return r.top > 0 && r.bottom < window.innerHeight; })() : false,
    scrolled: scroller ? Math.round(scroller.scrollTop) > 0 : null,
    panelClosed: document.querySelectorAll('.search-panel').length === 0,
  };
});

return { byTag, byPinyin, byAcronym, docRow, landed, errors: errors.slice(0, 6) };
```

**判读**

| 检查 | 期望 |
|---|---|
| `byTag` / `byPinyin` / `byAcronym` | 都能搜出新菜单行（菜单行只有标签、没有高亮片段）；命中的**文档行** `marks` 里应出现高亮汉字 —— 拼音/首字母查询也会回溯成汉字标红 |
| `docRow` | `text` 以 `文档` 开头、标题是**菜单名**（不是 `文件名`）、`disabled: false` |
| `landed.url` / `query` | 本菜单的 route，且 query 里带 `keyword=` |
| `landed.mark` / `inView` / `scrolled` | 命中那句被高亮、滚进了视野、容器确实滚过 |
| `landed.panelClosed` | `true` —— 选中结果后蒙层自动收起 |
| `errors` | 空数组 |

文档行标题显示成文件名、或整行 `disabled: true` → `docs` 没写或 id 与 `src/assets/md/` 下的文件名不一致（先 `ls src/assets/md/` 比对）。
搜不到 `tags` 里的词 → 该字段拼写有误，或条目根本没写 `tags`。
