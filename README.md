# موقع سيزر كافيه ومطعم

- `index.html`: الموقع. منيو على عمود ثري دي، بحث، سلة، وطلب بيتبعت على واتساب.
- `admin.html`: لوحة التحكم، وبتفتح على `/admin`.
- المنيو ورقم واتساب الطلبات والعنوان والمواعيد متخزنين في Supabase، والموقع بيقراهم أول ما يفتح.

## التشغيل لأول مرة

1. **اعمل مشروع على Supabase.**
2. **الجداول:** من SQL Editor شغّل `supabase/schema.sql`، وبعده `supabase/seed.sql` (ده بينقل المنيو الحالي كله، 425 صنف).
3. **حساب الأدمن:** من Authentication > Users > Add user، اعمل إيميل وباسورد. وبعدين شغّل السطر ده في SQL Editor بعد ما تحط الإيميل:
   ```sql
   insert into public.admins (user_id) select id from auth.users where email = 'الإيميل هنا';
   ```
4. **الربط:** من Project Settings > API، انسخ Project URL والمفتاح anon public، وحطهم في `config.js`.
5. **ارفع على GitHub واربطه بـ Vercel.** الإعدادات جاهزة في `vercel.json`.
6. **افتح `/admin`، وادخل، وحط رقم واتساب الطلبات** من تبويب «الطلبات وبيانات المطعم».

## ملاحظات
- المفتاح anon معمول عشان يبقى في الموقع. الصلاحيات محمية جوه قاعدة البيانات: أي حد يقدر يقرا المنيو، والأدمن بس يقدر يعدّل.
- `index.html` جواه نسخة ثابتة من المنيو (من `src/menu.txt`) بتظهر لحظة قبل ما البيانات توصل من Supabase، أو لو Supabase مش متاح. لو عايز تحدّثها: `npm run build`.
- عايز تقفل التسجيل؟ من Authentication > Providers > Email اقفل «Allow new users to sign up». الأدمن بيتعمل يدوي من الداشبورد.
