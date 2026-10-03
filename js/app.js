(() => {
  const $ = (id) => document.getElementById(id);
  const supabaseReady = !!(window.supabase && window.NEVAR_SUPABASE_URL && window.NEVAR_SUPABASE_KEY);
  const db = supabaseReady ? window.supabase.createClient(window.NEVAR_SUPABASE_URL, window.NEVAR_SUPABASE_KEY) : null;
  let articles = [];
  const escapeHTML = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const safeURL = (value) => { try { const u = new URL(value); return ["http:","https:"].includes(u.protocol) ? u.href : ""; } catch { return ""; } };
  const setError = (target, message) => { if ($(target)) $(target).innerHTML = '<div class="empty">' + escapeHTML(message) + '</div>'; };
  async function init() {
    const themeButton = $("theme-toggle");
    const applyTheme = theme => {
      document.documentElement.dataset.theme = theme;
      if (themeButton) themeButton.textContent = theme === "dark" ? "☀️ حالت روشن" : "🌙 دارک مود";
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = theme === "dark" ? "#101713" : "#155b3b";
    };
    let savedTheme = "light";
    try { savedTheme = localStorage.getItem("nevar-theme") || "light"; } catch {}
    applyTheme(savedTheme === "dark" ? "dark" : "light");
    themeButton?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem("nevar-theme", next); } catch {}
    });
    const toggle = $("menu-toggle"), nav = $("navlinks");
    toggle?.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", String(open)); });
    nav?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
    if (!db) { setError("category-list","اتصال به پایگاه داده آماده نیست."); setError("business-list","تنظیمات اتصال Supabase بررسی شود."); setError("article-list","اتصال به پایگاه داده آماده نیست."); return; }
    const [articleRes, seoRes] = await Promise.all([
      db.from("articles").select("id,title,slug,excerpt,content,cover_url,category,created_at").eq("is_published",true).order("created_at",{ascending:false}).limit(6),
      db.from("site_settings").select("value").eq("key","public.seo").maybeSingle()
    ]);
    if (articleRes.error) console.error("NEVAR articles:",articleRes.error);
    if (seoRes.data?.value) { const seo=seoRes.data.value; if(seo.title) document.title=seo.title; if(seo.description) { let m=document.querySelector('meta[name="description"]'); if(!m){m=document.createElement("meta");m.name="description";document.head.appendChild(m);} m.content=seo.description; } }
    articles = articleRes.data || [];
    const articleList = $("article-list");
    if (articleList) articleList.innerHTML = articles.length ? articles.map(a => '<article class="card">' + (safeURL(a.cover_url) ? '<img src="' + escapeHTML(safeURL(a.cover_url)) + '" alt="" loading="lazy" style="width:100%;height:150px;object-fit:cover;border-radius:10px;margin-bottom:12px">': '<div class="symbol">✎</div>') + '<small style="color:var(--g)">' + escapeHTML(a.category || "عمومی") + '</small><h3>' + escapeHTML(a.title) + '</h3><p>' + escapeHTML(a.excerpt || "") + '</p><div class="actions"><a class="btn green" href="article.html?slug=' + encodeURIComponent(a.slug) + '">مطالعه مقاله ↗</a></div></article>').join("") : '<div class="empty">هنوز مقاله ای منتشر نشده است.</div>';
  }
  document.addEventListener("DOMContentLoaded", init);
})();