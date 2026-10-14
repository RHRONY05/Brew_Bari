-- supabase/seed-grill-ghar.sql
-- Grill Ghar demo seed data (03-DATA.md §3)
-- Idempotent script for Restaurant #2 (fast-food, Chattogram, P3 locked)

-- 1. Restaurant
insert into public.restaurants (
  slug, theme_key, name_en, name_bn, tagline_en, tagline_bn,
  package, package_locked, is_listed,
  vat_percent, service_charge_percent, require_session_approval,
  address, opening_hours_en, opening_hours_bn,
  wifi_name, wifi_password,
  phone, facebook_url, instagram_url, google_maps_url, google_review_url, logo_url
)
values (
  'grill-ghar', 'grill-ghar', 'Grill Ghar', 'গ্রিল ঘর',
  'Grilled hot, served fast', 'গরম গরম গ্রিল, ঝটপট পরিবেশন',
  3, true, true,
  5, 0, true,
  'Agrabad Access Road, Chattogram (fictional demo address)',
  'Every day 12 pm – 11 pm', 'প্রতিদিন দুপুর ১২টা – রাত ১১টা',
  'GrillGhar_Guest', 'grillghar2026',
  null, null, null, null, null, null
)
on conflict (slug) do update set
  theme_key = excluded.theme_key,
  name_en = excluded.name_en,
  name_bn = excluded.name_bn,
  tagline_en = excluded.tagline_en,
  tagline_bn = excluded.tagline_bn,
  package = excluded.package,
  package_locked = excluded.package_locked,
  is_listed = excluded.is_listed,
  vat_percent = excluded.vat_percent,
  service_charge_percent = excluded.service_charge_percent,
  require_session_approval = excluded.require_session_approval,
  address = excluded.address,
  opening_hours_en = excluded.opening_hours_en,
  opening_hours_bn = excluded.opening_hours_bn,
  wifi_name = excluded.wifi_name,
  wifi_password = excluded.wifi_password;

-- 2. Categories
insert into public.categories (restaurant_id, name_en, name_bn, icon, sort_order)
select r.id, v.name_en, v.name_bn, v.icon, v.sort_order
from public.restaurants r,
(values
  ('Set meals',         'সেট মিল',            'meal',     1),
  ('Burgers',           'বার্গার',             'burger',   2),
  ('Fried chicken',     'ফ্রাইড চিকেন',        'chicken',  3),
  ('Shawarma & wraps',  'শাওয়ারমা ও র‍্যাপ',     'shawarma', 4),
  ('Fries & sides',     'ফ্রাইজ ও সাইড',       'fries',    5),
  ('Shakes & drinks',   'শেক ও ড্রিংকস',       'shake',    6)
) as v(name_en, name_bn, icon, sort_order)
where r.slug = 'grill-ghar'
on conflict do nothing;

-- 3. Menu items (28 items)
with r as (select id from public.restaurants where slug = 'grill-ghar'),
c as (select id, name_en from public.categories where restaurant_id = (select id from r)),
o(set_name, opts) as (values
  ('solo_combo', '[
    {"id":"burger","name_en":"Choose burger","name_bn":"বার্গার নির্বাচন করুন","type":"single","required":true,"display":"list","choices":[
      {"id":"beef","name_en":"Classic Beef","name_bn":"ক্লাসিক বিফ","price_delta":0},
      {"id":"chicken","name_en":"Crispy Chicken","name_bn":"ক্রিস্পি চিকেন","price_delta":0},
      {"id":"naga","name_en":"Naga Smash","name_bn":"নাগা স্ম্যাশ","price_delta":40}]},
    {"id":"drink","name_en":"Choose your drink","name_bn":"আপনার ড্রিংক নির্বাচন করুন","type":"single","required":true,"display":"list","choices":[
      {"id":"cola","name_en":"Cola","name_bn":"কোলা","price_delta":0},
      {"id":"lemon","name_en":"Lemon-lime soda","name_bn":"লেমন-লাইম সোডা","price_delta":0},
      {"id":"orange","name_en":"Orange soda","name_bn":"অরেঞ্জ সোডা","price_delta":0},
      {"id":"lassi","name_en":"Mango lassi","name_bn":"ম্যাংগো লাচ্ছি","price_delta":30},
      {"id":"water","name_en":"Mineral water","name_bn":"মিনারেল ওয়াটার","price_delta":0}]}]'::jsonb),

  ('burger_meal', '[
    {"id":"meal","name_en":"Make it a meal?","name_bn":"মিল করবেন?","type":"single","required":true,"display":"cards","choices":[
      {"id":"solo","name_en":"Just the burger","name_bn":"শুধু বার্গার","description_en":"No sides","description_bn":"সাইড ছাড়া","price_delta":0},
      {"id":"meal","name_en":"Meal","name_bn":"মিল","description_en":"Fries + drink","description_bn":"ফ্রাইজ + ড্রিংক","price_delta":150,"compare_delta":200}]},
    {"id":"drink","name_en":"Your meal drink","name_bn":"মিলের ড্রিংক","type":"single","required":true,"display":"list","show_if":{"group":"meal","choice":"meal"},"choices":[
      {"id":"cola","name_en":"Cola","name_bn":"কোলা","price_delta":0},
      {"id":"lemon","name_en":"Lemon-lime soda","name_bn":"লেমন-লাইম সোডা","price_delta":0},
      {"id":"orange","name_en":"Orange soda","name_bn":"অরেঞ্জ সোডা","price_delta":0},
      {"id":"lassi","name_en":"Mango lassi","name_bn":"ম্যাংগো লাচ্ছি","price_delta":30},
      {"id":"water","name_en":"Mineral water","name_bn":"মিনারেল ওয়াটার","price_delta":0}]},
    {"id":"extras","name_en":"Add extra","name_bn":"এক্সট্রা যোগ করুন","type":"multi","required":false,"choices":[
      {"id":"cheese","name_en":"Extra cheese","name_bn":"এক্সট্রা চিজ","price_delta":40},
      {"id":"patty","name_en":"Extra patty","name_bn":"এক্সট্রা প্যাটি","price_delta":120},
      {"id":"jalapeno","name_en":"Jalapeños","name_bn":"হালপেনিয়ো","price_delta":30},
      {"id":"egg","name_en":"Fried egg","name_bn":"ফ্রাইড এগ","price_delta":30}]}]'::jsonb),

  ('burger_meal_spice', '[
    {"id":"meal","name_en":"Make it a meal?","name_bn":"মিল করবেন?","type":"single","required":true,"display":"cards","choices":[
      {"id":"solo","name_en":"Just the burger","name_bn":"শুধু বার্গার","description_en":"No sides","description_bn":"সাইড ছাড়া","price_delta":0},
      {"id":"meal","name_en":"Meal","name_bn":"মিল","description_en":"Fries + drink","description_bn":"ফ্রাইজ + ড্রিংক","price_delta":150,"compare_delta":200}]},
    {"id":"drink","name_en":"Your meal drink","name_bn":"মিলের ড্রিংক","type":"single","required":true,"display":"list","show_if":{"group":"meal","choice":"meal"},"choices":[
      {"id":"cola","name_en":"Cola","name_bn":"কোলা","price_delta":0},
      {"id":"lemon","name_en":"Lemon-lime soda","name_bn":"লেমন-লাইম সোডা","price_delta":0},
      {"id":"orange","name_en":"Orange soda","name_bn":"অরেঞ্জ সোডা","price_delta":0},
      {"id":"lassi","name_en":"Mango lassi","name_bn":"ম্যাংগো লাচ্ছি","price_delta":30},
      {"id":"water","name_en":"Mineral water","name_bn":"মিনারেল ওয়াটার","price_delta":0}]},
    {"id":"spice","name_en":"Spice level","name_bn":"ঝাল","type":"single","required":true,"display":"chips","choices":[
      {"id":"mild","name_en":"Mild","name_bn":"মাইল্ড","heat":1,"price_delta":0},
      {"id":"medium","name_en":"Medium","name_bn":"মিডিয়াম","heat":2,"price_delta":0},
      {"id":"hot","name_en":"Hot","name_bn":"হট","heat":3,"price_delta":0},
      {"id":"naga","name_en":"Naga","name_bn":"নাগা","heat":4,"price_delta":0}]},
    {"id":"extras","name_en":"Add extra","name_bn":"এক্সট্রা যোগ করুন","type":"multi","required":false,"choices":[
      {"id":"cheese","name_en":"Extra cheese","name_bn":"এক্সট্রা চিজ","price_delta":40},
      {"id":"patty","name_en":"Extra patty","name_bn":"এক্সট্রা প্যাটি","price_delta":120},
      {"id":"jalapeno","name_en":"Jalapeños","name_bn":"হালপেনিয়ো","price_delta":30},
      {"id":"egg","name_en":"Fried egg","name_bn":"ফ্রাইড এগ","price_delta":30}]}]'::jsonb),

  ('chicken_meal', '[
    {"id":"meal","name_en":"Make it a meal?","name_bn":"মিল করবেন?","type":"single","required":true,"display":"cards","choices":[
      {"id":"solo","name_en":"Just the item","name_bn":"শুধু আইটেম","description_en":"No sides","description_bn":"সাইড ছাড়া","price_delta":0},
      {"id":"meal","name_en":"Meal","name_bn":"মিল","description_en":"Fries + drink","description_bn":"ফ্রাইজ + ড্রিংক","price_delta":130,"compare_delta":180}]},
    {"id":"drink","name_en":"Your meal drink","name_bn":"মিলের ড্রিংক","type":"single","required":true,"display":"list","show_if":{"group":"meal","choice":"meal"},"choices":[
      {"id":"cola","name_en":"Cola","name_bn":"কোলা","price_delta":0},
      {"id":"lemon","name_en":"Lemon-lime soda","name_bn":"লেমন-লাইম সোডা","price_delta":0},
      {"id":"orange","name_en":"Orange soda","name_bn":"অরেঞ্জ সোডা","price_delta":0},
      {"id":"lassi","name_en":"Mango lassi","name_bn":"ম্যাংগো লাচ্ছি","price_delta":30},
      {"id":"water","name_en":"Mineral water","name_bn":"মিনারেল ওয়াটার","price_delta":0}]},
    {"id":"spice","name_en":"Spice level","name_bn":"ঝাল","type":"single","required":true,"display":"chips","choices":[
      {"id":"mild","name_en":"Mild","name_bn":"মাইল্ড","heat":1,"price_delta":0},
      {"id":"medium","name_en":"Medium","name_bn":"মিডিয়াম","heat":2,"price_delta":0},
      {"id":"hot","name_en":"Hot","name_bn":"হট","heat":3,"price_delta":0},
      {"id":"naga","name_en":"Naga","name_bn":"নাগা","heat":4,"price_delta":0}]}]'::jsonb),

  ('spice_only', '[
    {"id":"spice","name_en":"Spice level","name_bn":"ঝাল","type":"single","required":true,"display":"chips","choices":[
      {"id":"mild","name_en":"Mild","name_bn":"মাইল্ড","heat":1,"price_delta":0},
      {"id":"medium","name_en":"Medium","name_bn":"মিডিয়াম","heat":2,"price_delta":0},
      {"id":"hot","name_en":"Hot","name_bn":"হট","heat":3,"price_delta":0},
      {"id":"naga","name_en":"Naga","name_bn":"নাগা","heat":4,"price_delta":0}]}]'::jsonb),

  ('dip_only', '[
    {"id":"dip","name_en":"Dip","name_bn":"ডিপ","type":"single","required":true,"display":"list","choices":[
      {"id":"garlic","name_en":"Garlic mayo","name_bn":"গার্লিক মেয়ো","price_delta":0},
      {"id":"bbq","name_en":"BBQ","name_bn":"বারবিকিউ","price_delta":0},
      {"id":"naga","name_en":"Naga mayo","name_bn":"নাগা মেয়ো","price_delta":20}]}]'::jsonb),

  ('flavour_only', '[
    {"id":"flavour","name_en":"Flavour","name_bn":"ফ্লেভার","type":"single","required":true,"display":"list","choices":[
      {"id":"cola","name_en":"Cola","name_bn":"কোলা","price_delta":0},
      {"id":"lemon","name_en":"Lemon-lime","name_bn":"লেমন-লাইম","price_delta":0},
      {"id":"orange","name_en":"Orange","name_bn":"অরেঞ্জ","price_delta":0}]}]'::jsonb),

  ('none', '[]'::jsonb)
)
insert into public.menu_items (
  restaurant_id, category_id, name_en, name_bn, description_en, description_bn,
  price, compare_at_price, prep_minutes, spice_level, tags, options, image_url, sort_order
)
select (select id from r), c.id, v.name_en, v.name_bn, v.desc_en, v.desc_bn,
       v.price, v.compare_at, v.prep_min, v.spice, v.tags::text[], o.opts, v.img, v.sort_order
from (values
  -- Set meals
  ('Set meals', 'Solo Combo', 'সোলো কম্বো',
   'Choice of burger, regular fries and a chilled drink.', 'পছন্দের বার্গার, রেগুলার ফ্রাইজ আর সাথে ঠান্ডা ড্রিংক।',
   390, 470, 12::smallint, 1::smallint, '{bestseller}', 'solo_combo', '/images/menu/grill-ghar/solo-combo.webp', 1),

  ('Set meals', 'Duo Feast', 'ডুও ফিস্ট',
   'Two burgers, two regular fries and two chilled drinks.', 'দুটি বার্গার, দুটি ফ্রাইজ আর সাথে দুটি ঠান্ডা ড্রিংক।',
   750, 890, 15::smallint, 1::smallint, '{}', 'spice_only', '/images/menu/grill-ghar/duo-feast.webp', 2),

  ('Set meals', 'Family Bucket', 'ফ্যামিলি বাকেট',
   '8 pc crispy fried chicken, two large fries and drinks.', '৮ পিস ক্রিস্পি চিকেন, দুটি বড় ফ্রাইজ আর ড্রিংকস।',
   1290, 1550, 18::smallint, 1::smallint, '{}', 'spice_only', '/images/menu/grill-ghar/family-bucket.webp', 3),

  ('Set meals', 'Shawarma Duo', 'শাওয়ারমা ডুও',
   'Two chicken shawarma wraps served with garlic dip.', 'দুটি চিকেন শাওয়ারমা র‍্যাপ সাথে গার্লিক সস।',
   420, 500, 10::smallint, 1::smallint, '{new}', 'spice_only', '/images/menu/grill-ghar/shawarma-duo.webp', 4),

  -- Burgers
  ('Burgers', 'Classic Beef Burger', 'ক্লাসিক বিফ বার্গার',
   'Juicy smashed beef patty, cheddar, lettuce and tomato.', 'রসালো স্ম্যাশড বিফ প্যাটি, চেডার চিজ, লেটুস ও টমেটো।',
   280, null, 10::smallint, 0::smallint, '{bestseller}', 'burger_meal', '/images/menu/grill-ghar/classic-beef-burger.webp', 1),

  ('Burgers', 'Naga Smash Burger', 'নাগা স্ম্যাশ বার্গার',
   'Crispy beef patty dripping in fiery naga chili sauce.', 'ঝাল নাগা সসে মাখানো ক্রিস্পি বিফ স্ম্যাশ বার্গার।',
   320, null, 12::smallint, 4::smallint, '{new}', 'burger_meal_spice', '/images/menu/grill-ghar/naga-smash-burger.webp', 2),

  ('Burgers', 'Crispy Chicken Burger', 'ক্রিস্পি চিকেন বার্গার',
   'Golden fried chicken fillet, crunchy slaw and house mayo.', 'মচমচে ফ্রাইড চিকেন ফিলে, ক্রাঞ্চি স্লা আর স্পেশাল মেয়ো।',
   260, null, 9::smallint, 2::smallint, '{}', 'burger_meal_spice', '/images/menu/grill-ghar/crispy-chicken-burger.webp', 3),

  ('Burgers', 'Double Smash', 'ডাবল স্ম্যাশ',
   'Two beef patties, double melted cheese and pickles.', 'দুটি স্ম্যাশড বিফ প্যাটি, ডাবল গলানো চিজ আর পিকল।',
   420, null, 14::smallint, 1::smallint, '{}', 'burger_meal', '/images/menu/grill-ghar/double-smash.webp', 4),

  ('Burgers', 'Mushroom Swiss Burger', 'মাশরুম সুইস বার্গার',
   'Grilled beef patty with sautéed mushrooms and swiss cheese.', 'সতে করা মাশরুম আর সুইস চিজ সহ গ্রিলড বিফ বার্গার।',
   340, null, 12::smallint, 0::smallint, '{}', 'burger_meal', '/images/menu/grill-ghar/mushroom-swiss-burger.webp', 5),

  ('Burgers', 'BBQ Beef Burger', 'বারবিকিউ বিফ বার্গার',
   'Smoky BBQ glazed beef patty with caramelized onions.', 'স্মোকি বারবিকিউ সসে গ্লেজ করা বিফ প্যাটি ও ক্যারামেল অনিয়ন।',
   360, null, 12::smallint, 1::smallint, '{}', 'burger_meal', '/images/menu/grill-ghar/bbq-beef-burger.webp', 6),

  -- Fried chicken
  ('Fried chicken', 'Crispy Chicken · 2 pc', 'ক্রিস্পি চিকেন · ২ পিস',
   'Two golden, crispy fried chicken pieces with crunch.', 'দুই পিস সোনালী, মুচমুচে ক্রিস্পি ফ্রাইড চিকেন।',
   240, null, 8::smallint, 1::smallint, '{bestseller}', 'chicken_meal', '/images/menu/grill-ghar/crispy-chicken-2pc.webp', 1),

  ('Fried chicken', 'Hot Wings · 6 pc', 'হট উইংস · ৬ পিস',
   'Six spicy glazed chicken wings with house dip.', 'ঝাল সসে গ্লেজ করা ছয় পিস হট উইংস সাথে ডিপ।',
   300, null, 6::smallint, 3::smallint, '{}', 'dip_only', '/images/menu/grill-ghar/hot-wings-6pc.webp', 2),

  ('Fried chicken', 'Chicken Strips · 5 pc', 'চিকেন স্ট্রিপস · ৫ পিস',
   'Five tender boneless chicken strips fried golden.', 'পাঁচ পিস নরম বোনলেস চিকেন স্ট্রিপস মুচমুচে করে ভাজা।',
   280, null, 7::smallint, 1::smallint, '{}', 'dip_only', '/images/menu/grill-ghar/chicken-strips-5pc.webp', 3),

  ('Fried chicken', 'Popcorn Chicken', 'পপকর্ন চিকেন',
   'Bite-sized seasoned chicken bites with dipping sauce.', 'ছোট ছোট টুকরো ক্রিস্পি চিকেন বাইটস সাথে সস।',
   220, null, 5::smallint, 2::smallint, '{}', 'dip_only', '/images/menu/grill-ghar/popcorn-chicken.webp', 4),

  ('Fried chicken', 'Chicken Bucket · 8 pc', 'চিকেন বাকেট · ৮ পিস',
   'Eight pieces of our signature crispy fried chicken.', 'আমাদের স্পেশাল ক্রিস্পি ফ্রাইড চিকেনের আট পিস বাকেট।',
   950, null, 12::smallint, 1::smallint, '{}', 'spice_only', '/images/menu/grill-ghar/chicken-bucket-8pc.webp', 5),

  -- Shawarma & wraps
  ('Shawarma & wraps', 'Chicken Shawarma', 'চিকেন শাওয়ারমা',
   'Spiced roasted chicken wrapped with garlic mayo in pita.', 'রুটিতে মোড়ানো স্পাইসি রোস্টেড চিকেন আর গার্লিক সস।',
   180, null, 6::smallint, 1::smallint, '{bestseller}', 'spice_only', '/images/menu/grill-ghar/chicken-shawarma.webp', 1),

  ('Shawarma & wraps', 'Beef Shawarma', 'বিফ শাওয়ারমা',
   'Tender sliced beef with tahini and fresh onions in wrap.', 'তাহিনি সস ও পেঁয়াজ সহ নরম বিফ শাওয়ারমা র‍্যাপ।',
   220, null, 7::smallint, 2::smallint, '{}', 'spice_only', '/images/menu/grill-ghar/beef-shawarma.webp', 2),

  ('Shawarma & wraps', 'Naga Shawarma', 'নাগা শাওয়ারমা',
   'Fiery naga spiced chicken shawarma for spice lovers.', 'ঝালপ্রেমীদের জন্য আগুন ঝাল নাগা চিকেন শাওয়ারমা।',
   200, null, 6::smallint, 4::smallint, '{new}', 'none', '/images/menu/grill-ghar/naga-shawarma.webp', 3),

  ('Shawarma & wraps', 'Shawarma Platter', 'শাওয়ারমা প্ল্যাটার',
   'Sliced shawarma meat, warm pita, french fries and dips.', 'শাওয়ারমা মাংস, গরম রুটি, ফ্রাইজ ও ডিপের প্ল্যাটার।',
   320, null, 10::smallint, 1::smallint, '{}', 'spice_only', '/images/menu/grill-ghar/shawarma-platter.webp', 4),

  -- Fries & sides
  ('Fries & sides', 'Regular Fries', 'রেগুলার ফ্রাইজ',
   'Crispy golden salted potato fries.', 'মুচমুচে সোনালী ক্লাসিক সল্টেড আলুর ফ্রাইজ।',
   120, null, 4::smallint, 0::smallint, '{pairs-well}', 'none', '/images/menu/grill-ghar/regular-fries.webp', 1),

  ('Fries & sides', 'Masala Fries', 'মসলা ফ্রাইজ',
   'French fries tossed in our spicy house masala blend.', 'আমাদের নিজস্ব মশলা ব্লেন্ডে মাখানো ক্রিস্পি ফ্রাইজ।',
   150, null, 4::smallint, 2::smallint, '{pairs-well}', 'none', '/images/menu/grill-ghar/masala-fries.webp', 2),

  ('Fries & sides', 'Loaded Cheese Fries', 'লোডেড চিজ ফ্রাইজ',
   'Hot fries smothered in melted cheddar cheese sauce.', 'গরম ফ্রাইজের ওপর গলানো চিজি চেডার সসের পরত।',
   220, null, 6::smallint, 0::smallint, '{}', 'none', '/images/menu/grill-ghar/loaded-cheese-fries.webp', 3),

  ('Fries & sides', 'Onion Rings', 'অনিয়ন রিংস',
   'Crispy golden battered onion rings.', 'ব্যাটারড মুচমুচে সোনালী ভাজা অনিয়ন রিংস।',
   160, null, 5::smallint, 0::smallint, '{pairs-well}', 'none', '/images/menu/grill-ghar/onion-rings.webp', 4),

  -- Shakes & drinks
  ('Shakes & drinks', 'Cookies & Cream Shake', 'কুকিজ অ্যান্ড ক্রিম শেক',
   'Thick vanilla milkshake blended with chocolate cookies.', 'চকোলেট কুকিজ মেশানো ঘন ক্রিমি ভ্যানিলা শেক।',
   220, null, 4::smallint, null, '{pairs-well}', 'none', '/images/menu/grill-ghar/cookies-and-cream-shake.webp', 1),

  ('Shakes & drinks', 'Chocolate Shake', 'চকলেট শেক',
   'Rich creamy chocolate shake with chocolate drizzle.', 'চকলেট ড্রিজল সহ ঘন চকলেটি আইসক্রিম শেক।',
   200, null, 4::smallint, null, '{}', 'none', '/images/menu/grill-ghar/chocolate-shake.webp', 2),

  ('Shakes & drinks', 'Mango Lassi', 'ম্যাংগো লাচ্ছি',
   'Sweet chilled yogurt drink with rich mango pulp.', 'মিষ্টি দই ও পাকা আমের পাল্প দিয়ে তৈরি ঠান্ডা লাচ্ছি।',
   150, null, 3::smallint, null, '{pairs-well}', 'none', '/images/menu/grill-ghar/mango-lassi.webp', 3),

  ('Shakes & drinks', 'Soft Drink · 250 ml', 'সফট ড্রিংক · ২৫০ মি.লি.',
   'Chilled carbonated soft drink served over ice.', 'বরফ ঠান্ডা রিফ্রেশিং কার্বনেটেড সফট ড্রিংক।',
   80, null, 1::smallint, null, '{}', 'flavour_only', '/images/menu/grill-ghar/soft-drink.webp', 4),

  ('Shakes & drinks', 'Mineral Water', 'মিনারেল ওয়াটার',
   'Pure bottled mineral drinking water.', 'বিশুদ্ধ বোতলজাত মিনারেল খাবার পানি।',
   30, null, 1::smallint, null, '{}', 'none', '/images/menu/grill-ghar/mineral-water.webp', 5)
) as v(cat, name_en, name_bn, desc_en, desc_bn, price, compare_at, prep_min, spice, tags, opt_set, img, sort_order)
join c on c.name_en = v.cat
join o on o.set_name = v.opt_set
on conflict do nothing;

-- 4. Mark #8 Double Smash sold out for demo
update public.menu_items set is_available = false
where name_en = 'Double Smash' and restaurant_id = (select id from public.restaurants where slug = 'grill-ghar');

-- 5. Offers (hero cards)
insert into public.offers (
  restaurant_id, title_en, title_bn, subtitle_en, subtitle_bn, badge_en, badge_bn,
  image_url, menu_item_id, category_id, sort_order
)
select r.id, v.title_en, v.title_bn, v.sub_en, v.sub_bn, v.badge_en, v.badge_bn,
  v.img,
  (select id from public.menu_items where restaurant_id = r.id and name_en = v.item),
  (select id from public.categories where restaurant_id = r.id and name_en = v.cat),
  v.sort_order
from public.restaurants r,
(values
  (
    'SMOKY JUICY NAGA HOT',
    'ধোঁয়াটে রসালো নাগা হট',
    'Solo Combo — any burger, fries & drink',
    'সোলো কম্বো — যেকোনো বার্গার, ফ্রাইজ ও ড্রিংক',
    'This week only',
    'শুধু এই সপ্তাহে',
    '/images/offers/grill-ghar/offer-solo-combo.webp',
    'Solo Combo',
    null,
    1
  ),
  (
    'FAMILY BUCKET NIGHT',
    'ফ্যামিলি বাকেট নাইট',
    '8 pc chicken, 2 fries, 1.25 L drink',
    '৮ পিস চিকেন, ২ ফ্রাইজ, ১.২৫ লি. ড্রিংক',
    'Fri & Sat',
    'শুক্র ও শনি',
    '/images/offers/grill-ghar/offer-family-bucket.webp',
    'Family Bucket',
    null,
    2
  ),
  (
    'TWO''S COMPANY',
    'দুজনের স্পেশাল কম্বো',
    'Duo Feast: 2 burgers, 2 fries, 2 drinks',
    'ডুও ফিস্ট: ২ বার্গার, ২ ফ্রাইজ, ২ ড্রিংক',
    'Save 16%',
    '১৬% সাশ্রয়',
    '/images/offers/grill-ghar/offer-duo-feast.webp',
    'Duo Feast',
    null,
    3
  )
) as v(title_en, title_bn, sub_en, sub_bn, badge_en, badge_bn, img, item, cat, sort_order)
where r.slug = 'grill-ghar'
on conflict do nothing;

-- 6. Tables 1–12
insert into public.tables (restaurant_id, number, seats, label, qr_token)
select r.id, n,
  case when n = 12 then 8 else 4 end,
  case when n = 12 then 'Family' else null end,
  'token_gg_' || n::text
from public.restaurants r, generate_series(1, 12) n
where r.slug = 'grill-ghar'
on conflict (restaurant_id, number) do update set
  seats = excluded.seats,
  label = excluded.label,
  qr_token = excluded.qr_token;

-- 7. Test table 99 (06-TESTING.md)
insert into public.tables (restaurant_id, number, label, seats, qr_token, is_active)
select id, 99, 'TEST', 2, 'token_gg_99', true
from public.restaurants where slug = 'grill-ghar'
on conflict (restaurant_id, number) do update set
  label = excluded.label,
  seats = excluded.seats,
  qr_token = excluded.qr_token,
  is_active = excluded.is_active;
