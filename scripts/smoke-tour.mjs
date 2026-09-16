import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const OUT = '/opt/cursor/artifacts';
fs.mkdirSync(OUT, { recursive: true });

async function holdKey(page, key, ms) {
  await page.keyboard.down(key);
  await page.waitForTimeout(ms);
  await page.keyboard.up(key);
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--enable-webgl', '--ignore-gpu-blocklist'],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: OUT, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__tourDebug);
  await page.waitForTimeout(1000);

  const hud = await page.locator('#hud h1').textContent();
  const vrBtn = await page.locator('.vr-btn').textContent();
  console.log('HUD:', hud);
  console.log('VR button:', vrBtn);

  await page.screenshot({ path: path.join(OUT, '01_valle_inicial.png') });

  // Caminata real WASD hacia la casa
  await page.locator('#c').click({ position: { x: 640, y: 360 } });
  await page.waitForTimeout(200);

  for (let i = 0; i < 5; i++) {
    await holdKey(page, 'Shift', 10);
    await page.keyboard.down('Shift');
    await holdKey(page, 'w', 1800);
    await page.keyboard.up('Shift');
  }

  const pos1 = await page.evaluate(() => window.__tourDebug.getPosition());
  console.log('Posición tras caminar:', pos1);
  await page.screenshot({ path: path.join(OUT, '02_camino_palmas.png') });

  // Acercar a la puerta si hace falta y entrar con E
  await page.evaluate(() => {
    window.__tourDebug.setPosition(0, 1.6, -24);
  });
  await page.waitForTimeout(200);
  await page.locator('#c').click({ position: { x: 640, y: 360 } });
  await page.keyboard.press('e');
  await page.waitForTimeout(500);

  let zone = await page.locator('#zone-badge').textContent();
  console.log('Zona tras E:', zone);

  if (!zone.includes('Museo')) {
    await page.evaluate(() => window.__tourDebug.enterMuseum());
    await page.waitForTimeout(400);
    zone = await page.locator('#zone-badge').textContent();
    console.log('Zona tras enterMuseum():', zone);
  }

  await page.screenshot({ path: path.join(OUT, '03_museo_interior.png') });

  // Hotspot Café
  await page.evaluate(() => window.__tourDebug.openHotspot('cafe'));
  await page.waitForTimeout(400);
  const overlay = await page.locator('#hotspot-overlay').count();
  const title = await page.locator('#hotspot-title').textContent();
  console.log('Overlay:', overlay > 0, title);
  await page.screenshot({ path: path.join(OUT, '04_hotspot_cafe.png') });

  await page.locator('#hotspot-close').click();
  await page.waitForTimeout(300);

  // Guadua + video stubs
  await page.evaluate(() => window.__tourDebug.openHotspot('guadua'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '05_hotspot_guadua.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  await page.evaluate(() => window.__tourDebug.openHotspot('video'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, '06_hotspot_video_stub.png') });
  await page.keyboard.press('Escape');

  await page.evaluate(() => window.__tourDebug.exitMuseum());
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '07_salida_casa.png') });

  console.log('Page errors:', errors.length ? errors : 'none');

  const video = page.video();
  const videoPath = video ? await video.path() : null;
  await context.close();
  await browser.close();

  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(OUT, 'tour_desktop_walkthrough.webm');
    fs.renameSync(videoPath, dest);
    console.log('Video:', dest);
  }
  console.log('Done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
