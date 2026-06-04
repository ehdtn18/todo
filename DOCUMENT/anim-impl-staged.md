# 생성/수정 “날아가서 반영” 애니메이션 — 구현 완료(스테이징) · 승인 시 적용

> 대시보드와 **함께 적용**하기로 해서 라이브 파일엔 아직 반영하지 않음.
> 승인하면 아래 3곳(JSX 2 + CSS 1)을 그대로 적용한다. 추가 DB/라이브러리 없음.

## 동작
- **추가**: 작성 폼(`.composer`) 위치에서 고스트가 떠올라 → 새로 생긴 리스트/칸반/달력 항목 위치로 **짧게 날아가** 사라지고, 도착한 항목이 살짝 팝(pop).
- **수정**: 수정 모달(`.sheet`) 위치에서 고스트가 해당 task 위치로 날아가 사라지고, 그 항목이 팝.
- 리스트·칸반·달력 **공통** (모두 `#view [data-id]` 로 도착 지점을 찾음).
- 필터/숨김으로 현재 뷰에 항목이 안 보이면 고스트 없이 조용히 패스(graceful).
- 길이 0.4s, `cubic-bezier(.4,0,.2,1)`.

---

## 적용 지점 1 — 헬퍼 함수 추가 (`add()` 함수 바로 위, line ~628 근처에 삽입)
```js
  // 폼/모달 → 도착한 task로 고스트가 날아가는 짧은 애니메이션
  function flyToTaskRect(sr,id){
    if(!sr||!sr.width)return;
    const target=$("view").querySelector('[data-id="'+id+'"]');
    if(!target)return;
    const e=target.getBoundingClientRect();
    if(!e.width)return;
    const ghost=document.createElement("div");
    ghost.style.cssText="position:fixed;left:0;top:0;z-index:1000;pointer-events:none;border-radius:14px;background:var(--accent);opacity:.16;"
      +"width:"+sr.width+"px;height:"+sr.height+"px;transform:translate("+sr.left+"px,"+sr.top+"px);"
      +"transition:transform .4s cubic-bezier(.4,0,.2,1),width .4s cubic-bezier(.4,0,.2,1),height .4s cubic-bezier(.4,0,.2,1),opacity .4s ease";
    document.body.appendChild(ghost);
    ghost.getBoundingClientRect(); // reflow 강제
    ghost.style.transform="translate("+e.left+"px,"+e.top+"px)";
    ghost.style.width=e.width+"px";ghost.style.height=e.height+"px";ghost.style.opacity="0";
    target.classList.add("just-landed");
    setTimeout(function(){ghost.remove();target.classList.remove("just-landed");},440);
  }
```

## 적용 지점 2 — `add()` 끝부분 교체 (line ~637-638)
**기존:**
```js
    tasks.push({id:uid(),title:title,body:body,start:cRange.start,end:cRange.end,startTime:cRange.startTime,endTime:cRange.endTime,pri:cPri.get(),done:false,incHol:cIncHol,notify:true,notifyTime:cNotifyTF.get(),confirms:[],created:Date.now(),history:[]});
    requestNotiPerm();clearComposer();$("tTitle").focus();save();render();
```
**교체:**
```js
    const newId=uid();
    tasks.push({id:newId,title:title,body:body,start:cRange.start,end:cRange.end,startTime:cRange.startTime,endTime:cRange.endTime,pri:cPri.get(),done:false,incHol:cIncHol,notify:true,notifyTime:cNotifyTF.get(),confirms:[],created:Date.now(),history:[]});
    const sr=document.querySelector(".composer").getBoundingClientRect();
    requestNotiPerm();clearComposer();$("tTitle").focus();save();render();
    requestAnimationFrame(function(){flyToTaskRect(sr,newId);});
```

## 적용 지점 3 — `saveEdit()` 끝부분 교체 (line ~814)
**기존:**
```js
    save();render();closeEdit();toast(anyChanged?"수정 내용을 저장했어요":"변경사항이 없습니다");
```
**교체:**
```js
    const sr=$("editModal").querySelector(".sheet").getBoundingClientRect();
    save();render();closeEdit();
    requestAnimationFrame(function(){flyToTaskRect(sr,t.id);});
    toast(anyChanged?"수정 내용을 저장했어요":"변경사항이 없습니다");
```

## 적용 지점 4 — CSS (globals.css 끝에 추가)
```css
/* ===== 생성/수정 착지 팝 ===== */
@keyframes landPop{0%{opacity:.4;transform:scale(.97)}55%{opacity:1;transform:scale(1.012)}100%{transform:scale(1)}}
.just-landed{animation:landPop .4s var(--ease)}
.cv-bar.just-landed{animation:landPop .4s var(--ease)} /* 달력 바: left/top과 분리된 transform이라 안전 */
```

---

## 컨펌(“애니메이션 적용해” 또는 “대시보드랑 같이 적용해”) 주시면 위 4곳 적용 + 빌드 검증.
조정 옵션: 속도(0.4s↔0.25s), 고스트 색/투명도, 팝 강도, 특정 뷰만 적용 등.
