// scripts/optimize-menu-images.mjs
// Downloads and optimizes menu & offer images for Grill Ghar using sharp.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const IMAGES = [
  // --- Items (28) ---
  {
    type: 'item',
    key: 'solo-combo',
    file: 'solo-combo.webp',
    name: 'Solo Combo',
    author: 'sk',
    photoUrl: 'https://unsplash.com/photos/hamburger-by-french-fries-on-board-uVPV_nV17Tw',
    imageUrl: 'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=1200&q=80',
    note: 'Burger and french fries on board'
  },
  {
    type: 'item',
    key: 'duo-feast',
    file: 'duo-feast.webp',
    name: 'Duo Feast',
    author: 'Peter Dawn',
    photoUrl: 'https://unsplash.com/photos/hamburgers-and-fries-on-tray-sxZ_Ca6MkWM',
    imageUrl: 'https://images.unsplash.com/photo-1571805618149-3a772570ebcd?auto=format&fit=crop&w=1200&q=80',
    note: 'Two hamburgers and fries on tray'
  },
  {
    type: 'item',
    key: 'family-bucket',
    file: 'family-bucket.webp',
    name: 'Family Bucket',
    author: 'Kevin kevin',
    photoUrl: 'https://unsplash.com/photos/food-lot-on-a-green-leaf-plate-nwmZhwOSVnM',
    imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=1200&q=80',
    note: 'Fried chicken platter feast'
  },
  {
    type: 'item',
    key: 'shawarma-duo',
    file: 'shawarma-duo.webp',
    name: 'Shawarma Duo',
    author: 'Bayuaji Abiyu',
    photoUrl: 'https://unsplash.com/photos/a-cut-in-half-sandwich-sitting-on-top-of-a-cutting-board-xq04aTV-LVk',
    imageUrl: 'https://images.unsplash.com/photo-1719282431723-9d0f4370d4bc?auto=format&fit=crop&w=1200&q=80',
    note: 'Two cut-in-half shawarma wraps on cutting board'
  },
  {
    type: 'item',
    key: 'classic-beef-burger',
    file: 'classic-beef-burger.webp',
    name: 'Classic Beef Burger',
    author: 'amirali mirhashemian',
    photoUrl: 'https://unsplash.com/photos/burger-with-lettuce-and-tomatoes-sc5sTPMrVfk',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    note: 'Classic beef burger with lettuce and tomatoes on sesame bun'
  },
  {
    type: 'item',
    key: 'naga-smash-burger',
    file: 'naga-smash-burger.webp',
    name: 'Naga Smash Burger',
    author: 'Giorgi Iremadze',
    photoUrl: 'https://unsplash.com/photos/burger-with-lettuce-and-tomato-5ZR4DxAG3RQ',
    imageUrl: 'https://images.unsplash.com/photo-1610970878459-a0e464d7592b?auto=format&fit=crop&w=1200&q=80',
    note: 'Spicy burger with dripping red naga sauce and melted cheese'
  },
  {
    type: 'item',
    key: 'crispy-chicken-burger',
    file: 'crispy-chicken-burger.webp',
    name: 'Crispy Chicken Burger',
    author: 'Eiliv Aceron',
    photoUrl: 'https://unsplash.com/photos/burger-on-white-and-red-paper-5nvt9BrLaAc',
    imageUrl: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=1200&q=80',
    note: 'Crispy fried chicken fillet burger on paper'
  },
  {
    type: 'item',
    key: 'double-smash',
    file: 'double-smash.webp',
    name: 'Double Smash',
    author: 'Eiliv Aceron',
    photoUrl: 'https://unsplash.com/photos/double-cheeseburger-with-pickles-pu6b4yIlQF4',
    imageUrl: 'https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=1200&q=80',
    note: 'Double patty smash cheeseburger with pickles'
  },
  {
    type: 'item',
    key: 'mushroom-swiss-burger',
    file: 'mushroom-swiss-burger.webp',
    name: 'Mushroom Swiss Burger',
    author: 'amirali mirhashemian',
    photoUrl: 'https://unsplash.com/photos/hamburger-on-white-surface-JqnuWlHmDfE',
    imageUrl: 'https://images.unsplash.com/photo-1549611016-3a70d82b5040?auto=format&fit=crop&w=1200&q=80',
    note: 'Gourmet burger with sautéed mushrooms and melted cheese'
  },
  {
    type: 'item',
    key: 'bbq-beef-burger',
    file: 'bbq-beef-burger.webp',
    name: 'BBQ Beef Burger',
    author: 'amirali mirhashemian',
    photoUrl: 'https://unsplash.com/photos/a-hamburger-sitting-on-top-of-a-wooden-cutting-board-MNHQqLNEvow',
    imageUrl: 'https://images.unsplash.com/photo-1713330801172-03f8d1c0dde7?auto=format&fit=crop&w=1200&q=80',
    note: 'Glazed beef burger with melted cheese and savory sauce on wooden board'
  },
  {
    type: 'item',
    key: 'crispy-chicken-2pc',
    file: 'crispy-chicken-2pc.webp',
    name: 'Crispy Chicken · 2 pc',
    author: 'Nizar Zulmi',
    photoUrl: 'https://unsplash.com/photos/a-white-plate-topped-with-fried-food-on-top-of-a-wooden-table-UgckYUoc0tM',
    imageUrl: 'https://images.unsplash.com/photo-1586793783658-261cddf883ef?auto=format&fit=crop&w=1200&q=80',
    note: 'Fresh golden fried chicken pieces on plate'
  },
  {
    type: 'item',
    key: 'hot-wings-6pc',
    file: 'hot-wings-6pc.webp',
    name: 'Hot Wings · 6 pc',
    author: 'Chad Montano',
    photoUrl: 'https://unsplash.com/photos/buffalo-chicken-wings-appetizer-gE28aTnlqJA',
    imageUrl: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=1200&q=80',
    note: 'Thai chili buffalo hot wings with dip'
  },
  {
    type: 'item',
    key: 'chicken-strips-5pc',
    file: 'chicken-strips-5pc.webp',
    name: 'Chicken Strips · 5 pc',
    author: 'logan jeffrey',
    photoUrl: 'https://unsplash.com/photos/fried-chicken-on-white-ceramic-plate-Dr3vO9qZs6Y',
    imageUrl: 'https://images.unsplash.com/photo-1605291581926-df4bf7ee3e89?auto=format&fit=crop&w=1200&q=80',
    note: 'Crispy golden fried chicken tenders'
  },
  {
    type: 'item',
    key: 'popcorn-chicken',
    file: 'popcorn-chicken.webp',
    name: 'Popcorn Chicken',
    author: 'Abdul Raheem Kannath',
    photoUrl: 'https://unsplash.com/photos/small-pieces-of-fried-chicken-in-a-box-XCcriaXKKPo',
    imageUrl: 'https://images.unsplash.com/photo-1767469576675-0c02a8d66f4c?auto=format&fit=crop&w=1200&q=80',
    note: 'Bite-sized crispy fried chicken bites'
  },
  {
    type: 'item',
    key: 'chicken-bucket-8pc',
    file: 'chicken-bucket-8pc.webp',
    name: 'Chicken Bucket · 8 pc',
    author: 'Erik Mclean',
    photoUrl: 'https://unsplash.com/photos/fried-chicken-on-white-ceramic-plate-UBtRdqWUbzc',
    imageUrl: 'https://images.unsplash.com/photo-1585703900468-13c7a978ad86?auto=format&fit=crop&w=1200&q=80',
    note: 'Generous plate of golden fried chicken pieces'
  },
  {
    type: 'item',
    key: 'chicken-shawarma',
    file: 'chicken-shawarma.webp',
    name: 'Chicken Shawarma',
    author: 'Bayuaji Abiyu',
    photoUrl: 'https://unsplash.com/photos/a-burrito-with-meat-and-vegetables-on-a-cutting-board-_JIRNUeDGy8',
    imageUrl: 'https://images.unsplash.com/photo-1719282431565-3b30bb7d2658?auto=format&fit=crop&w=1200&q=80',
    note: 'Chicken shawarma wrap with roasted chicken and garlic sauce'
  },
  {
    type: 'item',
    key: 'beef-shawarma',
    file: 'beef-shawarma.webp',
    name: 'Beef Shawarma',
    author: 'Alexander Mils',
    photoUrl: 'https://unsplash.com/photos/beef-shawarma-SNLfVYmL8os',
    imageUrl: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=1200&q=80',
    note: 'Traditional beef gyro / shawarma wrap with meat and vegetables'
  },
  {
    type: 'item',
    key: 'naga-shawarma',
    file: 'naga-shawarma.webp',
    name: 'Naga Shawarma',
    author: 'Anima Visual',
    photoUrl: 'https://unsplash.com/photos/a-close-up-of-a-sandwich-on-a-plate-jhTzMj5aJQk',
    imageUrl: 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?auto=format&fit=crop&w=1200&q=80',
    note: 'Spicy seasoned meat wrap with naga chili flavor'
  },
  {
    type: 'item',
    key: 'shawarma-platter',
    file: 'shawarma-platter.webp',
    name: 'Shawarma Platter',
    author: 'Markus Winkler',
    photoUrl: 'https://unsplash.com/photos/grilled-meat-skewers-with-fries-WHtVB-RiW2I',
    imageUrl: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=1200&q=80',
    note: 'Grilled meat platter with fries, onions, and pita bread'
  },
  {
    type: 'item',
    key: 'regular-fries',
    file: 'regular-fries.webp',
    name: 'Regular Fries',
    author: 'Mitchell Luo',
    photoUrl: 'https://unsplash.com/photos/a-basket-of-french-fries-sitting-on-top-of-a-wooden-table-ChXHveqrb28',
    imageUrl: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1200&q=80',
    note: 'Basket of golden salted french fries on wooden table'
  },
  {
    type: 'item',
    key: 'masala-fries',
    file: 'masala-fries.webp',
    name: 'Masala Fries',
    author: 'Pixzolo Photography',
    photoUrl: 'https://unsplash.com/photos/fries-and-ketchup-8YBHgP0WrEo',
    imageUrl: 'https://images.unsplash.com/photo-1518013431117-eb1465fa5752?auto=format&fit=crop&w=1200&q=80',
    note: 'French fries tossed in red savory masala seasoning'
  },
  {
    type: 'item',
    key: 'loaded-cheese-fries',
    file: 'loaded-cheese-fries.webp',
    name: 'Loaded Cheese Fries',
    author: 'matthew reyes',
    photoUrl: 'https://unsplash.com/photos/cooked-fries-5I5aqYJrdso',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=1200&q=80',
    note: 'Crispy fries smothered in melted golden cheddar cheese sauce'
  },
  {
    type: 'item',
    key: 'onion-rings',
    file: 'onion-rings.webp',
    name: 'Onion Rings',
    author: 'Esperanza Doronila',
    photoUrl: 'https://unsplash.com/photos/a-pile-of-fried-onion-rings-sitting-on-top-of-a-newspaper-4FO9vox0T7M',
    imageUrl: 'https://images.unsplash.com/photo-1639024471283-03518883512d?auto=format&fit=crop&w=1200&q=80',
    note: 'Crispy golden fried battered onion rings'
  },
  {
    type: 'item',
    key: 'cookies-and-cream-shake',
    file: 'cookies-and-cream-shake.webp',
    name: 'Cookies & Cream Shake',
    author: 'ABHISHEK HAJARE',
    photoUrl: 'https://unsplash.com/photos/a-glass-of-ice-cream-with-a-cookie-on-top-pYmOaWZAPqI',
    imageUrl: 'https://images.unsplash.com/photo-1641665271888-575e46923776?auto=format&fit=crop&w=1200&q=80',
    note: 'Creamy milkshake topped with crushed cookies in a glass'
  },
  {
    type: 'item',
    key: 'chocolate-shake',
    file: 'chocolate-shake.webp',
    name: 'Chocolate Shake',
    author: "César O'neill",
    photoUrl: 'https://unsplash.com/photos/a-chocolate-milkshake-with-syrup-drizzle-and-a-black-straw-CRPPrOJPu_Q',
    imageUrl: 'https://images.unsplash.com/photo-1786052598262-9c649b0d825f?auto=format&fit=crop&w=1200&q=80',
    note: 'Rich chocolate milkshake with syrup drizzle and straw'
  },
  {
    type: 'item',
    key: 'mango-lassi',
    file: 'mango-lassi.webp',
    name: 'Mango Lassi',
    author: 'Julia Zyablova',
    photoUrl: 'https://unsplash.com/photos/a-glass-filled-with-a-smoothie-next-to-a-mango-KlVIYmGVRQ8',
    imageUrl: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?auto=format&fit=crop&w=1200&q=80',
    note: 'Fresh yellow mango lassi drink next to mango fruit'
  },
  {
    type: 'item',
    key: 'soft-drink',
    file: 'soft-drink.webp',
    name: 'Soft Drink · 250 ml',
    author: 'Qasim Malick',
    photoUrl: 'https://unsplash.com/photos/clear-drinking-glass-with-ice-and-black-liquid-i597Mg_WSPw',
    imageUrl: 'https://images.unsplash.com/photo-1629654613528-5d0a2e4166de?auto=format&fit=crop&w=1200&q=80',
    note: 'Chilled fizzy cola soft drink in a glass with ice cubes'
  },
  {
    type: 'item',
    key: 'mineral-water',
    file: 'mineral-water.webp',
    name: 'Mineral Water',
    author: 'KOBU Agency',
    photoUrl: 'https://unsplash.com/photos/clear-drinking-glass-on-gray-surface-TWIRIAizZFU',
    imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=1200&q=80',
    note: 'Pure clear mineral water in glass'
  },

  // --- Offers (3) ---
  {
    type: 'offer',
    key: 'offer-solo-combo',
    file: 'offer-solo-combo.webp',
    name: 'Solo Combo (Hero)',
    author: 'Mae Mu',
    photoUrl: 'https://unsplash.com/photos/burger-with-vegetable-on-brown-wooden-tray-I7A_pHLcQK8',
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    note: 'Hero presentation of juicy burger and french fries'
  },
  {
    type: 'offer',
    key: 'offer-family-bucket',
    file: 'offer-family-bucket.webp',
    name: 'Family Bucket Night (Hero)',
    author: 'Erik Mclean',
    photoUrl: 'https://unsplash.com/photos/fried-chicken-on-white-ceramic-plate-UBtRdqWUbzc',
    imageUrl: 'https://images.unsplash.com/photo-1585703900468-13c7a978ad86?auto=format&fit=crop&w=1200&q=80',
    note: 'Hero platter of crispy golden fried chicken'
  },
  {
    type: 'offer',
    key: 'offer-duo-feast',
    file: 'offer-duo-feast.webp',
    name: "Two's Company / Duo Feast (Hero)",
    author: 'Jonathan Borba',
    photoUrl: 'https://unsplash.com/photos/burger-with-fries-8l8Yl2ruUsg',
    imageUrl: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=1200&q=80',
    note: 'Hero shot of double burger meal with french fries'
  }
];

async function main() {
  const cacheDir = path.resolve('.cache/images');
  const menuDir = path.resolve('public/images/menu/grill-ghar');
  const offersDir = path.resolve('public/images/offers/grill-ghar');

  await fs.mkdir(cacheDir, { recursive: true });
  await fs.mkdir(menuDir, { recursive: true });
  await fs.mkdir(offersDir, { recursive: true });

  console.log(`Starting processing for ${IMAGES.length} images...`);

  for (const item of IMAGES) {
    const cacheFile = path.join(cacheDir, `${item.key}.jpg`);
    const outDir = item.type === 'offer' ? offersDir : menuDir;
    const outFile = path.join(outDir, item.file);

    // 1. Download if not cached
    try {
      await fs.access(cacheFile);
      console.log(`[Cached] ${item.name}`);
    } catch {
      console.log(`[Downloading] ${item.name} from ${item.imageUrl}...`);
      const res = await fetch(item.imageUrl);
      if (!res.ok) {
        throw new Error(`Failed to download ${item.name}: ${res.status} ${res.statusText}`);
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(cacheFile, buffer);
    }

    // 2. Optimize with sharp
    if (item.type === 'offer') {
      // 800x800 WebP, quality 80
      await sharp(cacheFile)
        .resize(800, 800, { fit: 'cover', position: 'center' })
        .webp({ quality: 80 })
        .toFile(outFile);
    } else {
      // 500x500 WebP, quality 82, target <= 40KB
      let quality = 82;
      let buf = await sharp(cacheFile)
        .resize(500, 500, { fit: 'cover', position: 'center' })
        .webp({ quality })
        .toBuffer();

      // If > 40KB, reduce quality slightly
      if (buf.length > 40 * 1024) {
        quality = 75;
        buf = await sharp(cacheFile)
          .resize(500, 500, { fit: 'cover', position: 'center' })
          .webp({ quality })
          .toBuffer();
      }
      await fs.writeFile(outFile, buf);
    }

    const stat = await fs.stat(outFile);
    console.log(`[Optimized] ${item.file} (${Math.round(stat.size / 1024)} KB)`);
  }

  console.log('All images downloaded and optimized successfully!');
}

main().catch(err => {
  console.error('Fatal error in optimize-menu-images:', err);
  process.exit(1);
});
