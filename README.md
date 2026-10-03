# NEVAR — v1.1.2

مجله آنلاین فارسی برای مقاله های آموزشی؛ GitHub Pages + Supabase.

- Repository: https://github.com/Nevar-Dev/NEVAR
- Bale: https://ble.ir/iNfo_Nevar
- Supabase project: https://supabase.com/dashboard/project/pwwicgyrycaexjnnhseb
- Admin page: /admin.html

## Features
- نمایش مقاله های منتشرشده
- پنل مدیریت برای ورود مدیر و مدیریت مقاله ها (ایجاد، ویرایش، انتشار و حذف)
- صفحه اختصاصی هر مقاله با عنوان و توضیحات SEO
- آمار بازدید مقاله ها در پنل مدیریت
- آپلود لوگو و کاور در Storage
- فیلدهای SEO برای کسب وکارها و تنظیمات صفحه اصلی
- RLS و سیاست های مدیر در پایگاه داده

## Create the first admin
1. In Supabase, open Authentication → Users and create a user with your email and a strong password.
2. Copy the user's UUID.
3. In SQL Editor, run the following query, replacing the placeholder with the real UUID:

    insert into public.admin_users (user_id)
    values ('UUID-OF-YOUR-USER')
    on conflict (user_id) do nothing;

4. Sign in at /admin.html using that email and password.

Alternatively, assign the user by email using:

    insert into public.admin_users (user_id)
    select id from auth.users where email = 'admin@example.com'
    on conflict (user_id) do nothing;

## Security
- js/supabase-config.js contains only the browser-safe publishable key.
- Never put service_role or secret keys in GitHub Pages.
- Only admins can manage content and view analytics. Public visitors can read published articles and increment view counts through a restricted database function.
- Public image URLs are expected because logos/covers are displayed on the public site; only admins can upload/update/delete them.

## SEO note
Homepage title and description are updated in the browser from public.seo settings. GitHub Pages serves static HTML, so server-rendered SEO requires a later build/deploy step if needed.
