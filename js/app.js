(() => {
  const $ = (id) => document.getElementById(id);
  const supabaseReady = !!(window.supabase && window.NEVAR_SUPABASE_URL && window.NEVAR_SUPABASE_KEY);
  const db = supabaseReady ? window.supabase.createClient(window.NEVAR_SUPABASE_URL, window.NEVAR_SUPABASE_KEY) : null;
  let businesses = [], categories = [], activeCategory = "all";
  const escapeHTML = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const safeURL = (value) => { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
  const iconFor = (icon) => ({code:"⌘",palette:"✳",briefcase:"▣","briefcase-business":"▣","graduation-cap":"▤",store:"⌂"})[icon] || "✦";
  const setError = (target, message) => { if ($(target)) $(target).innerHTML = '<div class="empty">' + escapeHTML(message) + '</div>'; };
  function renderCategories() {
    const list = $("category-list"), filters = $("category-filters");
    if (!categories.length) { setError("category-list", "دسته‌بندی‌ها به‌زودی نمایش داده می‌شوند."); if(filters) filters.innerHTML=""; return; }
    list.innerHTML = categories.map(c => '<button class="category-card" data-category="' + escapeHTML(c.id) + '" style="text-align:right;cursor:pointer"><span class="icon">' + escapeHTML(iconFor(c.icon)) + '</span><h3>' + escapeHTML(c.name) + '</h3><p>' + escapeHTML(c.description || "مشاهده خدمات این دسته") + '</p></button>').join("");
    filters.innerHTML = '<button class="chip ' + (activeCategory==="all"?"active":"") + '" data-category="all">همه</button>' + categories.map(c => '<button class="chip ' + (activeCategory===c.id?"active":"") + '" data-category="' + escapeHTML(c.id) + '">' + escapeHTML(c.name) + '</button>').join("");
  }
  function renderBusinesses() {
    const q = ($("business-search")?.value || "").trim().toLocaleLowerCase();
    const items = businesses.filter(b => (activeCategory==="all" || b.category_id===activeCategory) && [b.name,b.summary,b.description,b.city,b.address,(b.tags||[]).join(" ")].join(" ").toLocaleLowerCase().includes(q));
    if (!items.length) { setError("business-list", businesses.length ? "موردی با این جست‌وجو پیدا نشد." : "هنوز کسب‌وکار منتشرشده‌ای ثبت نشده است."); return; }
    $("business-list").innerHTML = items.map(b => {
      const cover = safeURL(b.cover_url), logo = safeURL(b.logo_url);
      const image = cover ? '<img src="' + escapeHTML(cover) + '" alt="" loading="lazy">' : '<span class="cover-mark">' + (logo ? '<img src="' + escapeHTML(logo) + '" alt="' + escapeHTML(b.name) + '" style="width:100%;height:100%;object-fit:contain">' : escapeHTML((b.name||"N").trim().slice(0,1))) + '</span>';
      const links = [
        b.website_url ? '<a href="' + escapeHTML(safeURL(b.website_url)) + '" target="_blank" rel="noopener noreferrer">وب‌سایت ↗</a>' : "",
        b.bale_url ? '<a href="' + escapeHTML(safeURL(b.bale_url)) + '" target="_blank" rel="noopener noreferrer">بله ↗</a>' : "",
        b.phone ? '<a href="tel:' + escapeHTML(b.phone.replace(/[^+\d]/g,"")) + '">تماس</a>' : "",
        b.email ? '<a href="mailto:' + escapeHTML(b.email) + '">ایمیل</a>' : ""
      ].filter(Boolean).join("");
      return '<article class="business-card"><div class="cover">' + image + '</div><div class="business-body"><h3>' + escapeHTML(b.name) + '</h3><p>' + escapeHTML(b.summary || b.description || b.city || "برای اطلاعات بیشتر با این مجموعه ارتباط بگیر.") + '</p><div class="business-meta">' + (b.city ? '<span class="muted">' + escapeHTML(b.city) + '</span>' : '') + links + '</div></div></article>';
    }).join("");
  }
  async function init() {
    const toggle = $("menu-toggle"), nav = $("navlinks");
    toggle?.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
    nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
    $("business-search")?.addEventListener("input", renderBusinesses);
    $("search-clear")?.addEventListener("click", () => { $("business-search").value=""; activeCategory="all"; renderCategories(); renderBusinesses(); });
    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-category]"); if (!target) return;
      activeCategory = target.dataset.category; renderCategories(); renderBusinesses();
      if (target.closest("#category-list")) $("businesses")?.scrollIntoView({behavior:"smooth"});
    });
    if (!db) { setError("category-list","اتصال به پایگاه داده آماده نیست."); setError("business-list","تنظیمات اتصال Supabase بررسی شود."); return; }
    const [catRes, bizRes] = await Promise.all([
      db.from("categories").select("id,name,slug,description,icon,sort_order").eq("is_active",true).order("sort_order"),
      db.from("businesses").select("id,category_id,name,slug,summary,description,logo_url,cover_url,phone,email,website_url,bale_url,address,city,tags,is_featured,sort_order").eq("is_published",true).order("is_featured",{ascending:false}).order("sort_order")
    ]);
    if (catRes.error) console.error("NEVAR categories:",catRes.error);
    if (bizRes.error) console.error("NEVAR businesses:",bizRes.error);
    categories = catRes.data || []; businesses = bizRes.data || [];
    renderCategories(); renderBusinesses();
  }
  document.addEventListener("DOMContentLoaded", init);
})();