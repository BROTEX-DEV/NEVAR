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
    let views=null;
    let viewError="";
    try {
      const result=await db.rpc("record_article_view",{p_slug:slug});
      if(result.error) {
        console.error("NEVAR view counter error:",result.error);
        viewError="ثبت بازدید انجام نشد: "+(result.error.message||"خطای ارتباط با پایگاه داده");
      } else if(result.data!==null && Number.isFinite(Number(result.data))) {
        views=Number(result.data);
      } else {
        viewError="این مقاله برای ثبت بازدید پیدا نشد.";
      }
    } catch (error) {
      console.error("NEVAR view counter exception:",error);
      viewError="ارتباط با شمارنده بازدید برقرار نشد.";
    }
    root.innerHTML=(data.cover_url?'<img class="cover" src="'+esc(data.cover_url)+'" alt="">':"")+
      '<div class="article-topline"><span class="category-pill">'+esc(data.category||"عمومی")+'</span><span class="muted">'+(date?esc(date)+" · ":"")+(views!==null?'👁 '+views.toLocaleString("fa-IR")+' بازدید':"")+'</span></div>'+
      (viewError?'<p class="muted" role="status">'+esc(viewError)+'</p>':"")+
      '<h1>'+esc(data.title)+'</h1>'+
      (data.excerpt?'<p class="muted">'+esc(data.excerpt)+'</p>':"")+
      '<div class="content">'+esc(data.content)+'</div>';
  }
  document.addEventListener("DOMContentLoaded",init);
})();