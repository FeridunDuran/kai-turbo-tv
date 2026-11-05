import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const flush=()=>new Promise(setImmediate);
async function fixture({videos,failNext=false,fallbacks=[],holdPlayback=false}={}){
 const nodes=[],events={},intervals=new Map(),timers=new Map(),lookups=[],plays=[],saves=[],toasts=[],menus=[],startup=[];let id=0,view,focused,popped=0;
 function h(tag,props={},children=[]){const node={tag,children:[],style:{},textContent:'',html:'',classList:{add(){},remove(){},contains(){return false;}},setAttribute(){},removeAttribute(){},appendChild(child){this.children.push(child);return child;},contains(child){return this===child||this.children.some(n=>n&&n.contains&&n.contains(child));}};Object.assign(node,{textContent:props&&props.text||'',html:props&&props.html||'',__select:props&&props.onSelect});node.children=(Array.isArray(children)?children:[children]).filter(Boolean);nodes.push(node);return node;}
 const video=Object.assign(h('video'),{duration:NaN,currentTime:0,paused:false,seeking:false,ended:false,readyState:0,networkState:2,buffered:{length:0},addEventListener(name,fn){(events[name]||=([])).push(fn);},emit(name){for(const fn of events[name]||[])fn();},pause(){this.paused=true;this.emit('pause');},play(){this.paused=false;return Promise.resolve();},removeAttribute(){this.src='';this.emit('pause');},load(){this.currentTime=0;this.duration=NaN;}});
 const episode1={id:'tt:1:1',season:1,episode:1},episode2={id:'tt:1:2',season:1,episode:2};
 const current={infoHash:'a'.repeat(40),fileIdx:0,name:'current',addon:'Torrentio',behaviorHints:{bingeGroup:'same'}};
 const alternate={url:'https://fixture/alternate',name:'alternate'};const settings={skipMode:'off',audioLangs:[],subtitleLangs:[],subtitlesAuto:false};
 const mocks={dom:{h,clear:n=>{n.children=[];n.textContent='';}},nav:{KEY:{},focus:n=>{focused=n;},current:()=>focused,topLayer:()=>({root:view&&view.el})},luna:{closeHeavyBackgroundApps:()=>Promise.resolve([])},subs:{Renderer:()=>({clear(){},update(){},setOffset(){},set(){}})},substyle:{apply(){}},store:{settings:()=>settings,get:()=>({}),set(){}},log:{log:{info(){},warn(){}}},http:{},mediaerror:{},
 server:{isTorrent:s=>!!s.infoHash,isPlayableType:s=>!!(s.infoHash||s.url),isAvailable:()=>false,toPlayable(s,series){startup.push("playback");plays.push({s,series});if(holdPlayback)return new Promise(()=>{});return failNext&&plays.length>1?Promise.reject(new Error('next source failed')):Promise.resolve({url:'http://fixture/'+plays.length});}},tvproxy:{isTorrentAvailable:()=>true},addons:{fetchStreams(type,episode,callback){return new Promise((resolve,reject)=>lookups.push({episode,callback,resolve,reject}));},fetchSubtitles:()=>{startup.push("subtitles");return Promise.resolve([]);}},stremio:{saveProgress:(...args)=>saves.push(args)},skip:{},ui:{toast:s=>toasts.push(s),menu:(...args)=>menus.push(args),fmtTime:()=>'',timeHM:()=>''},router:{push(v){view=v;v.onShow();},pop(){popped++;},tabView(){}},details:{sortedVideos:m=>m.videos.slice().sort((a,b)=>(a.season===0?9999:a.season)-(b.season===0?9999:b.season)||a.episode-b.episode),openDetails(){}},i18n:{t:s=>s,epLabel:(s,e)=>s+':'+e},watched:{record(){}},phone:{onSeek(){},nowPlaying(){}},tizenvideo:{createVideo:()=>video}};
 const context={mocks,Promise,Date,__KAI_DEVLOG__:'',document:{createTextNode:text=>({textContent:text})},setTimeout(fn,ms){timers.set(++id,{fn,ms});return id;},clearTimeout:t=>timers.delete(t),setInterval(fn,ms){intervals.set(++id,{fn,ms});return id;},clearInterval:t=>intervals.delete(t)};
 let source=fs.readFileSync(new URL('../../src/js/views/player.js',import.meta.url),'utf8').replace(/^import \* as (\w+) from '[^']*\/([^/]+)\.js';/gm,'const $1=mocks["$2"];').replace(/^import \{ ([^}]+) \} from '[^']*\/([^/]+)\.js';/gm,'const {$1}=mocks["$2"];').replace(/export function /g,'function ');
 vm.runInNewContext(source,context);context.openPlayer({meta:{id:'tt',type:'series',name:'Test',videos:videos||[episode1,episode2]},video:episode1,stream:current,streams:[current,alternate],fallbacks,isSeries:true});await flush();video.duration=1327;video.currentTime=1200;video.emit('loadedmetadata');video.emit('playing');
 const next=nodes.find(n=>n.html.includes('Próximo'));const sources=nodes.find(n=>n.html.includes('Fontes'));
 return {startup,video,nodes,lookups,plays,saves,toasts,menus,intervals,view,next:()=>next.__select(),sources:()=>sources.__select(),get popped(){return popped;},nextStream:{...current,fileIdx:1},close:()=>view.destroy()};
}
test('double next/ended requests coalesce; early matching source starts without other addons; old fallbacks never cross episodes',async()=>{
 const f=await fixture({failNext:true,fallbacks:[{url:'https://fixture/OLD-EPISODE'}]});f.next();f.next();f.video.emit('ended');assert.equal(f.lookups.length,1);
 f.lookups[0].callback({},[f.nextStream]);await flush();assert.equal(f.plays.length,2);assert.equal(f.plays[1].series.episode,2);assert.equal(f.plays[1].s.fileIdx,1);assert.ok(f.saves.every(args=>args[1]==='tt:1:1'));f.lookups[0].resolve([f.nextStream]);await flush();f.close();
});
test('changing source invalidates a pending next-episode lookup',async()=>{
 const f=await fixture();f.next();f.sources();f.menus.at(-1)[2].onPick(1);await flush();f.lookups[0].resolve([f.nextStream]);await flush();assert.equal(f.plays.length,2);assert.equal(f.plays[1].series.episode,1);assert.equal(f.plays[1].s.name,'alternate');f.close();
});
test('lookup rejection permits retry without leaving the player stuck',async()=>{
 const f=await fixture();f.next();f.lookups[0].reject(new Error('offline'));await flush();assert.ok(f.toasts.some(s=>s.includes('Could not load the next episode')));f.next();assert.equal(f.lookups.length,2);f.lookups[1].resolve([]);await flush();f.close();
});
test('unreleased episodes and specials cannot be auto-started after a normal season',async()=>{
 for(const next of [{id:'future',season:1,episode:2,released:'2999-01-01'},{id:'special',season:0,episode:1}]){const f=await fixture({videos:[{id:'tt:1:1',season:1,episode:1},next]});f.next();assert.equal(f.lookups.length,0);f.close();}
});
test('up-next countdown pauses with playback and stops when seeking away from credits',async()=>{
 const f=await fixture();f.video.currentTime=1310;f.video.emit('timeupdate');let tick=[...f.intervals.values()].find(t=>t.ms===1000);assert.ok(tick);f.video.paused=true;for(let i=0;i<15;i++)tick.fn();assert.equal(f.lookups.length,0);f.video.paused=false;f.video.currentTime=200;tick.fn();assert.equal([...f.intervals.values()].some(t=>t.ms===1000),false);f.close();
});


test('subtitle lookup starts independently while torrent preparation is still pending',async()=>{
 const f=await fixture({holdPlayback:true});assert.deepEqual(f.startup,['subtitles','playback']);assert.equal(f.video.src,'');f.close();
});
