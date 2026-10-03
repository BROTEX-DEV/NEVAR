(() => {
  const root = document.getElementById("article");
  const esc = s => String(s ?? "").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const tick=String.fromCharCode(96);
  const inlineMarkdown = s => esc(s).replace(new RegExp(tick+"([^"+tick+"]+)"+tick,"g"),"<code>$1</code>").replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>");
  function renderMarkdown(source) {
    const lines=String(source||"").replace(/\r/g,"").split("\n");
    const out=[];let paragraph=[],list=false,code=false,codeLines=[];
    const flushParagraph=()=>{if(paragraph.length){out.push("<p>"+paragraph.map(inlineMarkdown).join("<br>")+"</p>");paragraph=[];}};
    const flushList=()=>{if(list){out.push("</ul>");list=false;}};
    for(const line of lines){
      if(line.trim().startsWith(tick+tick+tick)){
        flushParagraph();flushList();
        if(code){out.push("<pre><code>"+esc(codeLines.join("\n"))+"</code></pre>");codeLines=[];code=false;}
        else code=true;
        continue;
      }
      if(code){codeLines.push(line);continue;}
      if(!line.trim()){flushParagraph();flushList();continue;}
      const heading=line.match(/^(#{1,3})\s+(.+)$/);
      if(heading){flushParagraph();flushList();const level=Math.min(3,heading[1].length);out.push("<h"+level+">"+inlineMarkdown(heading[2])+"</h"+level+">");continue;}
      if(/^---+$/.test(line.trim())){flushParagraph();flushList();out.push("<hr>");continue;}
      const item=line.match(/^\s*-\s+(.+)$/);
      if(item){flushParagraph();if(!list){out.push("<ul>");list=true;}out.push("<li>"+inlineMarkdown(item[1])+"</li>");continue;}
      flushList();paragraph.push(line);
    }
    if(code)out.push("<pre><code>"+esc(codeLines.join("\n"))+"</code></pre>");
    flushParagraph();flushList();return out.join("");
  }
  function renderPythonSeries(slug) {
    const match=String(slug||"").match(/^python-tutorial-part-(\d+)$/);
    if(!match)return "";
    const current=Number(match[1]);if(current<1||current>8)return "";
    const links=Array.from({length:8},(_,i)=>{const n=i+1;return '<a class="'+(n===current?'current':'')+'" href="article.html?slug=python-tutorial-part-'+n+'">قسمت '+n.toLocaleString("fa-IR")+'</a>';}).join("");
    return '<nav class="python-series" aria-label="قسمت های آموزش پایتون"><strong>مسیر آموزش پایتون</strong><div>'+links+'</div></nav>';
  }
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
      '<div class="content">'+renderMarkdown(data.content)+'</div>'+renderPythonSeries(slug);
  }
  document.addEventListener("DOMContentLoaded",init);
})();