import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...v] = trimmed.split('=');
        env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return { ...env, ...process.env };
}

async function generatePdfForRestaurant(target = 'grill-ghar') {
  const env = loadEnv();
  const isGrillGhar = target === 'grill-ghar';

  const email = isGrillGhar
    ? (env.TEST_GG_ADMIN_EMAIL || 'admin@grillghar.test')
    : (env.TEST_STAFF_ADMIN_EMAIL || 'admin@brewbari.com');
  const password = isGrillGhar
    ? env.TEST_GG_ADMIN_PASSWORD
    : env.TEST_STAFF_ADMIN_PASSWORD;

  if (!password) {
    console.error(`Error: Password not found in environment for ${target}.`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  console.log(`Generating QR cards PDF for ${target} (${email})...`);

  // Log in as admin
  await page.goto('http://localhost:3000/staff/login');
  await page.getByTestId('staff-email-input').fill(email);
  await page.getByTestId('staff-password-input').fill(password);
  await page.getByTestId('staff-login-button').click();

  await page.waitForURL(/\/staff\/admin/, { timeout: 15000 });

  // Navigate to print page
  await page.goto('http://localhost:3000/staff/admin/tables/print?showTest=1');
  await page.waitForSelector('[data-testid="print-sheet-container"]', { timeout: 15000 });
  await page.waitForSelector('[data-testid^="qr-card-"] img', { timeout: 15000 });
  await page.waitForTimeout(2000); // Wait for QR code canvas rendering

  const outDir = path.resolve(process.cwd(), 'docs/print');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const filename = isGrillGhar ? 'grill-ghar-table-qr-cards.pdf' : 'table-qr-cards.pdf';
  const pdfPath = path.join(outDir, filename);

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
  });

  console.log(`Saved PDF to ${pdfPath}`);
  await browser.close();
}

async function main() {
  const target = process.argv[2] || 'grill-ghar';
  if (target === 'all') {
    await generatePdfForRestaurant('grill-ghar');
    await generatePdfForRestaurant('brew-bari');
  } else {
    await generatePdfForRestaurant(target);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
