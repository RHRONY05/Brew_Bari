-- supabase/seed.sql
-- Brew Bari demo seed data (03-DATABASE.md §6 + 06-TESTING.md)

-- 1. Restaurant
insert into public.restaurants (slug, name_en, name_bn, tagline_en, tagline_bn, package,
  vat_percent, service_charge_percent, require_session_approval,
  address, phone, opening_hours_en, opening_hours_bn, wifi_name, wifi_password,
  facebook_url, instagram_url, google_maps_url, google_review_url)
values ('brew-bari', 'Brew Bari', 'ব্রু বাড়ি',
  'Coffee & fresh juice, made with love', 'ভালোবাসায় বানানো কফি আর ফ্রেশ জুস', 3,
  5, 0, true,
  'GEC Circle, Chattogram', '+880 1812-345678',
  'Every day 9 AM – 11 PM', 'প্রতিদিন সকাল ৯টা – রাত ১১টা', 'BrewBari_Guest', 'coffee2026',
  'https://facebook.com/brewbari', 'https://instagram.com/brewbari', 'https://maps.google.com/?q=Chattogram', 'https://g.page/r/brewbari/review')
on conflict (slug) do update set
  name_en = excluded.name_en,
  name_bn = excluded.name_bn,
  tagline_en = excluded.tagline_en,
  tagline_bn = excluded.tagline_bn,
  package = excluded.package,
  vat_percent = excluded.vat_percent,
  service_charge_percent = excluded.service_charge_percent,
  require_session_approval = excluded.require_session_approval;

-- 2. Categories
insert into public.categories (restaurant_id, name_en, name_bn, icon, sort_order)
select r.id, v.name_en, v.name_bn, v.icon, v.sort_order
from public.restaurants r,
(values
  ('Hot Coffee',         'হট কফি',            '☕', 1),
  ('Cold Coffee',        'কোল্ড কফি',          '🧊', 2),
  ('Fresh Juice',        'ফ্রেশ জুস',           '🍹', 3),
  ('Shakes & Smoothies', 'শেক ও স্মুদি',         '🥤', 4),
  ('Tea',                'চা',                 '🍵', 5),
  ('Bites & Desserts',   'স্ন্যাকস ও ডেজার্ট',     '🥐', 6),
  ('Combos',             'কম্বো',               '🎁', 7)
) as v(name_en, name_bn, icon, sort_order)
where r.slug = 'brew-bari'
on conflict do nothing;

-- 3. Menu items (28 items)
with r as (select id from public.restaurants where slug = 'brew-bari'),
c as (select id, name_en from public.categories where restaurant_id = (select id from r)),
o(set_name, opts) as (values
  ('coffee', '[
    {"id":"size","name_en":"Size","name_bn":"সাইজ","type":"single","required":true,"choices":[
      {"id":"regular","name_en":"Regular","name_bn":"রেগুলার","price_delta":0},
      {"id":"large","name_en":"Large","name_bn":"লার্জ","price_delta":60}]},
    {"id":"milk","name_en":"Milk","name_bn":"দুধ","type":"single","required":false,"choices":[
      {"id":"regular","name_en":"Regular milk","name_bn":"সাধারণ দুধ","price_delta":0},
      {"id":"oat","name_en":"Oat milk","name_bn":"ওট মিল্ক","price_delta":80}]},
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]},
    {"id":"extras","name_en":"Extras","name_bn":"এক্সট্রা","type":"multi","required":false,"choices":[
      {"id":"shot","name_en":"Extra shot","name_bn":"এক্সট্রা শট","price_delta":50},
      {"id":"caramel","name_en":"Caramel syrup","name_bn":"ক্যারামেল সিরাপ","price_delta":40},
      {"id":"cream","name_en":"Whipped cream","name_bn":"হুইপড ক্রিম","price_delta":40}]}]'::jsonb),
  ('espresso', '[
    {"id":"extras","name_en":"Extras","name_bn":"এক্সট্রা","type":"multi","required":false,"choices":[
      {"id":"shot","name_en":"Extra shot","name_bn":"এক্সট্রা শট","price_delta":50}]}]'::jsonb),
  ('juice', '[
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]},
    {"id":"ice","name_en":"Ice","name_bn":"বরফ","type":"single","required":false,"choices":[
      {"id":"no","name_en":"No ice","name_bn":"বরফ ছাড়া","price_delta":0},
      {"id":"normal","name_en":"Normal ice","name_bn":"স্বাভাবিক বরফ","price_delta":0}]}]'::jsonb),
  ('tea', '[
    {"id":"sugar","name_en":"Sugar","name_bn":"চিনি","type":"single","required":false,"choices":[
      {"id":"none","name_en":"No sugar","name_bn":"চিনি ছাড়া","price_delta":0},
      {"id":"less","name_en":"Less sugar","name_bn":"কম চিনি","price_delta":0},
      {"id":"normal","name_en":"Normal","name_bn":"স্বাভাবিক","price_delta":0}]}]'::jsonb),
  ('none', '[]'::jsonb)
)
insert into public.menu_items (restaurant_id, category_id, name_en, name_bn, description_en, description_bn,
  price, compare_at_price, tags, options, sort_order)
select (select id from r), c.id, v.name_en, v.name_bn, v.desc_en, v.desc_bn,
       v.price, v.compare_at, v.tags::text[], o.opts, v.sort_order
from (values
  ('Hot Coffee',  'Espresso',           'এসপ্রেসো',             'A bold double shot of our house blend.',         'আমাদের হাউস ব্লেন্ডের কড়া ডাবল শট।',             180, null, '{hot}',                     'espresso', 1),
  ('Hot Coffee',  'Americano',          'আমেরিকানো',            'Espresso with hot water. Clean and strong.',      'গরম পানিতে এসপ্রেসো। হালকা কিন্তু কড়া।',           200, null, '{hot}',                     'coffee',   2),
  ('Hot Coffee',  'Cappuccino',         'ক্যাপুচিনো',             'Espresso, steamed milk and a thick foam cap.',    'এসপ্রেসো, স্টিমড দুধ আর ঘন ফোম।',                250, null, '{hot,bestseller}',          'coffee',   3),
  ('Hot Coffee',  'Café Latte',         'ক্যাফে লাতে',            'Smooth espresso with lots of silky milk.',        'প্রচুর মসৃণ দুধে নরম এসপ্রেসো।',                  260, null, '{hot}',                     'coffee',   4),
  ('Hot Coffee',  'Caramel Macchiato',  'ক্যারামেল ম্যাকিয়াতো',      'Vanilla milk, espresso and a caramel drizzle.',   'ভ্যানিলা দুধ, এসপ্রেসো আর ক্যারামেল।',              300, null, '{hot,bestseller}',          'coffee',   5),
  ('Hot Coffee',  'Mocha',              'মোকা',                 'Espresso meets rich chocolate.',                 'এসপ্রেসো আর ঘন চকলেটের মিলন।',                  290, null, '{hot}',                     'coffee',   6),
  ('Cold Coffee', 'Iced Americano',     'আইসড আমেরিকানো',         'Chilled espresso over ice.',                      'বরফের উপর ঠান্ডা এসপ্রেসো।',                       230, null, '{iced}',                    'coffee',   1),
  ('Cold Coffee', 'Iced Latte',         'আইসড লাতে',             'Espresso, cold milk, lots of ice.',               'এসপ্রেসো, ঠান্ডা দুধ আর প্রচুর বরফ।',               280, null, '{iced,bestseller}',         'coffee',   2),
  ('Cold Coffee', 'Cold Brew',          'কোল্ড ব্রু',              'Steeped 18 hours for a smooth, sweet finish.',    '১৮ ঘণ্টা ভিজিয়ে বানানো, মসৃণ স্বাদ।',                 300, null, '{iced,new}',                'coffee',   3),
  ('Cold Coffee', 'Caramel Frappé',     'ক্যারামেল ফ্রাপে',          'Blended iced coffee with caramel and cream.',     'ক্যারামেল আর ক্রিমসহ ব্লেন্ডেড আইসড কফি।',          340, null, '{iced,bestseller}',         'coffee',   4),
  ('Cold Coffee', 'Mocha Frappé',       'মোকা ফ্রাপে',             'Chocolate, coffee and ice, blended thick.',       'চকলেট, কফি আর বরফ — ঘন করে ব্লেন্ড।',              350, null, '{iced}',                    'coffee',   5),
  ('Fresh Juice', 'Mango Juice',        'আমের জুস',              'Fresh seasonal mangoes, nothing else.',           'মৌসুমি তাজা আম, আর কিছু না।',                       220, null, '{seasonal,veg}',            'juice',    1),
  ('Fresh Juice', 'Watermelon Juice',   'তরমুজের জুস',            'Cool, fresh and hydrating.',                      'ঠান্ডা, তাজা আর প্রাণ জুড়ানো।',                      180, null, '{veg}',                     'juice',    2),
  ('Fresh Juice', 'Malta Juice',        'মাল্টার জুস',             'Freshly squeezed local malta.',                   'সদ্য চিপে বানানো দেশি মাল্টা।',                       200, null, '{veg}',                     'juice',    3),
  ('Fresh Juice', 'Lemon Mint Cooler',  'লেমন মিন্ট কুলার',          'Lemon, mint and a little fizz.',                  'লেবু, পুদিনা আর হালকা ঝাঁঝ।',                        180, null, '{veg,bestseller}',          'juice',    4),
  ('Fresh Juice', 'Green Detox',        'গ্রিন ডিটক্স',             'Cucumber, green apple, mint and ginger.',         'শসা, সবুজ আপেল, পুদিনা আর আদা।',                   250, null, '{veg,new}',                 'juice',    5),
  ('Shakes & Smoothies', 'Oreo Shake',          'ওরিও শেক',             'Thick vanilla shake with crushed Oreo.',          'গুঁড়া ওরিওসহ ঘন ভ্যানিলা শেক।',                       320, null, '{bestseller}',              'none',     1),
  ('Shakes & Smoothies', 'Chocolate Shake',     'চকলেট শেক',            'Rich chocolate ice-cream shake.',                 'ঘন চকলেট আইসক্রিম শেক।',                         300, null, '{}',                        'none',     2),
  ('Shakes & Smoothies', 'Strawberry Smoothie', 'স্ট্রবেরি স্মুদি',          'Strawberry, banana and yogurt.',                  'স্ট্রবেরি, কলা আর দই।',                              330, null, '{veg}',                     'none',     3),
  ('Shakes & Smoothies', 'Banana Date Smoothie','কলা-খেজুর স্মুদি',         'Banana, dates and milk. Naturally sweet.',        'কলা, খেজুর আর দুধ। প্রাকৃতিক মিষ্টি।',                 280, null, '{veg}',                     'none',     4),
  ('Tea',         'Masala Chai',        'মশলা চা',               'Milk tea brewed with ginger, cardamom and clove.', 'আদা, এলাচ আর লবঙ্গে বানানো দুধ চা।',                120, null, '{hot}',                     'tea',      1),
  ('Tea',         'Lemon Honey Tea',    'লেবু-মধু চা',             'Light tea with lemon and honey.',                 'লেবু আর মধুর হালকা চা।',                              130, null, '{hot}',                     'tea',      2),
  ('Bites & Desserts', 'Chicken Sandwich',  'চিকেন স্যান্ডউইচ',        'Grilled chicken, cheese and greens on toast.',    'টোস্টে গ্রিলড চিকেন, চিজ আর সবজি।',                  280, null, '{}',                        'none',     1),
  ('Bites & Desserts', 'Butter Croissant',  'বাটার ক্রোয়াসাঁ',          'Flaky, buttery, baked every morning.',            'প্রতিদিন সকালে বেক করা মচমচে ক্রোয়াসাঁ।',             180, null, '{}',                        'none',     2),
  ('Bites & Desserts', 'Chocolate Brownie', 'চকলেট ব্রাউনি',           'Fudgy brownie, served warm.',                     'গরম গরম নরম ব্রাউনি।',                               190, null, '{bestseller}',              'none',     3),
  ('Bites & Desserts', 'Baked Cheesecake',  'বেকড চিজকেক',            'Creamy New York style cheesecake.',               'ক্রিমি নিউইয়র্ক স্টাইল চিজকেক।',                     350, null, '{}',                        'none',     4),
  ('Combos',      'Morning Combo',      'মর্নিং কম্বো',             'Cappuccino + Butter Croissant.',                  'ক্যাপুচিনো + বাটার ক্রোয়াসাঁ।',                          380,  430, '{}',                        'none',     1),
  ('Combos',      'Chill Combo',        'চিল কম্বো',               'Iced Latte + Chocolate Brownie.',                 'আইসড লাতে + চকলেট ব্রাউনি।',                         420,  470, '{new}',                     'none',     2)
) as v(cat, name_en, name_bn, desc_en, desc_bn, price, compare_at, tags, opt_set, sort_order)
join c on c.name_en = v.cat
join o on o.set_name = v.opt_set
on conflict do nothing;

-- 4. Approximate prep times
update public.menu_items m set prep_minutes = v.mins
from (values
  ('Espresso', 2), ('Americano', 3), ('Cappuccino', 4), ('Café Latte', 4), ('Caramel Macchiato', 6), ('Mocha', 6),
  ('Iced Americano', 3), ('Iced Latte', 3), ('Cold Brew', 1), ('Caramel Frappé', 5), ('Mocha Frappé', 5),
  ('Mango Juice', 4), ('Watermelon Juice', 4), ('Malta Juice', 4), ('Lemon Mint Cooler', 3), ('Green Detox', 5),
  ('Oreo Shake', 5), ('Chocolate Shake', 5), ('Strawberry Smoothie', 5), ('Banana Date Smoothie', 5),
  ('Masala Chai', 4), ('Lemon Honey Tea', 3),
  ('Chicken Sandwich', 10), ('Butter Croissant', 2), ('Chocolate Brownie', 1), ('Baked Cheesecake', 1),
  ('Morning Combo', 6), ('Chill Combo', 4)
) as v(name_en, mins)
where m.name_en = v.name_en
  and m.restaurant_id = (select id from public.restaurants where slug = 'brew-bari');

-- 5. Mark Baked Cheesecake sold out for demo
update public.menu_items set is_available = false
where name_en = 'Baked Cheesecake' and restaurant_id = (select id from public.restaurants where slug = 'brew-bari');

-- 6. Offers
insert into public.offers (restaurant_id, title_en, title_bn, subtitle_en, subtitle_bn, badge_en, badge_bn,
  menu_item_id, category_id, sort_order)
select r.id, v.title_en, v.title_bn, v.sub_en, v.sub_bn, v.badge_en, v.badge_bn,
  (select id from public.menu_items where restaurant_id = r.id and name_en = v.item),
  (select id from public.categories where restaurant_id = r.id and name_en = v.cat),
  v.sort_order
from public.restaurants r,
(values
  ('Mango season is here', 'আমের মৌসুম এসে গেছে', 'Fresh mango juice, only ৳220', 'তাজা আমের জুস, মাত্র ৳২২০', 'Seasonal', 'মৌসুমি', 'Mango Juice', null, 1),
  ('Morning Combo', 'মর্নিং কম্বো', 'Cappuccino + Croissant — save ৳50', 'ক্যাপুচিনো + ক্রোয়াসাঁ — ৳৫০ সাশ্রয়', 'Save ৳50', '৳৫০ ছাড়', 'Morning Combo', null, 2),
  ('Happy Hour 3–5 PM', 'হ্যাপি আওয়ার ৩–৫টা', 'Buy 1 get 1 on all cold coffee, Mon–Thu', 'সোম–বৃহস্পতি সব কোল্ড কফিতে ১টা কিনলে ১টা ফ্রি', 'Today only', 'শুধু আজ', null, 'Cold Coffee', 3)
) as v(title_en, title_bn, sub_en, sub_bn, badge_en, badge_bn, item, cat, sort_order)
where r.slug = 'brew-bari'
on conflict do nothing;

-- 7. Tables 1–8
insert into public.tables (restaurant_id, number, seats)
select r.id, n, case when n <= 4 then 2 else 4 end
from public.restaurants r, generate_series(1, 8) n
where r.slug = 'brew-bari'
on conflict (restaurant_id, number) do nothing;

-- 8. Test table 99 (06-TESTING.md)
insert into public.tables (restaurant_id, number, label, seats, is_active)
select id, 99, 'TEST', 2, true from public.restaurants where slug = 'brew-bari'
on conflict (restaurant_id, number) do nothing;
