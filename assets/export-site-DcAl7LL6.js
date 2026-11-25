const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/jszip.min-BKkSLVCN.js","assets/rolldown-runtime-Dd_uD5pT.js"])))=>i.map(i=>d[i]);
import{i as e}from"./rolldown-runtime-Dd_uD5pT.js";import{t}from"./index-Dmt5CjvD.js";import{t as n}from"./download-BVe_fCig.js";import{a as r,n as i,r as a,s as o}from"./routes-xCwZ4mIr.js";var s={compact:{width:1600,q:.76},balanced:{width:2560,q:.82},high:{width:4096,q:.86},original:{width:null,q:.92}};function c(e,t){return e.type.includes(`png`)?`png`:e.type.includes(`webp`)?`webp`:e.type.includes(`wav`)?`wav`:e.type.includes(`mpeg`)||e.type.includes(`mp3`)?`mp3`:e.type.includes(`ogg`)?`ogg`:e.type.includes(`jpeg`)?`jpg`:t}async function l(e){try{return await createImageBitmap(e)}catch{let t=URL.createObjectURL(e);try{let e=new Image;return e.src=t,await e.decode(),e}finally{URL.revokeObjectURL(t)}}}async function u(e,t,n){if(!t&&(e.type.includes(`jpeg`)||e.type.includes(`png`)||e.type.includes(`webp`)))return e;let r=await l(e),i=`width`in r?r.width:0,a=`height`in r?r.height:0,o=t?Math.min(1,t/i):1,s=document.createElement(`canvas`);s.width=Math.max(2,Math.round(i*o)),s.height=Math.max(2,Math.round(a*o));let c=s.getContext(`2d`);if(!c)throw Error(`Не удалось подготовить изображение`);c.drawImage(r,0,0,s.width,s.height),`close`in r&&r.close();let u=await new Promise(e=>s.toBlob(e,`image/jpeg`,n));if(!u)throw Error(`Не удалось сжать панораму`);return u}async function d(e){let t=await fetch(i(e));if(!t.ok)throw Error(`Не найден файл ${e}`);return t.text()}async function f(e){let t=await fetch(i(e));if(!t.ok)throw Error(`Не найден файл ${e}`);return t.arrayBuffer()}function p(e){return e.replace(/[^a-z0-9_-]/gi,``).slice(0,80)||`file`}function m(e){return JSON.stringify(e).replace(/</g,`\\u003c`).replace(/>/g,`\\u003e`).replace(/&/g,`\\u0026`).replace(/\u2028/g,`\\u2028`).replace(/\u2029/g,`\\u2029`)}function h(e){return`ORBITA — ${e.name}

Готовый сайт виртуального тура. Сервер, база и конструктор не нужны.
Все пути относительные: сайт открывается и с корня домена, и из подпапки.

GitHub Pages
1. Создайте репозиторий и залейте В КОРЕНЬ распакованную папку
   (index.html рядом с player/, vendor/, panoramas/). Не заворачивайте
   сайт во вложенную папку, если Pages публикует корень репозитория.
2. Файл .nojekyll уже внутри — без него Pages прячет часть файлов.
3. Settings → Pages → Deploy from a branch → ветка main, папка / (root).
4. Сайт пользователя: https://USER.github.io/
   Сайт проекта:     https://USER.github.io/REPO/
   Оба варианта работают, страницу обновлять не нужно.
5. Если открыли несуществующий адрес, 404.html вернёт на корень тура.

Другой хостинг
Распакуйте архив и залейте содержимое на Nginx, Netlify или FTP.
Откройте index.html. Надёжнее по http(s), чем как локальный файл.
`}var g=`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <title>ORBITA</title>
  <script>
    (function () {
      var path = location.pathname;
      var cut = path.replace(/\\/+$/, "").replace(/\\/[^/]*$/, "");
      var next = (cut || "") + "/";
      if (next !== path) location.replace(next);
    })();
  <\/script>
</head>
<body>
  <p><a href="./">Открыть тур</a></p>
</body>
</html>
`;function _(e,t){let n=m(t);return`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${v(e)}</title>
  <meta name="description" content="Виртуальный тур «${v(e)}», собранный в ORBITA." />
  <link rel="icon" href="favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="vendor/pannellum/pannellum.css" />
  <link rel="stylesheet" href="player/fonts.css" />
  <link rel="stylesheet" href="player/player.css" />
</head>
<body>
  <div id="app"></div>
  <script>
    window.ORBITA_STANDALONE = true;
    (function () {
      var href = location.href.split("#")[0].split("?")[0];
      if (!/\\/[^/]+\\.[a-z0-9]+$/i.test(location.pathname) && href.slice(-1) !== "/") href += "/";
      window.ORBITA_BASE = new URL(".", href).href;
    })();
    window.TOUR = ${n};
  <\/script>
  <script src="vendor/pannellum/pannellum.js"><\/script>
  <script src="player/player.js"><\/script>
</body>
</html>
`}function v(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}async function y(i,l){let{default:m}=await t(async()=>{let{default:t}=await import(`./jszip.min-BKkSLVCN.js`).then(t=>e(t.default,1));return{default:t}},__vite__mapDeps([0,1])),v=new m,y=s[l],b={};for(let e of i.scenes){let t=await o(e.imageId);if(!t)throw Error(`Нет фото у сцены «${e.name}»`);let n=l===`original`?t:await u(t,y.width,y.q),r=l===`original`?c(t,`jpg`):`jpg`,i=`panoramas/${p(e.id)}.${r}`;if(v.file(i,n),b[e.imageId]=i,e.thumbId){let t=await o(e.thumbId);if(t){let n=`media/thumb-${p(e.id)}.${c(t,`jpg`)}`;v.file(n,t),b[e.thumbId]=n}}}if(i.settings.logoId){let e=await o(i.settings.logoId);if(e){let t=`media/logo.${c(e,`png`)}`;v.file(t,e),b[i.settings.logoId]=t}}if(i.settings.audioId){let e=await o(i.settings.audioId);if(e){let t=`media/audio.${c(e,`mp3`)}`;v.file(t,e),b[i.settings.audioId]=t}}let x=a(i,b,{mode:`play`,placeKind:null,selectedHotspotId:null}),S=i.settings.startSceneId;S&&x.scenes.some(e=>e.id===S)&&(x.activeSceneId=S),v.file(`index.html`,_(i.name,x)),v.file(`404.html`,g),v.file(`.nojekyll`,``),v.file(`README.txt`,h(i));try{v.file(`favicon.svg`,await d(`favicon.svg`))}catch{}v.file(`player/player.js`,await d(`player/player.js`)),v.file(`player/player.css`,await d(`player/player.css`)),v.file(`vendor/pannellum/pannellum.js`,await d(`vendor/pannellum/pannellum.js`)),v.file(`vendor/pannellum/pannellum.css`,await d(`vendor/pannellum/pannellum.css`));let C=await d(`player/fonts.css`);v.file(`player/fonts.css`,C);let w=new Set([...C.matchAll(/fonts\/([^")]+)/g)].map(e=>e[1]));for(let e of w)v.file(`player/fonts/${e}`,await f(`player/fonts/${e}`));let T=await v.generateAsync({type:`blob`});n(T,`${r(i.name)}-site.zip`)}export{y as exportSiteZip};