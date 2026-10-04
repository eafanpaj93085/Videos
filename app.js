const DB_NAME = "videos-offline-db";
const DB_VERSION = 1;
const STORE = "videos";
const feed = document.getElementById("feed");
const empty = document.getElementById("empty");
const picker = document.getElementById("filePicker");
const addBtn = document.getElementById("addBtn");
const addFirst = document.getElementById("addFirst");
const toast = document.getElementById("toast");
const sheetBackdrop = document.getElementById("commentsSheet");
const commentsList = document.getElementById("commentsList");
const commentForm = document.getElementById("commentForm");
const commentInput = document.getElementById("commentInput");
let currentCommentVideo = null;
let observer;

function openDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{ if(!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE,{keyPath:"id",autoIncrement:true}); };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}
async function allVideos(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readonly"), req=tx.objectStore(STORE).getAll();
    req.onsuccess=()=>resolve(req.result.sort((a,b)=>a.order-b.order));
    req.onerror=()=>reject(req.error);
  });
}
async function addVideos(files){
  const db=await openDB();
  const existing=await allVideos();
  let order=existing.length;
  for(const file of files){
    if(!file.type.startsWith("video/")) continue;
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(STORE,"readwrite");
      tx.objectStore(STORE).add({name:file.name,type:file.type,blob:file,order:order++,likes:0,liked:false,comments:[]});
      tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
    });
  }
  showToast(`${files.length} video${files.length===1?"":"s"} added`);
  render();
}
async function updateVideo(video){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(STORE,"readwrite"); tx.objectStore(STORE).put(video);
    tx.oncomplete=resolve; tx.onerror=()=>reject(tx.error);
  });
}
async function deleteAll(){ /* intentionally not exposed in UI */ }

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));}
function showToast(text){toast.textContent=text;toast.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>toast.classList.remove("show"),1800);}

async function render(){
  const videos=await allVideos();
  feed.innerHTML="";
  empty.style.display=videos.length?"none":"grid";
  if(!videos.length) return;

  for(const v of videos){
    const card=document.createElement("article");
    card.className="video-card";
    card.dataset.id=v.id;
    const url=URL.createObjectURL(v.blob);
    card.innerHTML=`
      <video class="video" src="${url}" playsinline loop preload="metadata"></video>
      <div class="shade"></div>
      <div class="info"><div class="filename">${escapeHtml(v.name)}</div><div class="meta">Offline • ${v.comments.length} comment${v.comments.length===1?"":"s"}</div></div>
      <div class="actions">
        <button class="action like ${v.liked?"active":""}" aria-label="Like">${v.liked?"♥":"♡"}</button>
        <div class="count">${v.likes}</div>
        <button class="action comment" aria-label="Comments">💬</button>
        <div class="count">${v.comments.length}</div>
      </div>`;
    const video=card.querySelector(".video");
    card.addEventListener("click",(e)=>{
      if(e.target.closest(".action")) return;
      if(video.paused) video.play().catch(()=>{}); else video.pause();
    });
    card.querySelector(".like").addEventListener("click",async()=>{
      v.liked=!v.liked; v.likes=Math.max(0,v.likes+(v.liked?1:-1)); await updateVideo(v); render();
    });
    card.querySelector(".comment").addEventListener("click",()=>openComments(v));
    feed.appendChild(card);
  }
  if(observer) observer.disconnect();
  observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      const video=e.target.querySelector("video");
      if(e.isIntersecting && e.intersectionRatio>.65){
        document.querySelectorAll(".video").forEach(x=>{if(x!==video)x.pause()});
        video.play().catch(()=>{});
      }else video.pause();
    });
  },{root:feed,threshold:[.65]});
  document.querySelectorAll(".video-card").forEach(x=>observer.observe(x));
}
function openComments(v){
  currentCommentVideo=v;
  document.getElementById("commentTitle").textContent=`Comments (${v.comments.length})`;
  renderComments();
  sheetBackdrop.hidden=false;
  setTimeout(()=>commentInput.focus(),100);
}
function renderComments(){
  commentsList.innerHTML="";
  if(!currentCommentVideo.comments.length){commentsList.innerHTML='<div class="no-comments">No comments yet. Be the first.</div>';return;}
  currentCommentVideo.comments.slice().reverse().forEach(c=>{
    const el=document.createElement("div"); el.className="comment";
    el.innerHTML=`<div class="comment-name">You • ${escapeHtml(c.date)}</div><div class="comment-text">${escapeHtml(c.text)}</div>`;
    commentsList.appendChild(el);
  });
}
commentForm.addEventListener("submit",async e=>{
  e.preventDefault();
  const text=commentInput.value.trim();
  if(!text || !currentCommentVideo) return;
  currentCommentVideo.comments.push({text,date:new Date().toLocaleString()});
  await updateVideo(currentCommentVideo);
  commentInput.value="";
  renderComments();
  document.getElementById("commentTitle").textContent=`Comments (${currentCommentVideo.comments.length})`;
});
document.getElementById("closeComments").addEventListener("click",()=>sheetBackdrop.hidden=true);
sheetBackdrop.addEventListener("click",e=>{if(e.target===sheetBackdrop) sheetBackdrop.hidden=true});
addBtn.addEventListener("click",()=>picker.click());
addFirst.addEventListener("click",()=>picker.click());
picker.addEventListener("change",async()=>{if(picker.files.length) await addVideos([...picker.files]); picker.value="";});
window.addEventListener("load",render);
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
