# 대시보드 — 구현 완료(스테이징) · 승인 시 적용

> 작업 세션 방해 방지를 위해 **라이브 파일에 아직 반영하지 않음.**
> 승인하면 아래 5개 지점을 그대로 적용한다. (추가 DB/라이브러리 없음)

## 무엇이 들어가나 (뷰 탭 "대시보드" 신설)
- **진행 현황**: 완료율 링 + 전체/진행중/완료 수
- **마감 임박**: D-day 가까운 5개(클릭 → 수정)
- **상태 분포**: 시작전/진행중/완료/Drop 막대
- **우선순위(진행 중)**: 높음/중간/낮음 막대
- **올해 연차**: 남은 연차 + 사용 게이지
- **최근 추가**: 최근 5개
- 토스 카드 그리드(반응형), 다크모드 대응. 기본 뷰는 그대로 리스트(대시보드는 탭 클릭 시).

---

## 적용 지점 1 — viewSeg에 탭 추가 (SHELL)
`<div class="seg" id="viewSeg">` 안 맨 앞에 추가:
```html
<button data-v="dash">대시보드</button>
```
(기존 `<button class="on" data-v="list">리스트</button>` 앞에)

## 적용 지점 2 — render() 분기
```js
function render(){updateStats();paintLeaveBtn();updateControls();if(viewMode==="kanban")renderKanban();else if(viewMode==="calendar")renderCalendarView();else if(viewMode==="dash")renderDashboard();else renderListCards();}
```

## 적용 지점 3 — updateControls()에서 dash는 컨트롤 숨김
`updateControls` 안, isList 계산 다음에:
```js
const isDash=viewMode==="dash";
if(isDash){$("filterSeg").style.display="none";$("listLayoutSeg").style.display="none";$("sortBtn").style.display="none";$("listHideBtn").style.display="none";$("timeBtn").style.display="none";$("calNav").style.display="none";}
```
(맨 끝 return 직전에 추가하면 됨)

## 적용 지점 4 — renderDashboard() 함수 추가 (renderListCards 근처)
```js
function renderDashboard(){
  const total=tasks.length,done=tasks.filter(t=>t.done).length,active=total-done;
  const pct=total?Math.round(done/total*100):0;const C=2*Math.PI*30,off=C*(1-pct/100);
  const st={todo:0,doing:0,done:0,drop:0};tasks.forEach(t=>{st[classify(t)]++;});
  const stMax=Math.max(1,st.todo,st.doing,st.done,st.drop);
  const pr={high:0,mid:0,low:0};tasks.forEach(t=>{if(!t.done)pr[t.pri]=(pr[t.pri]||0)+1;});
  const prMax=Math.max(1,pr.high,pr.mid,pr.low);
  const up=tasks.filter(t=>!t.done&&refDate(t)).sort((a,b)=>diffDays(todayISO(),refDate(a))-diffDays(todayISO(),refDate(b))).slice(0,5);
  const lu=leaveUsed(leaveYear()),lr=LEAVE_HOURS-lu,lpct=Math.min(100,Math.round(lu/LEAVE_HOURS*100));
  const rc=tasks.slice().sort((a,b)=>b.created-a.created).slice(0,5);
  function bar(label,n,max,cls){return '<div class="db-bar"><span class="db-bl">'+label+'</span><span class="db-bt"><span class="db-bf '+(cls||"")+'" style="width:'+(n/max*100)+'%"></span></span><span class="db-bn">'+n+'</span></div>';}
  let h='<div class="dash">';
  h+='<div class="dcard dcard-hero"><div class="dc-h">진행 현황</div><div class="dhero"><svg width="96" height="96" viewBox="0 0 72 72"><circle cx="36" cy="36" r="30" fill="none" stroke="var(--line)" stroke-width="7"></circle><circle cx="36" cy="36" r="30" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 36 36)"></circle><text x="36" y="41" text-anchor="middle" font-size="16" font-weight="700" fill="var(--ink)">'+pct+'%</text></svg><div class="dhero-n"><div><b>'+total+'</b> 전체</div><div><b>'+active+'</b> 진행 중</div><div><b>'+done+'</b> 완료</div></div></div></div>';
  h+='<div class="dcard"><div class="dc-h">마감 임박</div>'+(up.length?up.map(function(t){const di=dueInfo(refDate(t));return '<div class="drow" data-act="e" data-id="'+t.id+'"><span class="dr-t">'+esc(t.title)+'</span><span class="dday'+(di&&di.cls?" "+di.cls:"")+'">'+(di?di.label:"")+'</span></div>';}).join(""):'<div class="dempty">예정된 마감이 없어요</div>')+'</div>';
  h+='<div class="dcard"><div class="dc-h">상태 분포</div>'+bar("시작전",st.todo,stMax)+bar("진행 중",st.doing,stMax,"b-doing")+bar("완료",st.done,stMax,"b-done")+bar("Drop",st.drop,stMax,"b-drop")+'</div>';
  h+='<div class="dcard"><div class="dc-h">우선순위 · 진행 중</div>'+bar("높음",pr.high,prMax,"b-high")+bar("중간",pr.mid,prMax)+bar("낮음",pr.low,prMax,"b-low")+'</div>';
  h+='<div class="dcard"><div class="dc-h">올해 연차</div><div class="dleave"><div class="dl-big">'+hToDays(lr)+' 남음</div><div class="dl-sub">사용 '+hToDays(lu)+' · 총 '+LEAVE_DAYS+'일</div><div class="db-bt big"><span class="db-bf b-leave" style="width:'+lpct+'%"></span></div></div></div>';
  h+='<div class="dcard"><div class="dc-h">최근 추가</div>'+(rc.length?rc.map(function(t){return '<div class="drow" data-act="e" data-id="'+t.id+'"><span class="dr-t">'+esc(t.title)+'</span><span class="pri">'+priIcon(t.pri)+'</span></div>';}).join(""):'<div class="dempty">아직 없어요</div>')+'</div>';
  h+='</div>';
  $("view").innerHTML=h;
}
```
(클릭 시 수정은 기존 `#view` click 위임 핸들러의 `data-act="e"`가 처리)

## 적용 지점 5 — CSS (globals.css 끝에 추가)
```css
/* ===== 대시보드 ===== */
.dash{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;animation:fadeUp .2s var(--ease)}
@media(max-width:900px){.dash{grid-template-columns:repeat(2,1fr)}}
@media(max-width:560px){.dash{grid-template-columns:1fr}}
.dcard{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px;min-width:0}
.dcard-hero{grid-column:span 1}
.dc-h{font-size:12px;font-weight:700;color:var(--soft);letter-spacing:.02em;margin-bottom:12px}
.dhero{display:flex;align-items:center;gap:16px}
.dhero-n{display:flex;flex-direction:column;gap:4px;font-size:13px;color:var(--ink2)}
.dhero-n b{font-size:17px;font-weight:700;color:var(--ink);margin-right:4px}
.drow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-top:1px solid var(--line2);cursor:pointer}
.drow:first-of-type{border-top:none}
.dr-t{font-size:13.5px;color:var(--ink);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0}
.drow:hover .dr-t{color:var(--accent)}
.dempty{color:var(--faint);font-size:13px;padding:14px 0;text-align:center}
.db-bar{display:flex;align-items:center;gap:9px;margin:7px 0}
.db-bl{font-size:12.5px;color:var(--ink2);width:48px;flex-shrink:0}
.db-bt{flex:1;height:9px;background:var(--line2);border-radius:99px;overflow:hidden}
.db-bt.big{height:11px;margin-top:8px}
.db-bf{display:block;height:100%;background:var(--g-mid);border-radius:99px;transition:width .4s var(--ease)}
.db-bf.b-doing{background:var(--accent)} .db-bf.b-done{background:var(--g-weak)} .db-bf.b-drop{background:var(--danger)}
.db-bf.b-high{background:#3E4757} .db-bf.b-low{background:var(--g-weak)} .db-bf.b-leave{background:var(--accent)}
.db-bn{font-size:12.5px;font-weight:700;color:var(--ink2);width:20px;text-align:right;flex-shrink:0}
.dleave .dl-big{font-size:18px;font-weight:700;color:var(--accent)}
.dleave .dl-sub{font-size:12px;color:var(--soft);margin-top:3px}
```

---

## 컨펌만 주시면 위 5곳 적용 + 빌드 검증하겠습니다.
조정 옵션: 카드 더/덜, 차트 색, 대시보드를 기본 첫 화면으로 할지 등.
