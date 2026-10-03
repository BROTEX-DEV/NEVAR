(() => {
  const $ = id => document.getElementById(id);
  const db = window.supabase?.createClient(window.NEVAR_SUPABASE_URL, window.NEVAR_SUPABASE_KEY);
  let categories = [], businesses = [], currentUser = null;
  const esc = s => String(s ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const msg = (id,text,error=false) => { const el=$(id); el.textContent=text; el.classList.remove("hidden"); el.classList.toggle("error",error); };
  const clearMsg = id => $(id).classList.add("hidden");
  const slugify = s => s.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || ("business-"+Date.now());
  const safeUrl = v => {if(!v)return "";try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)?u.href:""}catch{return ""}};
  function showLogin(){$("login-panel").classList.remove("hidden");$("admin-area").classList.add("hidden");}
  function showAdmin(){$("login-panel").classList.add("hidden");$("admin-area").classList.remove("hidden");}
  async function verifyAdmin(user) {
    const {data,error}=await db.from("admin_users").select("user_id,role").eq("user_id",user.id).maybeSingle();
    if(error) throw error;
    if(!data || data.role!=="admin") throw new Error("این حساب در فهرست مدیران NEVAR نیست. ابتدا حساب را در Supabase به مدیر تبدیل کن.");
  }
  async function loadCategories() {
    const {data,error}=await db.from("categories").select("id,name").eq("is_active",true).order("sort_order");
    if(error) throw error; categories=data||[];
    $("category-id").innerHTML='<option value="">بدون دسته‌بندی</option>'+categories.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+'</option>').join("");
  }
  async function loadBusinesses() {
    const {data,error}=await db.from("businesses").select("*").order("created_at",{ascending:false});
    if(error) throw error; businesses=data||[];
    $("business-rows").innerHTML=businesses.length?businesses.map(b=>'<div class="business-row"><div><strong>'+esc(b.name)+'</strong><p>'+esc(b.slug)+' · '+esc(categories.find(c=>c.id===b.category_id)?.name||"بدون دسته")+'</p></div><div class="row"><span class="status '+(b.is_published?"":"draft")+'">'+(b.is_published?"منتشرشده":"پیش‌نویس")+'</span><button class="btn secondary" data-edit="'+esc(b.id)+'">ویرایش</button><button class="btn secondary" data-delete="'+esc(b.id)+'">حذف</button></div></div>').join(""):'<p class="hint">هنوز کسب‌وکاری ثبت نشده است.</p>';
  }
  function resetForm() {
    $("business-form").reset(); $("business-id").value=""; $("logo-file").value=""; $("cover-file").value=""; $("save-business").textContent="ذخیره کسب‌وکار";
  }
  function editBusiness(id) {
    const b=businesses.find(x=>x.id===id); if(!b)return;
    $("business-id").value=b.id; ["name","slug","summary","description","phone","city","address","tags","seo-title","seo-description"].forEach(k=>{const map={"seo-title":"seo_title","seo-description":"seo_description"};const col=map[k]||k;$(k).value=Array.isArray(b[col])?b[col].join(", "):(b[col]||"");});
    $("category-id").value=b.category_id||"";$("email-contact").value=b.email||"";$("website-url").value=b.website_url||"";$("bale-url").value=b.bale_url||"";$("featured").checked=!!b.is_featured;$("published").checked=!!b.is_published;$("save-business").textContent="ذخیره تغییرات";$("business-form").scrollIntoView({behavior:"smooth"});
  }
  async function upload(file, prefix) {
    if(!file)return "";
    if(file.size>5*1024*1024)throw new Error("حجم هر تصویر باید حداکثر ۵ مگابایت باشد.");
    if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(file.type))throw new Error("فرمت تصویر مجاز نیست.");
    const ext=(file.name.split(".").pop()||"png").toLowerCase().replace(/[^a-z0-9]/g,"")||"png";
    const path=prefix+"/"+Date.now()+"-"+crypto.randomUUID()+"."+ext;
    const {error}=await db.storage.from("business-media").upload(path,file,{upsert:false,contentType:file.type});
    if(error)throw error;
    return db.storage.from("business-media").getPublicUrl(path).data.publicUrl;
  }
  async function loadSeo() {
    const {data,error}=await db.from("site_settings").select("value").eq("key","public.seo").maybeSingle();
    if(error)throw error; const v=data?.value||{};
    $("home-seo-title").value=v.title||"NEVAR | معرفی کسب‌وکارها و خدمات";$("home-seo-description").value=v.description||"معرفی کسب‌وکارها، خدمات و راه‌های ارتباطی در NEVAR.";
  }
  async function boot(user) {
    currentUser=user; await verifyAdmin(user); showAdmin(); await loadCategories(); await loadBusinesses(); await loadSeo();
  }
  $("login-form").addEventListener("submit",async e=>{
    e.preventDefault(); if(!db){msg("login-message","اتصال Supabase تنظیم نشده است.",true);return;}
    clearMsg("login-message");
    try { const {data,error}=await db.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value}); if(error)throw error; await boot(data.user); }
    catch(err){await db.auth.signOut();showLogin();msg("login-message",err.message||"ورود ناموفق بود.",true);}
  });
  $("logout-btn").addEventListener("click",async()=>{await db.auth.signOut();currentUser=null;showLogin();});
  $("reset-form").addEventListener("click",resetForm);
  $("name").addEventListener("input",()=>{if(!$("business-id").value && !$("slug").dataset.touched)$("slug").value=slugify($("name").value);});
  $("slug").addEventListener("input",()=>{$("slug").dataset.touched="1";});
  $("business-form").addEventListener("submit",async e=>{
    e.preventDefault();clearMsg("admin-message");$("save-business").disabled=true;
    try{
      const id=$("business-id").value;const old=businesses.find(b=>b.id===id)||{};
      const logo=await upload($("logo-file").files[0],"logos")||old.logo_url||"";
      const cover=await upload($("cover-file").files[0],"covers")||old.cover_url||"";
      const row={name:$("name").value.trim(),slug:slugify($("slug").value),category_id:$("category-id").value||null,city:$("city").value.trim(),summary:$("summary").value.trim(),description:$("description").value.trim(),phone:$("phone").value.trim(),email:$("email-contact").value.trim(),website_url:safeUrl($("website-url").value),bale_url:safeUrl($("bale-url").value),address:$("address").value.trim(),tags:$("tags").value.split(",").map(t=>t.trim()).filter(Boolean),logo_url:logo,cover_url:cover,seo_title:$("seo-title").value.trim(),seo_description:$("seo-description").value.trim(),is_featured:$("featured").checked,is_published:$("published").checked,updated_at:new Date().toISOString()};
      const result=id?await db.from("businesses").update(row).eq("id",id):await db.from("businesses").insert(row);
      if(result.error)throw result.error; msg("admin-message",id?"تغییرات ذخیره شد.":"کسب‌وکار اضافه شد.");resetForm();await loadBusinesses();
    }catch(err){msg("admin-message",err.message||"ذخیره انجام نشد.",true);}finally{$("save-business").disabled=false;}
  });
  $("business-rows").addEventListener("click",async e=>{
    const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]");
    if(edit){editBusiness(edit.dataset.edit);return;}
    if(del){const b=businesses.find(x=>x.id===del.dataset.delete);if(!b||!confirm("کسب‌وکار «"+b.name+"» حذف شود؟"))return;
      const {error}=await db.from("businesses").delete().eq("id",b.id);if(error)msg("admin-message",error.message,true);else{msg("admin-message","کسب‌وکار حذف شد.");await loadBusinesses();}}
  });
  $("seo-form").addEventListener("submit",async e=>{
    e.preventDefault();try{const value={title:$("home-seo-title").value.trim(),description:$("home-seo-description").value.trim()};const {error}=await db.from("site_settings").upsert({key:"public.seo",value,updated_at:new Date().toISOString()},{onConflict:"key"});if(error)throw error;msg("admin-message","تنظیمات SEO ذخیره شد.");}catch(err){msg("admin-message",err.message,true);}
  });
  (async()=>{if(!db){showLogin();msg("login-message","اتصال Supabase برقرار نیست.",true);return;}try{const {data}=await db.auth.getSession();if(data.session?.user)await boot(data.session.user);else showLogin();}catch(e){showLogin();}})();
})();