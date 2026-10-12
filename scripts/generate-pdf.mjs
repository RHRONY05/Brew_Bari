import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  // Log in as admin
  await page.goto('http://localhost:3000/staff/login');
  await page.getByTestId('staff-email-input').fill('admin@brewbari.com');
  await page.getByTestId('staff-password-input').fill('BrewBari#Admin2026!');
  await page.getByTestId('staff-login-button').click();

  await page.waitForURL(/\/staff\/admin/, { timeout: 15000 });

  // Navigate to print page
  await page.goto('http://localhost:3000/staff/admin/tables/print?showTest=1');
  await page.waitForSelector('[data-testid="print-sheet-container"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid^="qr-card-"] img', { timeout: 15000 });
  await page.waitForTimeout(1500); // Wait for QR code canvas rendering

  const outDir = path.resolve(process.cwd(), 'docs/print');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const pdfPath = path.join(outDir, 'table-qr-cards.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });

  console.log(`Saved PDF to ${pdfPath}`);
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
