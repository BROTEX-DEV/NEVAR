(() => {
  const root = document.getElementById("article");
  const esc = s => String(s ?? "").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const db = window.supabase?.createClient(window.NEVAR_SUPABASE_URL,window.NEVAR_SUPABASE_KEY);
  const slug = new URLSearchParams(location.search).get("slug");
  async function init() {
    if(!db || !slug){root.innerHTML='<p class="empty">مقاله پیدا نشد.</p>';return;}
    const {data,error}=await db.from("articles").select("title,slug,excerpt,content,cover_url,category,created_at,seo_title,seo_description").eq("slug",slug).eq("is_published",true).maybeSingle();
    if(error || !data){root.innerHTML='<p class="empty">این مقاله وجود ندارد یا هنوز منتشر نشده است.</p>';return;}
    document.title=(data.seo_title || data.title)+" | NEVAR";
    const meta=document.querySelector('meta[name="description"]');
    if(meta)meta.content=data.seo_description || data.excerpt || data.title;
    const date=data.created_at?new Date(data.created_at).toLocaleDateString("fa-IR"):"";
    root.innerHTML=(data.cover_url?'<img class="cover" src="'+esc(data.cover_url)+'" alt="">':"")+
      '<p class="muted">'+esc(data.category||"عمومی")+(date?" · "+esc(date):"")+'</p>'+
      '<h1>'+esc(data.title)+'</h1>'+
      (data.excerpt?'<p class="muted">'+esc(data.excerpt)+'</p>':"")+
      '<div class="content">'+esc(data.content)+'</div>';
  }
  document.addEventListener("DOMContentLoaded",init);
})();