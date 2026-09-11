# 浏览器验证新菜单

dev server 默认 9456（`npm run dev`，用户通常在跑，先 `lsof -nP -i :9456` 确认）。
用 `tabbit` skill 驱动真实浏览器；下面的程序可直接喂给
`"$HOME/.local/bin/tabbit-cli" nodejs --task menu-verify --request-id verify-menu`。

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
  pageRoot: !!document.querySelector('<页面根类名>'),
  hasInkBackground: !!document.querySelector('.layout__bg'), // BlankLayout 应为 false
}));

return { seen, found, card, landed, errors: errors.slice(0, 8) };
```

## 判读

- `card.label` 应为 `<packageName> · <name>`；`naturalW/naturalH` 为 0 → 图片没匹配上，回去核对 `image.src` 文件名。
- `landed.url` 为注册的 route，`pageRoot` 为 true，`hasInkBackground` 与所选布局一致。
- `errors` 必须为空；若出现 `Failed to fetch dynamically imported module`，检查 `component` 的 import 路径。
- 滑不到新卡片时，看 `seen` 里已有的标题：新菜单默认排在最后，必要时多滑几张（上限 11 张渲染窗口）。
