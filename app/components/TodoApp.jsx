"use client";

import { useEffect } from "react";

// 참고 앱(REFERENCE/index.html)의 <body> 마크업을 이식 + 신규 기능 마크업.
// JSX 변환 없이 원본 HTML을 유지하기 위해 dangerouslySetInnerHTML 사용.
const SHELL_HTML = `
<div class="wrap">
  <header>
    <div>
      <div class="kicker">MY TASKS</div>
      <h1>오늘의 할 일</h1>
      <div class="date" id="today"></div>
    </div>
    <div class="head-actions">
      <button class="hbtn" id="leaveBtn" title="연차 관리" aria-label="연차"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M12 21V11"/><path d="M5 11a7 7 0 0114 0z"/></svg></button>
      <button class="hbtn" id="bellBtn" title="알림" aria-label="알림"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg><span class="tbadge" id="bellCount" style="display:none">0</span></button>
      <button class="hbtn" id="themeBtn" title="다크/라이트 모드" aria-label="테마 전환"></button>
      <button class="hbtn" id="trashBtn" title="휴지통" aria-label="휴지통"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg><span class="tbadge" id="trashCount" style="display:none">0</span></button>
    </div>
  </header>

  <div class="composer">
    <div class="flabel">제목<button class="fhelp" type="button" aria-label="도움말" data-help="제목"><i>?</i><span class="fhelp-tip">할 일의 이름이에요. 한눈에 알아볼 수 있게 짧게 적어주세요. 입력 후 Enter를 누르면 내용으로 이동해요.</span></button></div>
    <input type="text" id="tTitle" class="title-in" placeholder="제목을 입력하세요" autocomplete="off">
    <div class="flabel">내용 <span class="flabel-hint">체크리스트로 단계(중간컨펌)도 작성하세요</span><button class="fhelp" type="button" aria-label="도움말" data-help="내용"><i>?</i><span class="fhelp-tip">상세 내용을 자유롭게 작성해요. 슬래시(/)로 블록 메뉴를 열고, 마크다운 단축키(#, -, 1., [], &gt; 등)를 쓸 수 있어요. 느낌표(!)+스페이스로 n차 컨펌을 추가하면 날짜는 숫자만 입력해도 자동 정리돼요.</span></button></div>
    <div class="editor" id="editor" contenteditable="true"></div>
    <div class="slash" id="slash"></div>
    <div class="flabel">기간 · 시간<button class="fhelp" type="button" aria-label="도움말" data-help="기간 · 시간"><i>?</i><span class="fhelp-tip">시작일·마감일과 시작/마감 시간을 골라요. 하루 일정은 시작과 마감을 같은 날로 두면 돼요. 마감일을 기준으로 D-day가 표시돼요.</span></button></div>
    <div class="rangefield" id="rangeField">
      <span class="dl"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>시작 ~ 마감</span>
      <span class="rv empty" id="rangeText">날짜와 시간 선택</span>
    </div>
    <div class="flabel">우선순위<button class="fhelp" type="button" aria-label="도움말" data-help="우선순위"><i>?</i><span class="fhelp-tip">높음·중간·낮음으로 중요도를 정해요. 상단의 우선순위 보기를 켜면 같은 우선순위끼리 묶어서 볼 수 있어요.</span></button></div>
    <div class="prad-group" id="priGroup"></div>
    <div class="flabel">추가 기능<button class="fhelp" type="button" aria-label="도움말" data-help="추가 기능"><i>?</i><span class="fhelp-tip">공휴일·주말 포함은 기간에 주말과 공휴일을 넣을지 정하고 달력 표시에 반영돼요. 마감일 알림은 마감일에 받을 알림 시각을 설정해요.</span></button></div>
    <div class="opt-row">
      <button class="swrow inchol-row" id="incHolBtn" type="button"><span class="swlbl">공휴일·주말 포함</span><span class="switch" id="incHolSw"><span class="knob"></span></span></button>
      <div class="notify-row">
        <span class="notify-lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>마감일 알림</span>
        <span class="tf" id="notifyTimeField"></span>
      </div>
    </div>
    <div class="bottom-row">
      <span class="spacer"></span>
      <button class="resetbtn" id="resetBtn">초기화</button>
      <button class="addbtn" id="addBtn">추가</button>
    </div>
  </div>

  <div class="controls">
    <div class="seg" id="viewSeg">
      <button class="on" data-v="list">리스트</button>
      <button data-v="kanban">칸반</button>
      <button data-v="calendar">달력</button>
      <button data-v="dash">대시보드</button>
    </div>
    <span class="spacer"></span>
    <div class="seg icon-seg" id="listLayoutSeg" style="display:none">
      <button class="on" data-ll="rows" title="리스트형"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg></button>
      <button data-ll="cards" title="카드형"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg></button>
    </div>
    <button class="sorticon" id="sortBtn" title="정렬"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/></svg><span class="sortdot" id="sortDot"></span></button>
    <button class="swrow listhide" id="priGroupBtn"><span class="swlbl">우선순위 보기</span><span class="switch" id="priGroupSw"><span class="knob"></span></span></button>
    <button class="swrow listhide" id="listHideBtn"><span class="swlbl">완료 보기</span><span class="switch" id="listHideSw"><span class="knob"></span></span></button>
    <div class="calnav" id="calNav" style="display:none">
      <div class="seg" id="calModeSeg">
        <button data-cm="day">일</button><button data-cm="week">주</button><button class="on" data-cm="month">월</button>
      </div>
      <button class="cnbtn" data-cn="-1" title="이전">‹</button><span class="ctitle" id="calTitle"></span><button class="cnbtn" data-cn="1" title="다음">›</button>
    </div>
  </div>

  <div class="sortpop" id="sortPop">
    <div class="sortpop-sb"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-3.5-3.5"/></svg><input type="text" id="sortSearch" placeholder="정렬 기준" autocomplete="off"></div>
    <div class="sortpop-list" id="sortList"></div>
    <button class="sortpop-reset" id="sortReset"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/></svg>정렬 초기화</button>
  </div>

  <div class="overlay" id="helpModal">
    <div class="sheet helpsheet">
      <div class="mh"><h3 id="hmTitle">도움말</h3><button class="mx" title="닫기" id="hmClose">×</button></div>
      <p class="help-body" id="hmBody"></p>
      <div class="m-actions"><button class="btn-primary" id="hmDone">확인</button></div>
    </div>
  </div>

  <div id="view"></div>

  <footer>
    <div class="foot-inner">
      <span id="summary">아직 할 일이 없어요</span>
      <button class="relbtn" id="relBtn"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>릴리즈 내역 <span id="verLabel" class="verbadge">v1.0.0</span></button>
    </div>
  </footer>
</div>

<div class="overlay" id="editModal">
  <div class="sheet">
    <div class="mh"><h3>할 일 수정</h3><button class="mx" title="닫기" id="emClose">×</button></div>
    <button class="donerow" id="emDone" type="button"><span class="dchk"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M20 6L9 17l-5-5"/></svg></span><span id="emDoneLbl">완료로 표시</span></button>
    <div class="flabel">제목</div>
    <input type="text" id="emTitle" class="title-in" placeholder="제목을 입력하세요" autocomplete="off" style="margin-bottom:0;border:1px solid var(--line);padding:10px 12px;font-size:15px;font-weight:600;border-radius:10px">
    <div class="flabel">내용 <span class="flabel-hint">체크리스트로 단계(중간컨펌)도 작성하세요</span></div>
    <div class="editor" id="emEditor" contenteditable="true"></div>
    <div class="slash" id="emSlash"></div>
    <div class="flabel">기간 · 시간</div>
    <div class="rangefield" id="emRangeField">
      <span class="dl"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>시작 ~ 마감</span>
      <span class="rv empty" id="emRangeText">날짜와 시간 선택</span>
    </div>
    <div class="flabel">우선순위</div>
    <div class="prad-group" id="emPriGroup"></div>
    <div class="opt-row">
      <button class="swrow inchol-row" id="emIncHolBtn" type="button"><span class="swlbl">공휴일·주말 포함</span><span class="switch" id="emIncHolSw"><span class="knob"></span></span></button>
      <div class="notify-row">
        <span class="notify-lbl"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0"/></svg>마감일 알림</span>
        <span class="tf" id="emNotifyTimeField"></span>
      </div>
    </div>
    <div class="m-actions">
      <button class="logopen" id="emLogBtn" style="display:none"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>수정 로그</button>
      <button class="btn-ghost" id="emCancel">취소</button>
      <button class="btn-primary" id="emSave">저장</button>
    </div>
  </div>
</div>

<div class="overlay" id="logModal">
  <div class="sheet logsheet">
    <div class="mh"><h3>수정 로그</h3><button class="mx" title="닫기" id="lmClose">×</button></div>
    <div class="logwrap"><div class="logleft" id="logList"></div><div class="logright" id="logPreview"></div></div>
  </div>
</div>

<div class="overlay" id="confirmModal">
  <div class="sheet confirmsheet">
    <h3 id="cfTitle">삭제할까요?</h3>
    <p id="cfBody">되돌릴 수 없어요.</p>
    <div class="m-actions"><button class="btn-ghost" id="cfCancel">취소</button><button class="btn-danger" id="cfOk">확인</button></div>
  </div>
</div>

<div class="overlay" id="resetModal">
  <div class="sheet confirmsheet">
    <h3>작성 내용을 초기화할까요?</h3>
    <p>제목·내용·기간·우선순위가 모두 지워져요.</p>
    <div class="m-actions"><button class="btn-ghost" id="rsCancel">취소</button><button class="btn-danger" id="rsOk">초기화</button></div>
  </div>
</div>

<div class="overlay" id="trashModal">
  <div class="sheet">
    <div class="mh"><h3>휴지통</h3><button class="mx" title="닫기" id="tmClose">×</button></div>
    <div id="trashList" class="trashlist"></div>
    <div class="m-actions"><button class="btn-ghost" id="trashEmpty">전체 비우기</button><button class="btn-primary" id="tmDone">닫기</button></div>
  </div>
</div>

<div class="overlay" id="relModal">
  <div class="sheet relsheet">
    <div class="mh"><h3>릴리즈 내역</h3><button class="mx" title="닫기" id="relClose">×</button></div>
    <div id="relList" class="rellist"></div>
    <div class="m-actions"><button class="btn-primary" id="relDone">닫기</button></div>
  </div>
</div>

<div class="overlay" id="leaveModal">
  <div class="sheet lvsheet">
    <div class="mh"><h3>연차 관리</h3><button class="mx" title="닫기" id="lvClose">×</button></div>
    <div class="lv-summary" id="lvSummary"></div>
    <div class="flabel">연차 추가</div>
    <div class="rangefield lv-rf" id="lvRangeField">
      <span class="dl"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>사용 날짜 (주말·공휴일 제외)</span>
      <span class="rv empty" id="lvRangeText">날짜 선택</span>
    </div>
    <div class="seg lv-typeseg" id="lvType">
      <button class="on" data-t="full">하루 종일</button>
      <button data-t="am">오전 반차</button>
      <button data-t="pm">오후 반차</button>
      <button data-t="hour">시간차</button>
    </div>
    <div class="lv-hoursel" id="lvHourSel" style="display:none">
      <button class="on" data-hh="2">2시간</button>
      <button data-hh="6">6시간</button>
    </div>
    <div class="lv-info" id="lvInfo">날짜를 선택하세요</div>
    <button class="btn-primary lv-add" id="lvAddBtn">연차 추가</button>
    <div class="flabel">사용 내역 <span id="lvYear" class="lv-yr"></span></div>
    <div id="lvList" class="trashlist"></div>
    <div class="m-actions"><button class="btn-primary" id="lvDone">닫기</button></div>
  </div>
</div>

<div class="overlay" id="notiModal">
  <div class="sheet">
    <div class="mh"><h3>알림</h3><button class="mx" title="닫기" id="nmClose">×</button></div>
    <div id="notiList" class="trashlist"></div>
    <div class="m-actions"><button class="btn-ghost" id="notiClear">모두 지우기</button><button class="btn-primary" id="nmDone">닫기</button></div>
  </div>
</div>

<div id="toasts"></div>
`;

export default function TodoApp() {
  useEffect(() => {
    const controller = new AbortController();
    const created = [];
    runApp(controller.signal, created);
    return () => {
      controller.abort();
      created.forEach((n) => { try { n.remove(); } catch {} });
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: SHELL_HTML }} />;
}

// ── 앱 로직 ──────────────────────────────────────────────────────────
function runApp(signal, created) {
  const KEY="careid_todos", TKEY="careid_trash", LVKEY="careid_leaves", VKEY="careid_view", LKEY="careid_layout", THKEY="careid_theme", CMKEY="careid_calmode";
  const apiUrl=(k)=> k===KEY?"/api/tasks": k===TKEY?"/api/trash": k===LVKEY?"/api/leaves": null;
  const store = {
    async get(k) {
      const url=apiUrl(k);
      if (url) {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) throw new Error("load failed");
          const arr = await res.json();
          return { value: JSON.stringify(Array.isArray(arr) ? arr : []) };
        } catch (e) { return null; }
      }
      try { const v = localStorage.getItem(k); return v != null ? { value: v } : null; } catch (e) { return null; }
    },
    async set(k, v) {
      const url=apiUrl(k);
      if (url) {
        try { await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: v }); } catch (e) {}
        return;
      }
      try { localStorage.setItem(k, v); } catch (e) {}
    }
  };
  const LEAVE_DAYS=15.5, LEAVE_HOURS=124; // 15일 + 생일반차 0.5일
  let tasks=[], trash=[], leaves=[], filter="all", sortBy="created", viewMode="list", listLayout="rows", editingId=null,
      cardsExpanded=false, listHideDone=true, priGroup=false, showTime=false, calMode="month", calRef=null, calDays="all", calHideDone=true, theme="light",
      lvType="full", lvHourVal=2, lvRange={start:null,end:null};
  const $=id=>document.getElementById(id);

  function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
  // 레이아웃/뷰 설정 DB 저장·로드 (정렬·우선순위 보기·완료 보기·달력 모드 등)
  function curSettings(){return {sortBy:sortBy,priGroup:priGroup,listHideDone:listHideDone,calMode:calMode,calDays:calDays,calHideDone:calHideDone,listLayout:listLayout,viewMode:viewMode};}
  async function saveSettings(){ try{ await fetch("/api/settings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(curSettings())}); }catch(e){} }
  async function loadSettings(){ try{ const r=await fetch("/api/settings",{cache:"no-store"}); if(!r.ok)return; const s=await r.json(); if(!s||typeof s!=="object")return;
    if(typeof s.sortBy==="string")sortBy=s.sortBy;
    if(typeof s.priGroup==="boolean")priGroup=s.priGroup;
    if(typeof s.listHideDone==="boolean")listHideDone=s.listHideDone;
    if(["day","week","month"].indexOf(s.calMode)>=0)calMode=s.calMode;
    if(["all","weekday"].indexOf(s.calDays)>=0)calDays=s.calDays;
    if(typeof s.calHideDone==="boolean")calHideDone=s.calHideDone;
    if(["rows","cards"].indexOf(s.listLayout)>=0)listLayout=s.listLayout;
    if(["list","kanban","calendar","dash"].indexOf(s.viewMode)>=0)viewMode=s.viewMode;
  }catch(e){} }
  async function save(){ try{ await store.set(KEY, JSON.stringify(tasks)); }catch(e){} }
  async function saveTrash(){ try{ await store.set(TKEY, JSON.stringify(trash)); }catch(e){} }
  async function saveView(){ try{ await store.set(VKEY, viewMode); }catch(e){} }
  async function saveLayout(){ try{ await store.set(LKEY, listLayout); }catch(e){} }

  function normTask(t){return {id:t.id||uid(),title:t.title||"",body:t.body||"",start:t.start||null,end:t.end||t.due||null,startTime:t.startTime||"09:00",endTime:t.endTime||"18:00",pri:t.pri||"mid",done:!!t.done,incHol:!!t.incHol,notify:(t.notify===false?false:true),notifyTime:t.notifyTime||"09:00",notifyLead:(t.notifyLead==null?10:Number(t.notifyLead)),created:t.created||Date.now(),history:Array.isArray(t.history)?t.history:[],confirms:Array.isArray(t.confirms)?t.confirms.map(c=>({id:c.id||uid(),date:c.date||"",label:c.label||"",done:!!c.done})):[]};}

  async function load(){
    try{ const rv=await store.get(VKEY); if(rv&&rv.value){ if(rv.value==="card"){viewMode="list";listLayout="cards";} else if(["list","kanban","calendar"].indexOf(rv.value)>=0){viewMode=rv.value;} } }catch(e){}
    try{ const rl=await store.get(LKEY); if(rl&&rl.value&&["rows","cards"].indexOf(rl.value)>=0)listLayout=rl.value; }catch(e){}
    try{ const cm=await store.get(CMKEY); if(cm&&cm.value&&["day","week","month"].indexOf(cm.value)>=0)calMode=cm.value; }catch(e){}
    await loadSettings();
    syncViewSeg();syncLayoutSeg();syncCalModeSeg();syncLayoutToggles();
    try{ const r=await store.get(KEY); if(r&&r.value){ tasks=JSON.parse(r.value).map(normTask); } }catch(e){}
    try{ const rt=await store.get(TKEY); if(rt&&rt.value){ trash=JSON.parse(rt.value).map(x=>Object.assign(normTask(x),{deletedAt:x.deletedAt||0})); } }catch(e){}
    try{ const rl=await store.get(LVKEY); if(rl&&rl.value){ leaves=JSON.parse(rl.value).map(x=>({id:x.id||uid(),date:x.date,hours:Number(x.hours)||0,created:x.created||Date.now()})).filter(x=>x.date); } }catch(e){}
    render();checkNoti();
  }
  async function saveLeaves(){ try{ await store.set(LVKEY, JSON.stringify(leaves)); }catch(e){} }

  function pad(n){return String(n).padStart(2,"0");}
  function ymd(d){return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());}
  function todayISO(){return ymd(new Date());}
  function fmtMD(iso){const p=iso.split("-");return (+p[1])+"/"+(+p[2]);}
  function toMin(hhmm){if(!hhmm)return 0;const p=hhmm.split(":");return (+p[0])*60+(+p[1]||0);}
  function labelRangeT(s,e,st,et){
    if(!s&&!e)return null; st=st||"09:00"; et=et||"18:00";
    if(s&&e){ if(s===e) return fmtMD(s)+" "+st+"~"+et; return fmtMD(s)+" "+st+" → "+fmtMD(e)+" "+et; }
    if(s)return fmtMD(s)+" "+st+" ~";
    return "~ "+fmtMD(e)+" "+et;
  }
  function diffDays(a,b){const da=new Date(a+"T00:00:00"),db=new Date(b+"T00:00:00");return Math.round((db-da)/86400000);}
  function dueInfo(due){if(!due)return null;const d=diffDays(todayISO(),due);if(d<0)return{cls:"ov",label:(-d)+"일 지남"};if(d===0)return{cls:"td0",label:"오늘 마감"};if(d<=3)return{cls:"soon",label:"D-"+d};return{cls:"",label:"D-"+d};}
  function refDate(t){return t.end||t.start||null;}
  const priTxt={high:"높음",mid:"중간",low:"낮음"};

  const HOLIDAYS={
    "2025-01-01":"신정","2025-01-27":"임시공휴일","2025-01-28":"설날","2025-01-29":"설날","2025-01-30":"설날",
    "2025-03-01":"삼일절","2025-03-03":"대체공휴일","2025-05-05":"어린이날·부처님오신날","2025-05-06":"대체공휴일",
    "2025-06-03":"대통령선거","2025-06-06":"현충일","2025-08-15":"광복절","2025-10-03":"개천절",
    "2025-10-05":"추석","2025-10-06":"추석","2025-10-07":"추석","2025-10-08":"대체공휴일","2025-10-09":"한글날","2025-12-25":"성탄절",
    "2026-01-01":"신정","2026-02-16":"설날","2026-02-17":"설날","2026-02-18":"설날",
    "2026-03-01":"삼일절","2026-03-02":"대체공휴일","2026-05-05":"어린이날","2026-05-24":"부처님오신날","2026-05-25":"대체공휴일",
    "2026-06-03":"지방선거","2026-06-06":"현충일","2026-08-15":"광복절","2026-08-17":"대체공휴일",
    "2026-09-24":"추석","2026-09-25":"추석","2026-09-26":"추석","2026-10-03":"개천절","2026-10-05":"대체공휴일","2026-10-09":"한글날","2026-12-25":"성탄절",
    "2027-01-01":"신정","2027-03-01":"삼일절","2027-05-05":"어린이날","2027-06-06":"현충일","2027-08-15":"광복절","2027-10-03":"개천절","2027-10-09":"한글날","2027-12-25":"성탄절"
  };
  function isHoliday(iso){return !!HOLIDAYS[iso];}
  function isExcludedDay(iso){const d=new Date(iso+"T00:00:00");const dow=d.getDay();return dow===0||dow===6||isHoliday(iso);}

  function classify(t){
    if(t.done)return "done";
    const today=todayISO(),s=t.start,e=t.end;
    if(e&&today>e)return "drop";
    if(s&&today<s)return "todo";
    if(s&&e&&today>=s&&today<=e)return "doing";
    if(s&&!e)return today<s?"todo":"doing";
    if(!s&&e)return today>e?"drop":"doing";
    return "todo";
  }
  // 완료 토글 시 순서가 바뀌지 않도록 done 우선 정렬 제거 (#17)
  const SORT_OPTS=[{k:"created",label:"등록순"},{k:"due",label:"마감 임박순"},{k:"title",label:"이름순"},{k:"pri",label:"우선순위순"},{k:"start",label:"시작일순"}];
  function sortLabel(k){const o=SORT_OPTS.find(x=>x.k===k);return o?o.label:"등록순";}
  function sortT(arr){const prr={high:0,mid:1,low:2};return arr.slice().sort(function(a,b){
    if(sortBy==="due"){const ra=refDate(a),rb=refDate(b);if(ra&&rb){const dd=diffDays(todayISO(),ra)-diffDays(todayISO(),rb);if(dd)return dd;}else if(ra)return -1;else if(rb)return 1;const p=prr[a.pri]-prr[b.pri];if(p)return p;return a.created-b.created;}
    if(sortBy==="title"){const t=(a.title||"").localeCompare(b.title||"","ko");if(t)return t;return a.created-b.created;}
    if(sortBy==="pri"){const p=prr[a.pri]-prr[b.pri];if(p)return p;return b.created-a.created;}
    if(sortBy==="start"){const sa=a.start||a.end,sb=b.start||b.end;if(sa&&sb){if(sa<sb)return -1;if(sa>sb)return 1;}else if(sa)return -1;else if(sb)return 1;return b.created-a.created;}
    return b.created-a.created;
  });}

  function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function inlineMd(s){ s=esc(s); s=s.replace(/~~([^~]+)~~/g,"<del>$1</del>"); s=s.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"); s=s.replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<em>$2</em>"); s=s.replace(/`([^`]+)`/g,"<code>$1</code>"); return s; }
  function splitRow(line){return line.replace(/^\s*\|/,"").replace(/\|\s*$/,"").split("|").map(s=>s.trim());}
  // 중첩 리스트 파싱: 들여쓰기(2칸=1단계) 기반
  function listLineInfo(s){let m;
    if(m=s.match(/^(\s*)-\s*\[([ xX])\]\s+(.*)$/))return {indent:Math.min(8,Math.floor(m[1].length/2)),type:"todo",checked:m[2].toLowerCase()==="x",text:m[3]};
    if(m=s.match(/^(\s*)\d+\.\s+(.*)$/))return {indent:Math.min(8,Math.floor(m[1].length/2)),type:"ol",text:m[2]};
    if(m=s.match(/^(\s*)[-*]\s+(.*)$/))return {indent:Math.min(8,Math.floor(m[1].length/2)),type:"ul",text:m[2]};
    return null;
  }
  function listToHtml(items){
    function openTag(t){return t==="ol"?"<ol>":t==="todo"?'<ul class="mdtodo">':"<ul>";}
    function closeTag(t){return t==="ol"?"</ol>":"</ul>";}
    function liOpen(it){if(it.type==="todo")return '<li class="'+(it.checked?"ck":"")+'"><span class="tbx">'+(it.checked?"✓":"")+'</span><span>'+inlineMd(it.text)+'</span>';return "<li>"+inlineMd(it.text);}
    let html="";const stack=[];
    for(let idx=0;idx<items.length;idx++){const it=items[idx];const lvl=it.indent;
      if(lvl+1>stack.length){ while(stack.length<lvl+1){html+=openTag(it.type);stack.push(it.type);} }
      else { html+="</li>"; while(stack.length>lvl+1){html+=closeTag(stack.pop());html+="</li>";} if(stack[stack.length-1]!==it.type){html+=closeTag(stack.pop());html+=openTag(it.type);stack.push(it.type);} }
      html+=liOpen(it);
    }
    html+="</li>";while(stack.length){html+=closeTag(stack.pop());if(stack.length)html+="</li>";}
    return html;
  }
  function mdToHtml(src){ if(!src||!src.trim())return""; const L=src.replace(/\r/g,"").split("\n"); let html="",i=0,m;
    function isPlain(s){return !/^\s*$/.test(s)&&!/^```/.test(s)&&!/^#{1,4}\s+/.test(s)&&!/^>\s?/.test(s)&&!/^\s*[-*]\s+/.test(s)&&!/^\s*\d+\.\s+/.test(s)&&!/^(---|\*\*\*|___)\s*$/.test(s)&&!/^<!--/.test(s)&&!/^!\[/.test(s)&&!/^\s*\|.*\|\s*$/.test(s);}
    while(i<L.length){ const line=L[i];
      if(/^\s*$/.test(line)){i++;continue;}
      if(/^```/.test(line)){const code=[];i++;while(i<L.length&&!/^```/.test(L[i])){code.push(L[i]);i++;}if(i<L.length)i++;html+='<pre class="cb"><code>'+esc(code.join("\n"))+'</code></pre>';continue;}
      if(/^(---|\*\*\*|___)\s*$/.test(line)){html+="<hr>";i++;continue;}
      if(m=line.match(/^!\[[^\]]*\]\(([^)]+)\)\s*$/)){html+='<img class="mdimg" src="'+esc(m[1])+'" alt="">';i++;continue;}
      if(m=line.match(/^<!--video-->(.+)$/)){html+='<video class="mdvid" src="'+esc(m[1].trim())+'" controls></video>';i++;continue;}
      if(m=line.match(/^<!--file:([^>]*)-->(.+)$/)){html+='<a class="mdfile" href="'+esc(m[2].trim())+'" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>'+esc(m[1]||"파일")+'</a>';i++;continue;}
      if(m=line.match(/^<!--callout-->(.*)$/)){html+='<div class="mdcallout"><span class="ci">💡</span><div>'+inlineMd(m[1])+'</div></div>';i++;continue;}
      if(m=line.match(/^<!--toggle-->(.*)$/)){html+='<details class="mdtoggle"><summary>'+inlineMd(m[1])+'</summary></details>';i++;continue;}
      if(/^<!--cf[01]-->/.test(line)){const items=[];while(i<L.length){const mm=L[i].match(/^<!--cf([01])-->(.*)$/);if(!mm)break;items.push({done:mm[1]==="1",text:mm[2]});i++;}html+='<ul class="mdconfirm">'+items.map(function(it,ci){return '<li class="'+(it.done?"ck":"")+'"><span class="cfno">'+(ci+1)+'차</span><span>'+inlineMd(it.text)+'</span></li>';}).join("")+'</ul>';continue;}
      if(m=line.match(/^(#{1,4})\s+(.*)$/)){const lv=m[1].length;html+="<h"+lv+">"+inlineMd(m[2])+"</h"+lv+">";i++;continue;}
      if(/^>\s?/.test(line)){html+="<blockquote>";const q=[];while(i<L.length&&/^>\s?/.test(L[i])){q.push(inlineMd(L[i].replace(/^>\s?/,"")));i++;}html+=q.join("<br>")+"</blockquote>";continue;}
      if(/^\s*\|.*\|\s*$/.test(line)&&i+1<L.length&&/^\s*\|[-:\s|]+\|\s*$/.test(L[i+1])){const head=splitRow(line);i+=2;const body=[];while(i<L.length&&/^\s*\|.*\|\s*$/.test(L[i])){body.push(splitRow(L[i]));i++;}html+='<table class="mdtable"><thead><tr>'+head.map(c=>'<th>'+inlineMd(c)+'</th>').join("")+'</tr></thead><tbody>'+body.map(r=>'<tr>'+r.map(c=>'<td>'+inlineMd(c)+'</td>').join("")+'</tr>').join("")+'</tbody></table>';continue;}
      if(listLineInfo(line)){const items=[];while(i<L.length){const inf=listLineInfo(L[i]);if(!inf)break;items.push(inf);i++;}html+=listToHtml(items);continue;}
      const para=[];while(i<L.length&&isPlain(L[i])){para.push(inlineMd(L[i]));i++;}
      if(para.length)html+="<p>"+para.join("<br>")+"</p>"; else i++;
    } return html;
  }

  // 슬래시 메뉴 (노션 블록 전체) + 단축키 힌트 (#7)
  const CMD=[
    {type:'p',label:'텍스트',desc:'일반 본문',kw:'text 텍스트 본문 paragraph p',ic:'T',sc:''},
    {type:'h1',label:'제목1',desc:'큰 제목',kw:'h1 제목 title heading 큰 머리',ic:'H1',sc:'#'},
    {type:'h2',label:'제목2',desc:'중간 제목',kw:'h2 제목 소제목 title heading',ic:'H2',sc:'##'},
    {type:'h3',label:'제목3',desc:'작은 제목',kw:'h3 제목 소제목 title heading',ic:'H3',sc:'###'},
    {type:'h4',label:'제목4',desc:'더 작은 제목',kw:'h4 제목 소제목 title heading',ic:'H4',sc:'####'},
    {type:'ul',label:'글머리 기호 목록',desc:'• 불릿 목록',kw:'ul bullet 불릿 글머리 목록 list',ic:'•',sc:'-'},
    {type:'ol',label:'번호 매기기 목록',desc:'1. 순서 있는 목록',kw:'ol number 번호 순서 목록 list',ic:'1.',sc:'1.'},
    {type:'todo',label:'할 일 목록',desc:'체크박스 목록',kw:'todo task 할일 체크박스 checkbox',ic:'☑',sc:'[]'},
    {type:'confirm',label:'중간 컨펌',desc:'1차·2차 단계 컨펌',kw:'confirm 컨펌 중간 단계 검수 컴펌',ic:'✔',sc:'!'},
    {type:'toggle',label:'토글 목록',desc:'접고 펼치는 목록',kw:'toggle 토글 접기 펼치기',ic:'▸',sc:'>'},
    {type:'callout',label:'콜아웃',desc:'강조 박스',kw:'callout 콜아웃 강조 박스 box',ic:'💡',sc:''},
    {type:'quote',label:'인용',desc:'인용 블록',kw:'quote 인용 인용구 blockquote',ic:'❝',sc:'"'},
    {type:'table',label:'표',desc:'간단한 표',kw:'table 표 grid 그리드',ic:'▦',sc:''},
    {type:'hr',label:'구분선',desc:'가로 구분선',kw:'hr divider 구분선 줄 line',ic:'—',sc:'---'},
    {type:'image',label:'이미지',desc:'업로드 또는 URL',kw:'image 이미지 사진 photo picture',ic:'🖼',sc:''},
    {type:'video',label:'동영상',desc:'업로드 또는 URL',kw:'video 동영상 영상 movie',ic:'▶',sc:''},
    {type:'code',label:'코드',desc:'코드 블록',kw:'code 코드 monospace 코드블록',ic:'</>',sc:'```'},
    {type:'file',label:'파일',desc:'업로드 또는 URL',kw:'file 파일 첨부 attachment',ic:'📎',sc:''}
  ];

  function EditorFactory(editorEl,menuEl,anchorEl){
    let menuOpen=false,slashQuery="",menuItems=[],activeIndex=0,composing=false;
    function newBlk(type){const b=document.createElement("div");b.className="blk";b.dataset.type=type||"p";if(type==="todo"||type==="confirm")b.dataset.checked="false";if(type==="confirm")b.classList.add("ph");if(type==="toggle")b.dataset.open="true";b.innerHTML="<br>";return b;}
    function reset(){editorEl.innerHTML="";editorEl.appendChild(newBlk("p"));updateEmpty();}
    function updateEmpty(){const blks=editorEl.querySelectorAll(".blk");const only=blks.length===1?blks[0]:null;const plainOnly=!only||!only.dataset.type||only.dataset.type==="p";const empty=blks.length<=1&&editorEl.textContent.trim()===""&&!editorEl.querySelector(".divider,.media,.tableblock,.codeblock")&&plainOnly;editorEl.dataset.empty=empty?"true":"false";}
    function renumber(){const counters=[];let cf=0;editorEl.querySelectorAll(".blk").forEach(function(b){const lv=parseInt(b.dataset.indent||"0",10);if(b.dataset.type==="confirm"){cf++;b.setAttribute("data-num",cf);}if(b.dataset.type==="ol"){counters[lv]=(counters[lv]||0)+1;for(let k=lv+1;k<counters.length;k++)counters[k]=0;b.setAttribute("data-num",counters[lv]);}else{for(let k=lv;k<counters.length;k++)counters[k]=0;}});}
    function setIndent(blk,n){n=Math.max(0,Math.min(8,n));if(n<=0){blk.removeAttribute("data-indent");blk.style.marginLeft="";}else{blk.dataset.indent=String(n);blk.style.marginLeft=(n*22)+"px";}}
    function currentBlock(){const s=window.getSelection();if(!s.rangeCount)return null;let n=s.anchorNode;while(n&&n!==editorEl){if(n.nodeType===1&&n.classList&&n.classList.contains("blk"))return n;n=n.parentNode;}return null;}
    function placeCaret(el,atStart){const r=document.createRange();r.selectNodeContents(el);r.collapse(!!atStart);const s=window.getSelection();s.removeAllRanges();s.addRange(r);}
    function caretAtStart(blk){const s=window.getSelection();if(!s.rangeCount)return false;const r=s.getRangeAt(0).cloneRange();const t=document.createRange();t.selectNodeContents(blk);t.setEnd(r.startContainer,r.startOffset);return t.toString().length===0;}
    function textBeforeCaret(blk){const s=window.getSelection();if(!s.rangeCount)return"";const r=s.getRangeAt(0);const t=document.createRange();t.selectNodeContents(blk);t.setEnd(r.startContainer,r.startOffset);return t.toString();}
    function insertBlockAfter(cur,type){const b=newBlk(type);if(cur&&cur.dataset.indent){b.dataset.indent=cur.dataset.indent;b.style.marginLeft=cur.style.marginLeft;}cur.after(b);placeCaret(b,true);renumber();updateEmpty();}
    function removeLeading(blk,n){let node=blk.firstChild,rem=n;while(node&&rem>0){if(node.nodeType===3){const len=node.nodeValue.length;if(len<=rem){rem-=len;const nx=node.nextSibling;node.remove();node=nx;}else{node.nodeValue=node.nodeValue.slice(rem);rem=0;}}else if(node.nodeName==="BR"){const nx=node.nextSibling;node.remove();node=nx;}else break;}}
    function makeDivider(cur){cur.dataset.type="p";cur.innerHTML="";const dv=document.createElement("div");dv.className="blk divider";dv.contentEditable="false";dv.innerHTML="<hr>";cur.replaceWith(dv);const nb=newBlk("p");dv.after(nb);placeCaret(nb,true);renumber();updateEmpty();}
    function makeCode(cur){const cb=document.createElement("div");cb.className="blk codeblock";cb.dataset.type="code";cb.textContent="";cur.replaceWith(cb);const nb=newBlk("p");cb.after(nb);placeCaret(cb,true);updateEmpty();}
    function mediaEl(mtype,src,name){const el=document.createElement("div");el.className="blk media";el.contentEditable="false";el.dataset.type=mtype;el.dataset.mtype=mtype;el.dataset.src=src||"";if(name)el.dataset.name=name;renderMedia(el);return el;}
    function renderMedia(el){const t=el.dataset.mtype,src=el.dataset.src;
      if(!src){const lbl=t==="image"?"이미지":t==="video"?"동영상":"파일";el.innerHTML='<div class="media-ph"><span class="mph-l">'+lbl+' 추가</span><span class="mph-b"><button type="button" class="mph-btn" data-mu="file">파일 업로드</button><button type="button" class="mph-btn" data-mu="url">URL</button><button type="button" class="mph-x" data-mu="del">삭제</button></span></div>';}
      else if(t==="image"){el.innerHTML='<div class="media-wrap"><img src="'+esc(src)+'" alt=""><button type="button" class="media-del" data-mu="del" title="삭제">×</button></div>';}
      else if(t==="video"){el.innerHTML='<div class="media-wrap"><video src="'+esc(src)+'" controls></video><button type="button" class="media-del" data-mu="del" title="삭제">×</button></div>';}
      else{el.innerHTML='<div class="media-file"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg><a href="'+esc(src)+'" target="_blank" rel="noopener">'+esc(el.dataset.name||"파일")+'</a><button type="button" class="media-del" data-mu="del" title="삭제">×</button></div>';}
    }
    function makeMedia(cur,mtype){const el=mediaEl(mtype,"","");cur.replaceWith(el);const nb=newBlk("p");el.after(nb);placeCaret(nb,true);updateEmpty();}
    function tableEl(rows){const wrap=document.createElement("div");wrap.className="blk tableblock";wrap.contentEditable="false";let h='<table><tbody>';rows.forEach(function(r,ri){h+='<tr>';r.forEach(function(c){const tag=ri===0?"th":"td";h+='<'+tag+' contenteditable="true">'+esc(c)+'</'+tag+'>';});h+='</tr>';});h+='</tbody></table>';wrap.innerHTML=h;return wrap;}
    function makeTable(cur){const t=tableEl([["","",""],["","",""]]);cur.replaceWith(t);const nb=newBlk("p");t.after(nb);const c=t.querySelector("th");if(c)placeCaret(c,true);updateEmpty();}
    function showMenu(){menuOpen=true;menuEl.classList.add("open");positionMenu();}
    function hideMenu(){menuOpen=false;menuEl.classList.remove("open");slashQuery="";}
    function positionMenu(){const s=window.getSelection();let rect=null;if(s.rangeCount){const r=s.getRangeAt(0).cloneRange();const rs=r.getClientRects();if(rs.length)rect=rs[0];}const cr=anchorEl.getBoundingClientRect();const blk=currentBlock();if(!rect&&blk)rect=blk.getBoundingClientRect();if(!rect)return;let left=rect.left-cr.left,top=rect.bottom-cr.top+6;const maxLeft=anchorEl.clientWidth-262;if(left>maxLeft)left=maxLeft;if(left<0)left=0;menuEl.style.left=left+"px";menuEl.style.top=top+"px";}
    function filterMenu(){const q=slashQuery.toLowerCase();menuItems=CMD.filter(c=>!q||(c.label+" "+c.kw).toLowerCase().indexOf(q)>=0);activeIndex=0;renderMenu();}
    function renderMenu(){let h='<div class="hd">기본 블록 · 단축키</div>';if(menuItems.length){h+=menuItems.map((c,i)=>'<div class="si '+(i===activeIndex?"on":"")+'" data-i="'+i+'"><div class="ic">'+c.ic+'</div><div class="tx"><div class="l">'+c.label+'</div><div class="d">'+c.desc+'</div></div>'+(c.sc?'<div class="sc">'+esc(c.sc)+' &nbsp;␣</div>':'')+'</div>').join("");}else h+='<div class="none">일치하는 블록이 없어요</div>';menuEl.innerHTML=h;const on=menuEl.querySelector(".si.on");if(on)on.scrollIntoView({block:"nearest"});}
    function moveActive(d){if(!menuItems.length)return;activeIndex=(activeIndex+d+menuItems.length)%menuItems.length;renderMenu();}
    function chooseActive(){if(!menuItems.length){hideMenu();return;}applyCmd(menuItems[activeIndex]);}
    function removeSlash(){const s=window.getSelection();if(!s.rangeCount)return;try{for(let i=0;i<slashQuery.length+1;i++){s.modify("extend","backward","character");}document.execCommand("delete");}catch(e){}}
    function applyCmd(c){removeSlash();const cur=currentBlock();if(!cur){hideMenu();return;}
      if(c.type==="hr"){makeDivider(cur);}
      else if(c.type==="code"){makeCode(cur);}
      else if(c.type==="table"){makeTable(cur);}
      else if(c.type==="image"||c.type==="video"||c.type==="file"){makeMedia(cur,c.type);}
      else{cur.dataset.type=c.type;if(c.type==="todo"||c.type==="confirm")cur.dataset.checked="false";else cur.removeAttribute("data-checked");if(c.type==="confirm")cur.classList.add("ph");else cur.classList.remove("ph");if(c.type==="toggle")cur.dataset.open="true";else cur.removeAttribute("data-open");if(cur.innerHTML==="")cur.innerHTML="<br>";placeCaret(cur,false);}
      hideMenu();renumber();updateEmpty();}
    // Notion식 마크다운 단축키 (#7): 줄 시작에서 트리거 + 스페이스
    function tryShortcut(blk){
      if(!blk||blk.dataset.type!=="p"||blk.classList.contains("codeblock"))return false;
      const txt=blk.textContent.replace(/ /g," ");
      if(txt==="---"){makeDivider(blk);return true;}
      if(txt==="```"){makeCode(blk);return true;}
      const tb=textBeforeCaret(blk).replace(/ /g," ");
      const map=[[/^####\s$/,"h4"],[/^###\s$/,"h3"],[/^##\s$/,"h2"],[/^#\s$/,"h1"],[/^[-*+]\s$/,"ul"],[/^\d+\.\s$/,"ol"],[/^\[\]\s$/,"todo"],[/^!\s$/,"confirm"],[/^>\s$/,"toggle"],[/^"\s$/,"quote"]];
      for(let i=0;i<map.length;i++){ if(map[i][0].test(tb)){ const tp=map[i][1]; removeLeading(blk,tb.length); blk.dataset.type=tp; if(tp==="todo"||tp==="confirm")blk.dataset.checked="false"; else blk.removeAttribute("data-checked"); if(tp==="toggle")blk.dataset.open="true"; else blk.removeAttribute("data-open"); if(blk.innerHTML==="")blk.innerHTML="<br>"; placeCaret(blk,true); renumber(); updateEmpty(); return true; } }
      return false;
    }
    editorEl.addEventListener("compositionstart",function(){composing=true;});
    editorEl.addEventListener("compositionend",function(){composing=false;});
    // 붙여넣기: 서식 깨짐 방지 — 일반 텍스트로만 삽입
    editorEl.addEventListener("paste",function(e){const cd=e.clipboardData||window.clipboardData;if(!cd)return;e.preventDefault();const text=cd.getData("text/plain");const sel=window.getSelection();if(sel&&!sel.isCollapsed)document.execCommand("delete");document.execCommand("insertText",false,text);});
    editorEl.addEventListener("keydown",function(e){
      if(composing||e.isComposing||e.keyCode===229)return;
      if(menuOpen){if(e.key==="ArrowDown"){e.preventDefault();moveActive(1);return;}if(e.key==="ArrowUp"){e.preventDefault();moveActive(-1);return;}if(e.key==="Enter"||e.key==="Tab"){e.preventDefault();chooseActive();return;}if(e.key==="Escape"){e.preventDefault();hideMenu();return;}}
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="b"){e.preventDefault();document.execCommand("bold");return;}
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="x"){const sel=window.getSelection();if(sel&&!sel.isCollapsed){e.preventDefault();document.execCommand("strikeThrough");return;}}
      if(e.key==="Tab"){const cur=currentBlock();if(cur&&(cur.dataset.type==="ul"||cur.dataset.type==="ol"||cur.dataset.type==="todo")){e.preventDefault();const ind=parseInt(cur.dataset.indent||"0",10);setIndent(cur,e.shiftKey?ind-1:ind+1);renumber();return;}}
      if(e.key==="Backspace"){const sel=window.getSelection();if(sel&&!sel.isCollapsed)return;const cur=currentBlock();if(cur&&cur.dataset.type==="confirm"){const _t=(cur.textContent||"").replace(/ /g," ").trim();if(/^\d{2,4}\.\d{1,2}\.\d{1,2}\(.\)$/.test(_t)){e.preventDefault();cur.innerHTML="<br>";cur.classList.add("ph");renumber();updateEmpty();placeCaret(cur,true);return;}}if(cur&&!cur.classList.contains("codeblock")&&!cur.classList.contains("tableblock")&&caretAtStart(cur)){const ind0=parseInt(cur.dataset.indent||"0",10);if(ind0>0&&(cur.dataset.type==="ul"||cur.dataset.type==="ol"||cur.dataset.type==="todo")){e.preventDefault();setIndent(cur,ind0-1);renumber();return;}if(cur.dataset.type&&cur.dataset.type!=="p"){e.preventDefault();cur.dataset.type="p";cur.removeAttribute("data-checked");cur.removeAttribute("data-open");setIndent(cur,0);renumber();updateEmpty();return;}const prev=cur.previousElementSibling;if(prev){e.preventDefault();if(prev.classList.contains("divider")||prev.getAttribute("contenteditable")==="false"){prev.remove();updateEmpty();return;}placeCaret(prev,false);while(cur.firstChild){const f=cur.firstChild;if(f.nodeName==="BR"&&cur.childNodes.length===1){cur.removeChild(f);break;}prev.appendChild(f);}cur.remove();renumber();updateEmpty();}}}
    });
    // 엔터 = 새 줄(새 블록). beforeinput은 한글 IME 커밋 후 발생하므로 IME에서도 안정적.
    editorEl.addEventListener("beforeinput",function(e){
      // n차 컨펌: 숫자만 입력 허용, 이미 포맷(26.06.04(목))되면 추가 입력 차단(통삭제 후 재입력)
      if(e.inputType==="insertText"||e.inputType==="insertCompositionText"||e.inputType==="insertFromPaste"){const cb=currentBlock();if(cb&&cb.dataset.type==="confirm"){const cur0=(cb.textContent||"").replace(/ /g," ").trim();const formatted=/^\d{2,4}\.\d{1,2}\.\d{1,2}\(.\)/.test(cur0);if(!formatted){if(e.data&&/[^0-9]/.test(e.data)){e.preventDefault();return;}if(e.data&&cur0.replace(/[^0-9]/g,"").length+e.data.replace(/[^0-9]/g,"").length>8){e.preventDefault();return;}}}}
      if(e.inputType!=="insertParagraph")return;
      let cur=currentBlock();
      if(cur&&cur.dataset.type==="code"){e.preventDefault();document.execCommand("insertText",false,"\n");return;}
      if(cur&&cur.classList.contains("tableblock")){return;} // 셀 안 기본 동작 허용
      e.preventDefault();
      if(menuOpen){chooseActive();return;}
      const sel0=window.getSelection();if(sel0&&!sel0.isCollapsed){document.execCommand("delete");cur=currentBlock();}
      if(!cur)return;
      const type=cur.dataset.type,isEmpty=cur.textContent.trim()==="";
      if((type==="ul"||type==="ol"||type==="todo"||type==="confirm"||type==="quote"||type==="toggle"||type==="callout")&&isEmpty){
        const ind=parseInt(cur.dataset.indent||"0",10);
        if((type==="ul"||type==="ol"||type==="todo")&&ind>0){setIndent(cur,ind-1);renumber();updateEmpty();return;}
        cur.dataset.type="p";cur.removeAttribute("data-checked");cur.removeAttribute("data-open");setIndent(cur,0);renumber();updateEmpty();return;
      }
      insertBlockAfter(cur,(type==="ul"||type==="ol"||type==="todo"||type==="confirm")?type:"p");
    });
    // 중간컨펌: 날짜 입력 시 요일 자동 추가 + 빈 칸 placeholder
    function fmtConfirm(blk){const raw=blk.textContent.replace(/ /g," ").trim();if(/^\d{2,4}\.\d{1,2}\.\d{1,2}\(.\)/.test(raw)){blk.classList.remove("ph");return;}const digits=raw.replace(/[^0-9]/g,"");blk.classList.toggle("ph",digits==="");let y,mo,d;if(digits.length===6){y=2000+ +digits.slice(0,2);mo=+digits.slice(2,4);d=+digits.slice(4,6);}else if(digits.length===8){y=+digits.slice(0,4);mo=+digits.slice(4,6);d=+digits.slice(6,8);}else return;if(mo>=1&&mo<=12&&d>=1&&d<=31){const dt=new Date(y,mo-1,d);if(!isNaN(dt.getTime())&&dt.getMonth()===mo-1){const wd=["일","월","화","수","목","금","토"][dt.getDay()];blk.textContent=(digits.length===6?String(y).slice(2):String(y))+"."+pad(mo)+"."+pad(d)+"("+wd+")";placeCaret(blk,false);}}}
    editorEl.addEventListener("input",function(){editorEl.classList.remove("err");renumber();updateEmpty();if(composing){hideMenu();return;}const blk=currentBlock();if(tryShortcut(blk)){if(blk&&blk.dataset.type==="confirm")fmtConfirm(blk);hideMenu();return;}if(blk&&blk.dataset.type==="confirm"){fmtConfirm(blk);hideMenu();return;}if(!blk||blk.classList.contains("tableblock")||blk.classList.contains("media")||blk.classList.contains("codeblock")){hideMenu();return;}const tb=textBeforeCaret(blk);const m=tb.match(/(?:^|\s)\/([^\s/]*)$/);if(m){slashQuery=m[1];if(!menuOpen)showMenu();else positionMenu();filterMenu();}else if(menuOpen)hideMenu();});
    menuEl.addEventListener("mousedown",function(e){const it=e.target.closest(".si");if(!it)return;e.preventDefault();activeIndex=+it.dataset.i;chooseActive();});
    menuEl.addEventListener("mousemove",function(e){const it=e.target.closest(".si");if(!it)return;const i=+it.dataset.i;if(i!==activeIndex){activeIndex=i;renderMenu();}});
    document.addEventListener("mousedown",function(e){if(menuOpen&&!menuEl.contains(e.target)&&!editorEl.contains(e.target))hideMenu();},{signal});
    // 미디어 업로드/URL/삭제, 할 일 체크박스, 토글 클릭
    const fileInput=document.createElement("input");fileInput.type="file";fileInput.style.display="none";document.body.appendChild(fileInput);created.push(fileInput);
    let pendingMediaEl=null;
    editorEl.addEventListener("click",function(e){
      const mu=e.target.closest&&e.target.closest("[data-mu]");
      if(mu){const host=mu.closest(".media");if(!host)return;e.preventDefault();const act=mu.dataset.mu;
        if(act==="del"){const nb=newBlk("p");host.replaceWith(nb);placeCaret(nb,true);updateEmpty();return;}
        if(act==="url"){const u=prompt((host.dataset.mtype==="image"?"이미지":host.dataset.mtype==="video"?"동영상":"파일")+" URL을 입력하세요");if(u&&u.trim()){host.dataset.src=u.trim();if(host.dataset.mtype==="file")host.dataset.name=(u.split("/").pop()||"파일");renderMedia(host);updateEmpty();}return;}
        if(act==="file"){pendingMediaEl=host;fileInput.accept=host.dataset.mtype==="image"?"image/*":host.dataset.mtype==="video"?"video/*":"";fileInput.value="";fileInput.click();return;}
        return;}
      const blk=e.target.closest&&e.target.closest(".blk");
      if(blk&&blk.dataset.type==="todo"){const r=blk.getBoundingClientRect();if(e.clientX-r.left<26){blk.dataset.checked=blk.dataset.checked==="true"?"false":"true";}return;}
      if(blk&&blk.dataset.type==="confirm"){const r=blk.getBoundingClientRect();if(e.clientX-r.left<42){blk.dataset.checked=blk.dataset.checked==="true"?"false":"true";}return;}
      if(blk&&blk.dataset.type==="toggle"){const r=blk.getBoundingClientRect();if(e.clientX-r.left<24){blk.dataset.open=blk.dataset.open==="false"?"true":"false";}return;}
    });
    fileInput.addEventListener("change",function(){const f=fileInput.files&&fileInput.files[0];if(!f||!pendingMediaEl)return;const host=pendingMediaEl;pendingMediaEl=null;const fd=new FormData();fd.append("file",f);host.innerHTML='<div class="media-ph"><span class="mph-l">업로드 중…</span></div>';
      fetch("/api/upload",{method:"POST",body:fd}).then(function(r){return r.json();}).then(function(j){if(j&&j.url){host.dataset.src=j.url;if(host.dataset.mtype==="file")host.dataset.name=j.name||f.name;renderMedia(host);updateEmpty();}else{renderMedia(host);toast("업로드 실패",true);}}).catch(function(){renderMedia(host);toast("업로드 실패",true);});
    },{signal});
    function inlineToMd(node){let s="";node.childNodes.forEach(function(n){if(n.nodeType===3){s+=n.nodeValue;}else if(n.nodeName==="BR"){s+=" ";}else{const inner=inlineToMd(n);const nm=n.nodeName;if(nm==="B"||nm==="STRONG")s+="**"+inner+"**";else if(nm==="I"||nm==="EM")s+="*"+inner+"*";else if(nm==="S"||nm==="STRIKE"||nm==="DEL")s+="~~"+inner+"~~";else if(nm==="CODE")s+="`"+inner+"`";else s+=inner;}});return s;}
    function blkToMd(b){const md=inlineToMd(b).replace(/ /g," ").replace(/\s+$/,"");if(!md)return"";const t=b.dataset.type;if(t==="h1")return "# "+md;if(t==="h2")return "## "+md;if(t==="h3")return "### "+md;if(t==="h4")return "#### "+md;const ind="  ".repeat(parseInt(b.dataset.indent||"0",10));if(t==="ul")return ind+"- "+md;if(t==="ol")return ind+"1. "+md;if(t==="todo")return ind+"- ["+(b.dataset.checked==="true"?"x":" ")+"] "+md;if(t==="confirm")return "<!--cf"+(b.dataset.checked==="true"?"1":"0")+"-->"+md;if(t==="quote")return "> "+md;if(t==="callout")return "<!--callout-->"+md;if(t==="toggle")return "<!--toggle-->"+md;return md;}
    function serialize(){const out=[];editorEl.childNodes.forEach(function(node){
        if(node.nodeType===3){const tx=node.nodeValue.replace(/ /g," ").replace(/\s+$/,"");if(tx.trim())out.push(tx);return;}
        if(node.nodeType!==1)return;
        if(node.classList&&node.classList.contains("divider")){out.push("---");return;}
        if(node.classList&&node.classList.contains("codeblock")){out.push("```");out.push((node.textContent||"").replace(/\n+$/,""));out.push("```");return;}
        if(node.classList&&node.classList.contains("media")){const mt=node.dataset.mtype,src=node.dataset.src||"";if(!src)return;if(mt==="image")out.push("!["+"]("+src+")");else if(mt==="video")out.push("<!--video-->"+src);else out.push("<!--file:"+(node.dataset.name||"파일")+"-->"+src);return;}
        if(node.classList&&node.classList.contains("tableblock")){const trs=node.querySelectorAll("tr");if(!trs.length)return;const arr=[];trs.forEach(function(tr){const cells=[];tr.querySelectorAll("th,td").forEach(function(td){cells.push((td.textContent||"").replace(/\|/g,"/").replace(/\s+/g," ").trim());});arr.push(cells);});const cols=arr[0].length;out.push("| "+arr[0].join(" | ")+" |");out.push("| "+new Array(cols).fill("---").join(" | ")+" |");for(let r=1;r<arr.length;r++)out.push("| "+arr[r].join(" | ")+" |");return;}
        if(node.classList&&node.classList.contains("blk")){out.push(blkToMd(node));return;}
        const md=inlineToMd(node).replace(/ /g," ").replace(/\s+$/,"");if(md.trim())out.push(md);
      });
      return out.join("\n").replace(/\n{3,}/g,"\n\n").replace(/^\n+|\n+$/g,"").trim();
    }
    function loadMarkdown(md){editorEl.innerHTML="";if(!md||!md.trim()){editorEl.appendChild(newBlk("p"));updateEmpty();return;}const L=md.replace(/\r/g,"").split("\n");let i=0,m;function add(type,inner,checked,indent){const b=newBlk(type);if(checked)b.dataset.checked="true";if(indent){b.dataset.indent=String(indent);b.style.marginLeft=(indent*22)+"px";}b.innerHTML=inner&&inner.length?inner:"<br>";if(type==="confirm"&&inner&&inner.length)b.classList.remove("ph");editorEl.appendChild(b);}function lvl(sp){return Math.min(8,Math.floor((sp||"").length/2));}while(i<L.length){const line=L[i];
      if(/^```/.test(line)){const code=[];i++;while(i<L.length&&!/^```/.test(L[i])){code.push(L[i]);i++;}if(i<L.length)i++;const cb=document.createElement("div");cb.className="blk codeblock";cb.dataset.type="code";cb.textContent=code.join("\n");editorEl.appendChild(cb);continue;}
      if(/^(---|\*\*\*|___)\s*$/.test(line)){const dv=document.createElement("div");dv.className="blk divider";dv.contentEditable="false";dv.innerHTML="<hr>";editorEl.appendChild(dv);i++;continue;}
      if(m=line.match(/^!\[[^\]]*\]\(([^)]+)\)\s*$/)){editorEl.appendChild(mediaEl("image",m[1],""));i++;continue;}
      if(m=line.match(/^<!--video-->(.+)$/)){editorEl.appendChild(mediaEl("video",m[1].trim(),""));i++;continue;}
      if(m=line.match(/^<!--file:([^>]*)-->(.+)$/)){editorEl.appendChild(mediaEl("file",m[2].trim(),m[1]||"파일"));i++;continue;}
      if(m=line.match(/^<!--callout-->(.*)$/)){add("callout",inlineMd(m[1]));i++;continue;}
      if(m=line.match(/^<!--toggle-->(.*)$/)){add("toggle",inlineMd(m[1]));i++;continue;}
      if(m=line.match(/^<!--cf([01])-->(.*)$/)){add("confirm",inlineMd(m[2]),m[1]==="1");i++;continue;}
      if(/^\s*$/.test(line)){i++;continue;}
      if(m=line.match(/^(#{1,4})\s+(.*)$/)){add("h"+m[1].length,inlineMd(m[2]));i++;continue;}
      if(m=line.match(/^(\s*)-\s*\[([ xX])\]\s+(.*)$/)){add("todo",inlineMd(m[3]),m[2].toLowerCase()==="x",lvl(m[1]));i++;continue;}
      if(/^>\s?/.test(line)){add("quote",inlineMd(line.replace(/^>\s?/,"")));i++;continue;}
      if(/^\s*\|.*\|\s*$/.test(line)&&i+1<L.length&&/^\s*\|[-:\s|]+\|\s*$/.test(L[i+1])){const head=splitRow(line);i+=2;const body=[];while(i<L.length&&/^\s*\|.*\|\s*$/.test(L[i])){body.push(splitRow(L[i]));i++;}editorEl.appendChild(tableEl([head].concat(body)));continue;}
      if(m=line.match(/^(\s*)[-*]\s+(.*)$/)){add("ul",inlineMd(m[2]),false,lvl(m[1]));i++;continue;}
      if(m=line.match(/^(\s*)\d+\.\s+(.*)$/)){add("ol",inlineMd(m[2]),false,lvl(m[1]));i++;continue;}
      add("p",inlineMd(line));i++;}if(!editorEl.querySelector(".blk"))editorEl.appendChild(newBlk("p"));renumber();updateEmpty();}
    reset();
    return {serialize:serialize,loadMarkdown:loadMarkdown,reset:reset,clearErr:function(){editorEl.classList.remove("err");},markErr:function(){editorEl.classList.add("err");},focusStart:function(){editorEl.focus();const b=editorEl.querySelector(".blk");if(b)placeCaret(b,true);}};
  }

  /* priority icons */
  function priIcon(k){
    if(k==="high")return '<span class="pri-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3E4757" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 13l6-6 6 6"/><path d="M6 18l6-6 6 6"/></svg></span>';
    if(k==="mid")return '<span class="pri-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B95A1" stroke-width="2.4" stroke-linecap="round"><path d="M6 10h12"/><path d="M6 15h12"/></svg></span>';
    return '<span class="pri-ic"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C0C6CD" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7l6 6 6-6"/><path d="M6 12l6 6 6-6"/></svg></span>';
  }
  function makePriRadio(group){
    let val=null;
    function render(){group.innerHTML=["high","mid","low"].map(k=>'<button type="button" class="prad'+(k===val?" on":"")+'" data-k="'+k+'"><span class="rdot"></span>'+priIcon(k)+'<span>'+priTxt[k]+'</span></button>').join("");}
    group.addEventListener("click",function(e){const b=e.target.closest(".prad");if(!b)return;val=b.dataset.k;render();});
    render();
    return {get:()=>val,set:v=>{val=v||null;render();},markErr:()=>group.querySelectorAll(".prad").forEach(x=>x.classList.add("err")),clearErr:()=>group.querySelectorAll(".prad").forEach(x=>x.classList.remove("err"))};
  }

  /* 커스텀 드롭다운 (토스 스타일 — 펼친 목록까지 디자인) */
  function makeSelect(mountEl, options, value, onChange){
    const trig=document.createElement("button");trig.type="button";trig.className="csel";
    trig.innerHTML='<span class="csel-val"></span><svg class="csel-ar" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    mountEl.appendChild(trig);
    const valEl=trig.querySelector(".csel-val");
    const pop=document.createElement("div");pop.className="csel-pop";document.body.appendChild(pop);created.push(pop);
    let val=value;
    function labelOf(v){const o=options.find(x=>x.value===v);return o?o.label:v;}
    function paint(){valEl.textContent=labelOf(val);}
    function renderPop(){pop.innerHTML=options.map(function(o){return '<div class="csel-opt'+(o.value===val?" on":"")+'" data-v="'+o.value+'">'+o.label+'</div>';}).join("");}
    function isOpen(){return pop.classList.contains("open");}
    function position(){const r=trig.getBoundingClientRect();const pw=Math.max(r.width,84);pop.style.minWidth=r.width+"px";let left=r.left,top=r.bottom+6;if(left+pw>window.innerWidth-8)left=window.innerWidth-8-pw;if(left<8)left=8;pop.style.left=left+"px";pop.style.top=top+"px";const ph=pop.offsetHeight;if(top+ph>window.innerHeight-8){const nt=r.top-ph-6;pop.style.top=(nt<8?8:nt)+"px";}}
    function open(){document.querySelectorAll(".csel-pop.open").forEach(function(p){if(p!==pop)p.classList.remove("open");});renderPop();pop.classList.add("open");trig.classList.add("open");position();const on=pop.querySelector(".csel-opt.on");if(on)on.scrollIntoView({block:"center"});}
    function close(){pop.classList.remove("open");trig.classList.remove("open");}
    trig.addEventListener("click",function(e){e.preventDefault();e.stopPropagation();if(isOpen())close();else open();});
    pop.addEventListener("click",function(e){const o=e.target.closest(".csel-opt");if(!o)return;val=o.dataset.v;paint();close();if(onChange)onChange(val);});
    document.addEventListener("mousedown",function(e){if(isOpen()&&!pop.contains(e.target)&&!trig.contains(e.target))close();},{signal});
    window.addEventListener("scroll",function(e){if(isOpen()&&!pop.contains(e.target))close();},{signal:signal,capture:true});
    window.addEventListener("resize",function(){if(isOpen())position();},{signal});
    paint();
    return {get:function(){return val;},set:function(v){val=v;paint();if(isOpen())renderPop();},close:close};
  }
  function makeTimeField(mountEl, initVal){
    mountEl.classList.add("time-sel");mountEl.innerHTML='<span class="tf-h"></span><b class="tcolon">:</b><span class="tf-m"></span>';
    const hOpts=[],mOpts=[];for(let i=0;i<24;i++)hOpts.push({value:pad(i),label:pad(i)+"시"});for(let i=0;i<60;i+=5)mOpts.push({value:pad(i),label:pad(i)+"분"});
    function norm(s){const p=(s||"09:00").split(":");let h=pad(parseInt(p[0],10)||0);let mm=parseInt(p[1],10)||0;mm=Math.round(mm/5)*5;if(mm>55)mm=55;return {h:h,m:pad(mm)};}
    let cur=norm(initVal), cb=null;
    const hSel=makeSelect(mountEl.querySelector(".tf-h"),hOpts,cur.h,function(v){cur.h=v;if(cb)cb(cur.h+":"+cur.m);});
    const mSel=makeSelect(mountEl.querySelector(".tf-m"),mOpts,cur.m,function(v){cur.m=v;if(cb)cb(cur.h+":"+cur.m);});
    return {get:function(){return cur.h+":"+cur.m;},set:function(v){cur=norm(v);hSel.set(cur.h);mSel.set(cur.m);},onChange:function(f){cb=f;},close:function(){hSel.close();mSel.close();}};
  }

  /* range + time picker popup */
  const cal=document.createElement("div");cal.className="cal";document.body.appendChild(cal);created.push(cal);
  const C={y:0,m:0,start:null,end:null,startTime:"09:00",endTime:"18:00",cb:null,field:null};
  let calStartTF=null, calEndTF=null, calBuilt=false;
  function calOpen(){return cal.classList.contains("open");}
  function calCb(){if(C.cb)C.cb(C.start,C.end,C.startTime,C.endTime);}
  function buildCalShell(){
    if(calBuilt)return;
    cal.innerHTML='<div class="cal-hd"><button class="cnav" data-nav="-1">‹</button><div class="ctitle2"></div><button class="cnav" data-nav="1">›</button></div>'
      +'<div class="cal-wd"><span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span></div>'
      +'<div class="cal-grid"></div>'
      +'<div class="cal-time"><div class="ct-row"><span class="ct-l">시작 시간</span><span class="tf" data-tf="start"></span></div><div class="ct-row"><span class="ct-l">마감 시간</span><span class="tf" data-tf="end"></span></div></div>'
      +'<div class="cal-ft"><button class="cclear" data-act="clear">지우기</button><button class="cdone" data-act="done">완료</button></div>';
    calStartTF=makeTimeField(cal.querySelector('[data-tf="start"]'),C.startTime);
    calEndTF=makeTimeField(cal.querySelector('[data-tf="end"]'),C.endTime);
    calStartTF.onChange(function(v){C.startTime=v;calCb();});
    calEndTF.onChange(function(v){C.endTime=v;calCb();});
    calBuilt=true;
  }
  function renderGrid(){
    const y=C.y,m=C.m,first=new Date(y,m,1),sd=first.getDay(),days=new Date(y,m+1,0).getDate(),tI=todayISO();
    cal.querySelector(".ctitle2").textContent=y+"년 "+(m+1)+"월";
    let g="";
    for(let i=0;i<sd;i++)g+='<span class="cd empty"></span>';
    for(let d=1;d<=days;d++){const dt=new Date(y,m,d),iso=ymd(dt),dow=dt.getDay();let cls="cd";if(dow===0||dow===6||isHoliday(iso))cls+=" wk";if(isHoliday(iso))cls+=" hol";if(iso===tI)cls+=" td";if(C.start&&iso===C.start)cls+=" sel start";if(C.end&&iso===C.end)cls+=" sel end";if(C.start&&!C.end&&iso===C.start)cls+=" sel start end";if(C.start&&C.end&&iso>C.start&&iso<C.end)cls+=" inrange";g+='<span class="'+cls+'" data-d="'+iso+'">'+d+'</span>';}
    const trail=(7-((sd+days)%7))%7;for(let i=0;i<trail;i++)g+='<span class="cd empty"></span>';
    cal.querySelector(".cal-grid").innerHTML=g;
  }
  function openCal(field,cur,cb,hideTime){C.cb=cb;C.start=cur.start||null;C.end=cur.end||null;C.startTime=cur.startTime||"09:00";C.endTime=cur.endTime||"18:00";C.field=field;const base=C.end||C.start;const d=base?new Date(base+"T00:00:00"):new Date();C.y=d.getFullYear();C.m=d.getMonth();buildCalShell();calStartTF.set(C.startTime);calEndTF.set(C.endTime);cal.classList.toggle("no-time",!!hideTime);renderGrid();cal.classList.add("open");positionCal(field);}
  function closeCal(){cal.classList.remove("open");C.field=null;document.querySelectorAll(".csel-pop.open").forEach(function(p){p.classList.remove("open");});}
  function positionCal(field){const r=field.getBoundingClientRect();let top=r.bottom+6,left=r.left;const w=cal.offsetWidth||372;if(left+w>window.innerWidth-8)left=window.innerWidth-8-w;if(left<8)left=8;cal.style.left=left+"px";cal.style.top=top+"px";const h=cal.offsetHeight;if(top+h>window.innerHeight-8){const nt=r.top-h-6;cal.style.top=(nt<8?8:nt)+"px";}}
  cal.addEventListener("click",function(e){
    const nav=e.target.closest(".cnav");if(nav){C.m+=(+nav.dataset.nav);if(C.m<0){C.m=11;C.y--;}else if(C.m>11){C.m=0;C.y++;}renderGrid();positionCal(C.field);return;}
    const act=e.target.closest("[data-act]");if(act){if(act.dataset.act==="clear"){C.start=null;C.end=null;calCb();renderGrid();}else{calCb();closeCal();}return;}
    const cd=e.target.closest(".cd[data-d]");if(cd){const iso=cd.dataset.d;
      if(!C.start||(C.start&&C.end)){C.start=iso;C.end=null;}
      else{ if(iso<C.start){C.end=C.start;C.start=iso;} else {C.end=iso;} }
      renderGrid();calCb();}
  });
  document.addEventListener("mousedown",function(e){if(calOpen()&&!cal.contains(e.target)&&C.field&&!C.field.contains(e.target)&&!e.target.closest(".csel-pop"))closeCal();},{signal});
  window.addEventListener("resize",function(){if(calOpen()&&C.field)positionCal(C.field);},{signal});

  function toast(msg,isErr){const box=$("toasts");const t=document.createElement("div");t.className="toast"+(isErr?" err":"");t.innerHTML=(isErr?'<span class="ic"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg></span>':"")+"<span>"+esc(msg)+"</span>";box.appendChild(t);setTimeout(function(){t.classList.add("out");setTimeout(function(){t.remove();},260);},2600);}

  /* theme (#8) */
  const MOON='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>';
  const SUN='<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.4 1.4M17.6 17.6L19 19M19 5l-1.4 1.4M6.4 17.6L5 19"/></svg>';
  function applyTheme(){document.documentElement.setAttribute("data-theme",theme);$("themeBtn").innerHTML=theme==="dark"?SUN:MOON;}
  try{const tv=localStorage.getItem(THKEY);if(tv==="dark"||tv==="light")theme=tv;}catch(e){}
  applyTheme();
  $("themeBtn").onclick=function(){theme=theme==="dark"?"light":"dark";try{localStorage.setItem(THKEY,theme);}catch(e){}applyTheme();};

  let cNotifyTF=null, mNotifyTF=null; // 알림 시각 커스텀 드롭다운 (init에서 생성)

  /* 중간 컨펌 에디터 (날짜 + 이름 + 완료) */
  const CFCHK='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.4"><path d="M20 6L9 17l-5-5"/></svg>';
  function makeConfirmEditor(listEl, addBtn){
    let arr=[];
    function render(){
      listEl.innerHTML=arr.map(function(c,i){return '<div class="confirm-row" data-i="'+i+'"><button type="button" class="confirm-chk'+(c.done?" on":"")+'" data-cact="done" title="완료">'+CFCHK+'</button><span class="confirm-no">'+(i+1)+'차</span><input type="date" class="confirm-date" data-cact="date" value="'+(c.date||"")+'"><input type="text" class="confirm-name" data-cact="name" placeholder="이름(선택)" value="'+esc(c.label||"")+'"><button type="button" class="confirm-del" data-cact="del" title="삭제">×</button></div>';}).join("");
    }
    listEl.addEventListener("click",function(e){const b=e.target.closest("[data-cact]");if(!b)return;const row=b.closest("[data-i]");if(!row)return;const i=+row.dataset.i;const act=b.dataset.cact;if(act==="done"){arr[i].done=!arr[i].done;render();}else if(act==="del"){arr.splice(i,1);render();}});
    listEl.addEventListener("input",function(e){const b=e.target.closest("[data-cact]");if(!b)return;const row=b.closest("[data-i]");if(!row)return;const i=+row.dataset.i;if(b.dataset.cact==="date")arr[i].date=b.value;else if(b.dataset.cact==="name")arr[i].label=b.value;});
    addBtn.addEventListener("click",function(){arr.push({id:uid(),date:"",label:"",done:false});render();});
    return {get:function(){return arr.filter(c=>c.date).map(c=>({id:c.id,date:c.date,label:c.label||"",done:!!c.done}));},set:function(v){arr=(v||[]).map(c=>({id:c.id||uid(),date:c.date||"",label:c.label||"",done:!!c.done}));render();}};
  }
  let cConfirmEd=null, mConfirmEd=null;

  /* composer */
  const cEditor=EditorFactory($("editor"),$("slash"),document.querySelector(".composer"));
  const cPri=makePriRadio($("priGroup"));
  let cRange={start:null,end:null,startTime:"09:00",endTime:"18:00"};
  let cIncHol=false;
  $("incHolBtn").onclick=function(){cIncHol=!cIncHol;$("incHolSw").classList.toggle("on",cIncHol);};
  function paintCRange(){const lab=labelRangeT(cRange.start,cRange.end,cRange.startTime,cRange.endTime);const el=$("rangeText");if(lab){el.textContent=lab;el.classList.remove("empty");}else{el.textContent="날짜와 시간 선택";el.classList.add("empty");}$("rangeField").classList.remove("err");}
  $("rangeField").addEventListener("click",function(){$("rangeField").classList.remove("err");openCal($("rangeField"),cRange,function(s,e,st,et){cRange.start=s;cRange.end=e;cRange.startTime=st||cRange.startTime;cRange.endTime=et||cRange.endTime;paintCRange();});});
  $("tTitle").addEventListener("input",function(){$("tTitle").classList.remove("err");});

  function clearComposer(){$("tTitle").value="";$("tTitle").classList.remove("err");cEditor.reset();cEditor.clearErr();cRange={start:null,end:null,startTime:"09:00",endTime:"18:00"};paintCRange();cPri.set(null);cPri.clearErr();cIncHol=false;$("incHolSw").classList.remove("on");if(cNotifyTF)cNotifyTF.set("09:00");}

  // 폼/모달이 작은 아이콘으로 '수축'한 뒤 도착 위치로 호를 그리며 '날아가' 항목이 나타나는 모션
  // - 도착 항목이 뷰포트 밖이면 먼저 스크롤로 보이게 한 뒤 애니메이션
  // - list 높이/레이아웃을 통제하지 않음(덜컹 없음). 느리고 아주 부드러움.
  function flyToTaskRect(sr,id){
    if(!sr||!sr.width)return;
    const target=$("view").querySelector('[data-id="'+id+'"]');
    if(!target)return;
    const r=target.getBoundingClientRect();
    if(!r.width)return;
    const vh=window.innerHeight||document.documentElement.clientHeight;
    const inView=r.top>=6 && r.bottom<=vh-6;
    if(!inView){
      try{target.scrollIntoView({behavior:"smooth",block:"center"});}catch(_){try{target.scrollIntoView();}catch(__){}}
      setTimeout(function(){runFly(sr,id);},480);
    }else{
      runFly(sr,id);
    }
  }
  function runFly(sr,id){
    const target=$("view").querySelector('[data-id="'+id+'"]');
    if(!target)return;
    const e=target.getBoundingClientRect();
    if(!e.width)return;
    // 도착 항목: 액센트 테두리 링이 천천히 사라짐(위치/높이 변화 없음 → 덜컹 없음)
    target.classList.remove("just-landed");void target.offsetWidth;target.classList.add("just-landed");
    setTimeout(function(){target.classList.remove("just-landed");},1300);
    const reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(reduce||typeof target.animate!=="function")return;
    const SZ=30,half=SZ/2,DUR=880;
    const sx=sr.left+sr.width/2, sy=sr.top+sr.height/2;          // 폼/모달 중심에서 수축
    const ex=e.left+Math.min(e.width/2,40), ey=e.top+e.height/2; // 항목 좌측 가까이로 도착
    const cx=(sx+ex)/2, cy=Math.min(sy,ey)-56;                   // 위로 솟는 제어점(호)
    const startScale=Math.max(3,Math.min(6,sr.width/SZ*0.4));    // 폼 크기만큼 커졌다가 수축
    // 도착 항목: 칩이 도착하는 후반부에 부드럽게 나타남(투명도만 → 레이아웃 영향 없음)
    const absPos=getComputedStyle(target).position==="absolute";
    target.animate(absPos
      ?[{opacity:0,offset:0},{opacity:0,offset:.52},{opacity:1,offset:1}]
      :[{opacity:.001,offset:0},{opacity:.001,offset:.52},{opacity:1,offset:1}],
      {duration:DUR,easing:"cubic-bezier(.4,0,.2,1)",fill:"backwards"});
    const chip=document.createElement("div");
    chip.className="flychip";
    chip.style.cssText="position:fixed;left:0;top:0;width:"+SZ+"px;height:"+SZ+"px;will-change:transform,opacity;z-index:1000;pointer-events:none";
    document.body.appendChild(chip);
    const kf=[],P1=0.28,STEPS=9;
    const at=function(x,y,sc){return "translate("+(x-half).toFixed(2)+"px,"+(y-half).toFixed(2)+"px) scale("+sc.toFixed(3)+")";};
    kf.push({transform:at(sx,sy,startScale),opacity:0,offset:0});
    kf.push({transform:at(sx,sy,startScale*0.86),opacity:0.92,offset:0.06});
    kf.push({transform:at(sx,sy,1),opacity:1,offset:P1});
    for(let i=1;i<=STEPS;i++){const tt=i/STEPS,u=1-tt;
      const x=u*u*sx+2*u*tt*cx+tt*tt*ex, y=u*u*sy+2*u*tt*cy+tt*tt*ey;
      const sc=1-0.3*tt;
      const op=tt>0.8?Math.max(0,(1-tt)/0.2):1;
      kf.push({transform:at(x,y,sc),opacity:op.toFixed(3),offset:Math.min(1,P1+(1-P1)*tt)});
    }
    const a=chip.animate(kf,{duration:DUR,easing:"cubic-bezier(.4,0,.2,1)",fill:"forwards"});
    const done=function(){if(chip.parentNode)chip.remove();};
    a.onfinish=done;a.oncancel=done;
  }

  function add(){
    const miss=[];
    const title=$("tTitle").value.trim();
    if(!title){miss.push("제목");$("tTitle").classList.add("err");}
    const body=cEditor.serialize();
    if(!body){miss.push("내용");cEditor.markErr();}
    if(!(cRange.start&&cRange.end)){miss.push("기간");$("rangeField").classList.add("err");}
    if(!cPri.get()){miss.push("우선순위");cPri.markErr();}
    if(miss.length){toast(miss.join(", ")+" 입력이 필요해요",true);if(miss[0]==="제목")$("tTitle").focus();return;}
    const newId=uid();
    tasks.push({id:newId,title:title,body:body,start:cRange.start,end:cRange.end,startTime:cRange.startTime,endTime:cRange.endTime,pri:cPri.get(),done:false,incHol:cIncHol,notify:true,notifyTime:cNotifyTF.get(),confirms:[],created:Date.now(),history:[]});
    const sr=document.querySelector(".composer").getBoundingClientRect();
    requestNotiPerm();clearComposer();$("tTitle").focus();save();render();
    requestAnimationFrame(function(){flyToTaskRect(sr,newId);});
  }
  $("addBtn").onclick=add;
  $("tTitle").addEventListener("keydown",function(e){if(e.isComposing||e.keyCode===229)return;if(e.key==="Enter"){e.preventDefault();cEditor.focusStart();}});

  /* reset (#12) */
  $("resetBtn").onclick=function(){$("resetModal").classList.add("open");};
  $("rsCancel").onclick=function(){$("resetModal").classList.remove("open");};
  $("rsOk").onclick=function(){clearComposer();$("resetModal").classList.remove("open");toast("작성 내용을 초기화했어요");};
  $("resetModal").addEventListener("mousedown",function(e){if(e.target===$("resetModal"))$("resetModal").classList.remove("open");});

  function toggle(id){const x=tasks.find(t=>t.id===id);if(x){x.done=!x.done;save();render();}}

  /* trash (#13) */
  function del(id){const i=tasks.findIndex(t=>t.id===id);if(i<0)return;const t=tasks[i];tasks.splice(i,1);trash.unshift(Object.assign({},t,{deletedAt:Date.now()}));save();saveTrash();render();}
  function restoreTrash(id){const i=trash.findIndex(t=>t.id===id);if(i<0)return;const t=trash[i];trash.splice(i,1);const r=Object.assign({},t);delete r.deletedAt;tasks.push(r);save();saveTrash();render();renderTrash();toast("복원했어요");}
  function permDelete(id){trash=trash.filter(t=>t.id!==id);saveTrash();render();renderTrash();toast("영구 삭제했어요");}
  function openTrash(){renderTrash();$("trashModal").classList.add("open");}
  function closeTrash(){$("trashModal").classList.remove("open");}
  function fmtDel(ts){const d=new Date(ts);return (d.getMonth()+1)+"/"+d.getDate()+" "+pad(d.getHours())+":"+pad(d.getMinutes());}
  function renderTrash(){
    if(!trash.length){$("trashList").innerHTML='<div class="empty" style="padding:30px 10px"><p>휴지통이 비어 있어요</p></div>';return;}
    $("trashList").innerHTML=trash.map(function(t){return '<div class="trashitem" data-id="'+t.id+'"><div class="ti-main"><div class="ti-title">'+esc(t.title||"(제목 없음)")+'</div><div class="ti-sub">'+(t.deletedAt?esc(fmtDel(t.deletedAt))+" 삭제":"")+'</div></div><div class="ti-acts"><button class="btn-ghost ti-btn" data-tact="restore">복원</button><button class="btn-danger ti-btn" data-tact="perm">영구삭제</button></div></div>';}).join("");
  }
  $("trashBtn").onclick=openTrash;
  $("tmClose").onclick=closeTrash;$("tmDone").onclick=closeTrash;
  $("trashEmpty").onclick=function(){if(!trash.length){toast("휴지통이 비어 있어요");return;}trash=[];saveTrash();render();renderTrash();toast("휴지통을 비웠어요");};
  $("trashModal").addEventListener("mousedown",function(e){if(e.target===$("trashModal"))closeTrash();});
  $("trashList").addEventListener("click",function(e){const b=e.target.closest("[data-tact]");if(!b)return;const host=b.closest("[data-id]");if(!host)return;const id=host.dataset.id;if(b.dataset.tact==="restore")restoreTrash(id);else permDelete(id);});

  /* 연차 (annual leave) — 연 15일(120h), 2시간 단위, 주말·공휴일 제외 */
  const wdNames=["일","월","화","수","목","금","토"];
  function leaveLabel(h){return ({2:"반반차",4:"반차",6:"3/4연차",8:"연차"})[h]||(h+"시간");}
  function hToDays(h){h=Math.max(0,h);const d=Math.floor(h/8),r=h%8;if(!d&&!r)return "0";return (d?d+"일":"")+(r?(d?" ":"")+r+"시간":"");}
  function leaveYear(){return (calRef?new Date(calRef+"T00:00:00"):new Date()).getFullYear();}
  function leaveUsed(yr){return leaves.filter(l=>String(l.date).slice(0,4)===String(yr)).reduce((s,l)=>s+(Number(l.hours)||0),0);}
  function leaveHoursOn(iso){for(let i=0;i<leaves.length;i++)if(leaves[i].date===iso)return leaves[i].hours;return 0;}
  function fmtLeaveDate(iso){const p=iso.split("-");const dt=new Date(iso+"T00:00:00");return (+p[1])+"/"+(+p[2])+" ("+wdNames[dt.getDay()]+")";}
  function paintLeaveBtn(){const rem=LEAVE_HOURS-leaveUsed(leaveYear());const b=$("leaveBtn");if(b)b.title="연차 "+hToDays(rem)+" 남음";}
  function paintLvRange(){const el=$("lvRangeText");if(lvRange.start&&lvRange.end&&lvRange.start!==lvRange.end){el.textContent=fmtMD(lvRange.start)+" → "+fmtMD(lvRange.end);el.classList.remove("empty");}else if(lvRange.start){el.textContent=fmtLeaveDate(lvRange.start);el.classList.remove("empty");}else{el.textContent="날짜 선택";el.classList.add("empty");}$("lvRangeField").classList.remove("err");paintLvControls();}
  // 근무 09:00~18:00 · 점심 12:00~13:00 기준 연차 차감 시간/표시
  function lvIsMulti(){return !!(lvRange.start&&lvRange.end&&lvRange.start!==lvRange.end);}
  function fmtAmPm(hhmm){const p=hhmm.split(":");let h=+p[0];const m=p[1];const ap=h<12?"오전":"오후";let hh=h%12;if(hh===0)hh=12;return ap+" "+hh+":"+m;}
  function lvCurHours(){if(lvIsMulti()||lvType==="full")return 8;if(lvType==="am"||lvType==="pm")return 4;return lvHourVal;}
  function lvCurRange(){if(lvType==="full")return["09:00","18:00"];if(lvType==="am")return["09:00","14:00"];if(lvType==="pm")return["14:00","18:00"];return["09:00",lvHourVal<=2?"11:00":"16:00"];}
  function countLeaveDays(s,e){let d=new Date(s+"T00:00:00");const end=new Date((e||s)+"T00:00:00");let n=0;for(;d<=end;d.setDate(d.getDate()+1)){if(!isExcludedDay(ymd(d)))n++;}return n;}
  function paintLvControls(){
    const multi=lvIsMulti();
    if(multi&&lvType!=="full"){lvType="full";}
    document.querySelectorAll("#lvType button").forEach(function(b){const isFull=b.dataset.t==="full";b.classList.toggle("dim",multi&&!isFull);b.classList.toggle("on",b.dataset.t===lvType);});
    $("lvHourSel").style.display=(!multi&&lvType==="hour")?"flex":"none";
    let info="";
    if(!lvRange.start){info="날짜를 선택하세요";}
    else if(multi){const n=countLeaveDays(lvRange.start,lvRange.end);info="총 "+n+"일 선택 ("+n+"일 사용)";}
    else if(lvType==="full"){info="하루 종일 · 1일(8시간) 사용";}
    else{const r=lvCurRange();info=fmtAmPm(r[0])+" – "+fmtAmPm(r[1])+" ("+lvCurHours()+"시간 사용)";}
    $("lvInfo").textContent=info;
  }
  function renderLeave(){
    const yr=leaveYear();const used=leaveUsed(yr);const rem=LEAVE_HOURS-used;
    $("lvYear").textContent="· "+yr+"년";
    $("lvSummary").innerHTML='<div class="lv-rem">남은 연차 <b>'+hToDays(rem)+'</b></div><div class="lv-sub">올해 사용 '+hToDays(used)+' · 총 '+LEAVE_DAYS+'일('+LEAVE_HOURS+'h)</div>';
    const list=leaves.filter(l=>String(l.date).slice(0,4)===String(yr)).slice().sort((a,b)=>a.date<b.date?-1:1);
    $("lvList").innerHTML=list.length?list.map(function(l){return '<div class="trashitem" data-id="'+l.id+'"><div class="ti-main"><div class="ti-title">'+esc(fmtLeaveDate(l.date))+'</div><div class="ti-sub">'+leaveLabel(l.hours)+' · '+l.hours+'시간</div></div><div class="ti-acts"><button class="btn-danger ti-btn" data-lvact="del">삭제</button></div></div>';}).join(""):'<div class="empty" style="padding:26px 10px"><p>사용한 연차가 없어요</p></div>';
  }
  function addLeave(){
    if(!lvRange.start){toast("날짜를 선택하세요",true);$("lvRangeField").classList.add("err");return;}
    const dates=[];let d=new Date(lvRange.start+"T00:00:00");const end=new Date((lvRange.end||lvRange.start)+"T00:00:00");
    for(;d<=end;d.setDate(d.getDate()+1)){const iso=ymd(d);if(!isExcludedDay(iso))dates.push(iso);}
    if(!dates.length){toast("선택한 기간에 평일이 없어요",true);return;}
    const multi=dates.length>1;const perDay=multi?8:lvCurHours();
    const map={};leaves.forEach(l=>{map[l.date]=Object.assign({},l);});
    dates.forEach(function(iso){map[iso]={id:(map[iso]&&map[iso].id)||uid(),date:iso,hours:perDay,created:(map[iso]&&map[iso].created)||Date.now()};});
    const arr=Object.keys(map).map(k=>map[k]);
    const byYear={};arr.forEach(l=>{const y=String(l.date).slice(0,4);byYear[y]=(byYear[y]||0)+l.hours;});
    for(const y in byYear){ if(byYear[y]>LEAVE_HOURS){toast(y+"년 연차 한도("+LEAVE_DAYS+"일)를 초과해요",true);return;} }
    leaves=arr.sort((a,b)=>a.date<b.date?-1:1);
    saveLeaves();lvRange={start:null,end:null};paintLvRange();render();renderLeave();toast(dates.length+"일 연차를 추가했어요");
  }
  function delLeave(id){leaves=leaves.filter(l=>l.id!==id);saveLeaves();render();renderLeave();toast("연차를 취소했어요");}
  function openLeave(){lvRange={start:null,end:null};lvType="full";lvHourVal=2;document.querySelectorAll("#lvHourSel button").forEach(x=>x.classList.toggle("on",x.dataset.hh==="2"));paintLvRange();renderLeave();$("leaveModal").classList.add("open");}
  function closeLeave(){$("leaveModal").classList.remove("open");}
  $("leaveBtn").onclick=openLeave;
  $("lvClose").onclick=closeLeave;$("lvDone").onclick=closeLeave;
  $("leaveModal").addEventListener("mousedown",function(e){if(e.target===$("leaveModal"))closeLeave();});
  document.querySelectorAll("#lvType button").forEach(function(b){b.onclick=function(){if(b.classList.contains("dim"))return;lvType=b.dataset.t;paintLvControls();};});
  document.querySelectorAll("#lvHourSel button").forEach(function(b){b.onclick=function(){lvHourVal=Number(b.dataset.hh);document.querySelectorAll("#lvHourSel button").forEach(x=>x.classList.toggle("on",x===b));paintLvControls();};});
  $("lvRangeField").addEventListener("click",function(){$("lvRangeField").classList.remove("err");openCal($("lvRangeField"),lvRange,function(s,e){lvRange.start=s;lvRange.end=e;paintLvRange();},true);});
  $("lvAddBtn").onclick=addLeave;
  $("lvList").addEventListener("click",function(e){const b=e.target.closest("[data-lvact]");if(!b)return;const host=b.closest("[data-id]");if(!host)return;const id=host.dataset.id;confirmAsk("이 연차를 삭제할까요?","사용 내역에서 제거됩니다.","삭제",function(){delLeave(id);});});

  /* 릴리즈 내역 */
  const CHANGELOG=[
    {v:"1.1.6",items:["모달이 열리면 배경 페이지 스크롤 잠금(스크롤바 흔들림 방지 포함)"]},
    {v:"1.1.5",items:["n차 컨펌: 날짜가 자동 포맷(26.06.05(금))된 뒤에는 오른쪽에 메모 등 자유 입력 허용","작성 폼 강조: 카드 뒤 부드러운 파스텔 글로우 + 떠오르는 그림자(팝아웃)","생성/수정 애니메이션 끝의 반짝이는 링 제거"]},
    {v:"1.1.4",items:["알림 개별 삭제 버튼 추가","생성/수정 애니메이션: 폼·모달이 작은 아이콘으로 수축한 뒤 호를 그리며 날아가 항목이 나타남","도착 항목이 화면 밖이면 먼저 스크롤해 보이게 한 뒤 애니메이션 재생","작성 폼과 목록 사이 간격 확대"]},
    {v:"1.1.3",items:["아이콘만 있는 버튼에 툴팁 추가(닫기·달력 이동·완료 처리 등)","작성 폼 각 항목에 도움말(?) — 데스크탑은 마우스오버 툴팁, 모바일은 클릭 시 설명 모달","토스트 모션을 더 느리고 부드럽게(튕김 제거)","생성/수정 애니메이션을 작은 칩이 호를 그리며 날아가 항목이 나타나는 방식으로 재정비(레이아웃 덜컹임 제거·더 느리고 부드럽게)"]},
    {v:"1.1.2",items:["할 일 생성·수정 애니메이션 전면 개선(부드러운 스프링 모션·고스트 카드·자연스러운 등장)","토스트 알림에 위에서 아래로 내려오는 드롭 모션 추가(가시성 향상)"]},
    {v:"1.1.1",items:["정렬을 아이콘+드롭다운으로 개편(검색·선택·초기화, 적용 시 파란 점 표시) — 리스트·칸반 공통","우선순위 보기: 높음·중간·낮음 그룹화 토글(정렬과 별개, 기본 꺼짐)","n차 컨펌 입력은 숫자만 허용(6/8자리 자동 포맷)·Backspace로 날짜 통삭제 후 재입력","리스트·칸반의 '시간 보기' 토글 제거","정렬·우선순위 보기·완료 보기·달력 일/주/월 등 레이아웃 설정을 DB에 저장(새로고침해도 유지)"]},
    {v:"1.1.0",items:["연차 등록 UX 개편: 날짜 선택 후 하루 종일·오전/오후 반차·시간차 선택(근무 09–18·점심 12–13 반영, 단일·연속일 모두 지원)","연차 모달에서 반반차/반차/연차 버튼 제거 — 날짜+유형만으로 등록","전체 화면 반응형 최적화(컨트롤·달력·대시보드·연차/수정 모달·날짜+시간 팝업 넘침 방지)"]},
    {v:"1.0.27",items:["리스트 완료 항목 기본 숨김 + '완료 보기' 토글(켜면 표시·끄면 숨김)"]},
    {v:"1.0.26",items:["달력 일/주/월 전환 스타일을 상단 뷰 탭과 동일하게 통일(선택만 흰색 강조)","날짜+시간 선택 팝업 폭을 넓혀 시작/마감 시간이 넘치던 문제 수정"]},
    {v:"1.0.25",items:["대시보드 뷰 신설(달력 오른쪽 탭): 진행 현황·마감 임박·상태/우선순위 분포·올해 연차·최근 추가","할 일 생성·수정 시 폼/모달이 목록으로 날아가 반영되는 착지 애니메이션(리스트·칸반·달력)"]},
    {v:"1.0.24",items:["달력 기본값: 완료 숨기기 ON · 주말 보기 ON","본문에서 글자 드래그 후 Ctrl+X로 취소선"]},
    {v:"1.0.23",items:["중간컨펌(n차)을 본문에서 인식해 달력에 표시","컨펌이 있는 일정은 막대 높이를 키워 제목과 겹치지 않게","컨펌 표시를 연한 선·숫자로(해당 날짜 왼쪽)"]},
    {v:"1.0.22",items:["연차 기준 15.5일(생일반차 0.5일 포함)·군소집훈련 차감 제외","반차/반반차는 사용량만큼만 색을 채우고 주말·공휴일 톤 적용","리스트·칸반 시간 보기 토글(기본 꺼짐)·칸반 메타 정리(중요도 한 줄, 날짜+D-day 한 줄)"]},
    {v:"1.0.21",items:["footer 화면 하단 고정 + 스크롤 끝 잘림 수정","리스트~완료 숨기기 컨트롤 영역 스크롤 고정(sticky)","릴리즈 내역을 버튼으로 노출·릴리즈/연차 모달 높이 90vh·연차 사용내역 삭제 확인 단계 추가"]},
    {v:"1.0.20",items:["기간 표시 위계 개선: 날짜 굵게 + D-day 별도 박스","시간 드롭다운 폭 확대('09시' 한 줄)","본문 붙여넣기 서식 깨짐·드래그 선택 삭제 버그 수정"]},
    {v:"1.0.19",items:["중간컨펌 블록 추가('!'+스페이스 → 1차/2차 자동번호)","날짜 입력 시 요일 자동 표기(2026.06.02→화)"]},
    {v:"1.0.18",items:["작성/수정 폼 위계 정리(제목·내용·기간·우선순위·옵션)","본문 드래그 삭제 버그 수정"]},
    {v:"1.0.17",items:["중첩 리스트: Tab 들여쓰기 / Shift+Tab 내어쓰기","이미 쓴 글 앞에 -, 1., [], # 넣어도 변환"]},
    {v:"1.0.16",items:["헤더 고정(스크롤해도 따라옴)","알림 클릭 시 현재 화면의 해당 할 일로 이동·강조"]},
    {v:"1.0.15",items:["연차 관리 신설: 연 15.5일, 반반차/반차/연차","달력에 연차 표시(사용량 비율만큼 채움)"]},
    {v:"1.0.14",items:["달력 주말·공휴일 배경색 + 일요일·공휴일 빨강 숫자"]},
    {v:"1.0.13",items:["시간 선택을 토스 스타일 커스텀 드롭다운으로"]},
    {v:"1.0.12",items:["12시간마다 자동 DB 백업 + 복구 기능"]},
    {v:"1.0.11",items:["마감 알림 항상 ON + 마감일 알림 시각 설정(기본 09:00)"]},
    {v:"1.0.10",items:["헤더 정리: 완료율 게이지 제거, 연차·알림·다크모드·휴지통 배치"]},
    {v:"1.0.9",items:["마감 알림: 브라우저 알림 + 인앱 알림 센터(종 아이콘)"]},
    {v:"1.0.8",items:["노션식 전체 블록: 제목4·할일·토글·콜아웃·표·이미지·동영상·코드·파일","이미지/동영상/파일 로컬 업로드 + URL"]},
    {v:"1.0.7",items:["리스트 카드 자세히보기/완료 숨기기, 기간 자동 정렬"]},
    {v:"1.0.6",items:["공휴일·주말 포함 옵션(달력 반영)"]},
    {v:"1.0.5",items:["시작/마감 시간, 다크모드, 휴지통, 칸반 카드 클릭 수정","토스트 상단 고정, 초기화 버튼, 마크다운 단축키"]},
    {v:"1.0.4",items:["완료율 링 표시 개선"]},
    {v:"1.0.3",items:["달력 다중 주 hover 동기화, 마이크로 인터랙션"]},
    {v:"1.0.2",items:["반응형(모바일·태블릿·PC)"]},
    {v:"1.0.1",items:["Next.js + MySQL 이식: 리스트·칸반·달력 3뷰, 블록 에디터, 우선순위·기간, 수정 이력, 휴지통"]}
  ];
  const APP_VERSION=CHANGELOG[0].v;
  function renderRel(){$("relList").innerHTML=CHANGELOG.map(function(r){return '<div class="relitem"><div class="relver">v'+r.v+'</div><ul class="relul">'+r.items.map(function(it){return '<li>'+esc(it)+'</li>';}).join("")+'</ul></div>';}).join("");}
  function openRel(){renderRel();$("relModal").classList.add("open");}
  function closeRel(){$("relModal").classList.remove("open");}
  $("relBtn").onclick=openRel;$("relClose").onclick=closeRel;$("relDone").onclick=closeRel;
  $("relModal").addEventListener("mousedown",function(e){if(e.target===$("relModal"))closeRel();});
  $("verLabel").textContent="v"+APP_VERSION;

  /* 알림 (notification) — 마감 N분 전 브라우저 알림 + 인앱 알림 센터 */
  const NLKEY="careid_notiflog", NFKEY="careid_notified";
  let notiflog=[], notiFired={}, notiTimer=null;
  try{const a=localStorage.getItem(NLKEY);if(a)notiflog=JSON.parse(a)||[];}catch(e){}
  try{const a=localStorage.getItem(NFKEY);if(a)notiFired=JSON.parse(a)||{};}catch(e){}
  function saveNotiflog(){try{localStorage.setItem(NLKEY,JSON.stringify(notiflog.slice(0,50)));}catch(e){}}
  function saveFired(){try{localStorage.setItem(NFKEY,JSON.stringify(notiFired));}catch(e){}}
  function requestNotiPerm(){try{if(typeof Notification!=="undefined"&&Notification.permission==="default")Notification.requestPermission();}catch(e){}}
  function leadTxt(m){m=Number(m)||0;return m===0?"정시":m>=1440?"1일 전":m>=60?(m/60)+"시간 전":m+"분 전";}
  function paintBell(){const n=notiflog.filter(x=>!x.seen).length;const b=$("bellCount");if(!b)return;if(n>0){b.style.display="";b.textContent=n>99?"99+":n;}else b.style.display="none";}
  function taskFireAt(t){if(!t.end)return null;const dt=new Date(t.end+"T"+(t.notifyTime||"09:00")+":00");if(isNaN(dt.getTime()))return null;return dt.getTime();}
  function fireNoti(t){const sub="마감일 알림 · "+(labelRangeT(t.start,t.end,t.startTime,t.endTime)||"");notiflog.unshift({nid:uid(),taskId:t.id,title:t.title||"(제목 없음)",sub:sub,at:Date.now(),seen:false});if(notiflog.length>50)notiflog.length=50;saveNotiflog();paintBell();try{if(typeof Notification!=="undefined"&&Notification.permission==="granted")new Notification("⏰ "+(t.title||"할 일"),{body:sub});}catch(e){}}
  function checkNoti(){const now=Date.now();tasks.forEach(function(t){if(t.done||!t.end||t.notify===false)return;const fa=taskFireAt(t);if(fa==null)return;const key=t.id+"@"+fa;if(fa<=now&&(now-fa)<12*3600*1000&&!notiFired[key]){notiFired[key]=1;saveFired();fireNoti(t);}});}
  function renderNoti(){if(!notiflog.length){$("notiList").innerHTML='<div class="empty" style="padding:30px 10px"><p>알림이 없어요</p></div>';return;}$("notiList").innerHTML=notiflog.map(function(x,i){const d=new Date(x.at);const ts=(d.getMonth()+1)+"/"+d.getDate()+" "+pad(d.getHours())+":"+pad(d.getMinutes());return '<div class="trashitem noti'+(x.seen?"":" unseen")+'" data-tid="'+esc(x.taskId)+'"><div class="ti-main"><div class="ti-title">⏰ '+esc(x.title)+'</div><div class="ti-sub">'+esc(x.sub)+' · '+ts+'</div></div><div class="ti-acts"><button class="iconbtn ndel" data-ndel="'+i+'" title="알림 삭제" aria-label="알림 삭제"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div></div>';}).join("");}
  function delNoti(i){if(i<0||i>=notiflog.length)return;notiflog.splice(i,1);saveNotiflog();renderNoti();paintBell();}
  function openNoti(){requestNotiPerm();renderNoti();$("notiModal").classList.add("open");notiflog.forEach(function(x){x.seen=true;});saveNotiflog();paintBell();}
  function closeNoti(){$("notiModal").classList.remove("open");}
  $("bellBtn").onclick=openNoti;
  $("nmClose").onclick=closeNoti;$("nmDone").onclick=closeNoti;
  $("notiClear").onclick=function(){notiflog=[];saveNotiflog();renderNoti();paintBell();};
  $("notiModal").addEventListener("mousedown",function(e){if(e.target===$("notiModal"))closeNoti();});
  function findTaskEl(id){return $("view").querySelector('[data-id="'+id+'"]');}
  function scrollHi(el){el.scrollIntoView({behavior:"smooth",block:"center"});el.classList.add("hlflash");setTimeout(function(){el.classList.remove("hlflash");},1700);}
  function focusTask(id){
    let el=findTaskEl(id);
    if(el){scrollHi(el);return;}
    // 현재 뷰에 없으면 리스트(전체)로 전환 후 스크롤
    viewMode="list";filter="all";listHideDone=false;
    syncViewSeg();document.querySelectorAll("#filterSeg button").forEach(b=>b.classList.toggle("on",b.dataset.f==="all"));$("listHideSw").classList.add("on");
    saveView();render();
    setTimeout(function(){const el2=findTaskEl(id);if(el2)scrollHi(el2);},60);
  }
  $("notiList").addEventListener("click",function(e){const db=e.target.closest("[data-ndel]");if(db){e.stopPropagation();delNoti(+db.dataset.ndel);return;}const it=e.target.closest("[data-tid]");if(!it)return;const id=it.dataset.tid;const t=tasks.find(x=>x.id===id);if(!t){toast("삭제된 할 일이에요",true);return;}closeNoti();focusTask(id);});
  notiTimer=setInterval(checkNoti,30000);
  signal.addEventListener("abort",function(){if(notiTimer)clearInterval(notiTimer);});

  /* delete confirm */
  let pendingConfirm=null;
  function confirmAsk(title,body,okLabel,onOk){pendingConfirm=onOk;$("cfTitle").textContent=title;$("cfBody").textContent=body;$("cfOk").textContent=okLabel;$("confirmModal").classList.add("open");}
  function closeConfirm(){pendingConfirm=null;$("confirmModal").classList.remove("open");}
  function askDelete(id){confirmAsk("휴지통으로 보낼까요?","휴지통에서 복원하거나 영구 삭제할 수 있어요.","휴지통으로",function(){del(id);toast("휴지통으로 옮겼어요");});}
  $("cfOk").onclick=function(){const fn=pendingConfirm;closeConfirm();if(fn)fn();};
  $("cfCancel").onclick=closeConfirm;
  $("confirmModal").addEventListener("mousedown",function(e){if(e.target===$("confirmModal"))closeConfirm();});

  /* edit modal */
  const mEditor=EditorFactory($("emEditor"),$("emSlash"),$("editModal").querySelector(".sheet"));
  const mPri=makePriRadio($("emPriGroup"));
  let mRange={start:null,end:null,startTime:"09:00",endTime:"18:00"}, mDone=false, mIncHol=false;
  function paintMDone(){$("emDone").classList.toggle("on",mDone);$("emDoneLbl").textContent=mDone?"완료됨":"완료로 표시";}
  $("emDone").onclick=function(){mDone=!mDone;paintMDone();};
  $("emIncHolBtn").onclick=function(){mIncHol=!mIncHol;$("emIncHolSw").classList.toggle("on",mIncHol);};
  function paintMRange(){const lab=labelRangeT(mRange.start,mRange.end,mRange.startTime,mRange.endTime);const el=$("emRangeText");if(lab){el.textContent=lab;el.classList.remove("empty");}else{el.textContent="날짜와 시간 선택";el.classList.add("empty");}$("emRangeField").classList.remove("err");}
  $("emRangeField").addEventListener("click",function(){$("emRangeField").classList.remove("err");openCal($("emRangeField"),mRange,function(s,e,st,et){mRange.start=s;mRange.end=e;mRange.startTime=st||mRange.startTime;mRange.endTime=et||mRange.endTime;paintMRange();});});
  $("emTitle").addEventListener("input",function(){$("emTitle").classList.remove("err");});

  function openEdit(id){const t=tasks.find(x=>x.id===id);if(!t)return;editingId=id;$("emTitle").value=t.title;$("emTitle").classList.remove("err");mEditor.loadMarkdown(t.body);mEditor.clearErr();mRange={start:t.start,end:t.end,startTime:t.startTime||"09:00",endTime:t.endTime||"18:00"};paintMRange();mPri.set(t.pri);mDone=t.done;paintMDone();mIncHol=!!t.incHol;$("emIncHolSw").classList.toggle("on",mIncHol);mNotifyTF.set(t.notifyTime||"09:00");$("emLogBtn").style.display=(t.history&&t.history.length)?"inline-flex":"none";$("editModal").classList.add("open");}
  function closeEdit(){$("editModal").classList.remove("open");editingId=null;}
  function dateText(t){const l=labelRangeT(t.start,t.end,t.startTime,t.endTime);return l||"(없음)";}
  function saveEdit(){
    const t=tasks.find(x=>x.id===editingId);if(!t)return;
    const miss=[];
    const title=$("emTitle").value.trim();
    if(!title){miss.push("제목");$("emTitle").classList.add("err");}
    const body=mEditor.serialize();
    if(!body){miss.push("내용");mEditor.markErr();}
    if(!(mRange.start&&mRange.end)){miss.push("기간");$("emRangeField").classList.add("err");}
    if(!mPri.get()){miss.push("우선순위");mPri.markErr();}
    if(miss.length){toast(miss.join(", ")+" 입력이 필요해요",true);return;}
    const nNotifyTime=mNotifyTF.get();
    const nv={title:title,body:body,start:mRange.start,end:mRange.end,startTime:mRange.startTime,endTime:mRange.endTime,pri:mPri.get(),incHol:mIncHol};
    const contentChanged = t.title!==nv.title || (t.body||"")!==(nv.body||"") || dateText(t)!==dateText(nv) || t.pri!==nv.pri || !!t.incHol!==!!nv.incHol;
    const anyChanged = contentChanged || t.done!==mDone || (t.notifyTime||"09:00")!==nNotifyTime;
    if(contentChanged){ t.history.push({at:Date.now(),title:t.title,body:t.body,start:t.start,end:t.end,startTime:t.startTime,endTime:t.endTime,pri:t.pri,incHol:t.incHol}); }
    t.title=nv.title;t.body=nv.body;t.start=nv.start;t.end=nv.end;t.startTime=nv.startTime;t.endTime=nv.endTime;t.pri=nv.pri;t.incHol=nv.incHol;t.notify=true;t.notifyTime=nNotifyTime;t.done=mDone;
    const sr=$("editModal").querySelector(".sheet").getBoundingClientRect();
    save();render();closeEdit();
    requestAnimationFrame(function(){flyToTaskRect(sr,t.id);});
    toast(anyChanged?"수정 내용을 저장했어요":"변경사항이 없습니다");
  }
  $("emSave").onclick=saveEdit;$("emCancel").onclick=closeEdit;$("emClose").onclick=closeEdit;
  $("editModal").addEventListener("mousedown",function(e){if(e.target===$("editModal"))closeEdit();});
  $("emLogBtn").onclick=function(){if(editingId)openLog(editingId);};

  /* log modal */
  let logTaskId=null, logSel=0;
  function fmtTime(ts){const d=new Date(ts);return (d.getMonth()+1)+"월 "+d.getDate()+"일 "+pad(d.getHours())+":"+pad(d.getMinutes());}
  function buildVersions(t){
    const cur={current:true,title:t.title,body:t.body,start:t.start,end:t.end,startTime:t.startTime,endTime:t.endTime,pri:t.pri};
    const arch=(t.history||[]).slice().reverse().map(function(h){return {current:false,at:h.at,legacy:!("title" in h),title:h.title,body:h.body,start:h.start,end:h.end,startTime:h.startTime,endTime:h.endTime,pri:h.pri};});
    return [cur].concat(arch);
  }
  function versionPreview(v){
    if(v.legacy)return '<div class="lp-legacy">이전 형식의 기록이라 미리보기를 제공하지 않아요.</div>';
    const period=labelRangeT(v.start,v.end,v.startTime,v.endTime)||"(기간 없음)";
    const body=mdToHtml(v.body)||'<span class="lp-empty">내용 없음</span>';
    const rb=v.current?'':'<button class="btn-primary lp-rb" id="logRollback">이 버전으로 롤백</button>';
    return '<div class="lp-h"><div class="lp-title">'+esc(v.title||"(제목 없음)")+'</div>'+rb+'</div>'
      +'<div class="lp-meta">'+esc(period)+' · 우선순위 '+(priTxt[v.pri]||"-")+'</div>'
      +'<div class="md open lp-body">'+body+'</div>';
  }
  function renderLog(){
    const t=tasks.find(x=>x.id===logTaskId);if(!t)return;
    const vs=buildVersions(t);
    if(logSel>=vs.length)logSel=0;
    $("logList").innerHTML=vs.map(function(v,i){const label=v.current?"현재 버전":fmtTime(v.at);const sub=v.current?"지금":"이 시점으로 저장된 내용";return '<button class="logitem '+(i===logSel?"on":"")+'" data-i="'+i+'"><div class="lt">'+label+'</div><div class="ls">'+sub+'</div></button>';}).join("");
    $("logPreview").innerHTML=versionPreview(vs[logSel]);
  }
  function openLog(id){logTaskId=id;logSel=0;renderLog();$("logModal").classList.add("open");}
  function closeLog(){$("logModal").classList.remove("open");}
  function doRollback(){
    const t=tasks.find(x=>x.id===logTaskId);if(!t)return;const vs=buildVersions(t);const v=vs[logSel];if(!v||v.current||v.legacy)return;
    t.history.push({at:Date.now(),title:t.title,body:t.body,start:t.start,end:t.end,startTime:t.startTime,endTime:t.endTime,pri:t.pri});
    t.title=v.title;t.body=v.body;t.start=v.start;t.end=v.end;t.startTime=v.startTime;t.endTime=v.endTime;t.pri=v.pri;
    save();render();logSel=0;renderLog();toast("선택한 버전으로 롤백했어요");
  }
  $("logModal").addEventListener("click",function(e){const item=e.target.closest(".logitem");if(item){logSel=+item.dataset.i;renderLog();return;}if(e.target.closest("#logRollback")){doRollback();return;}});
  $("lmClose").onclick=closeLog;$("logModal").addEventListener("mousedown",function(e){if(e.target===$("logModal"))closeLog();});

  document.addEventListener("keydown",function(e){if(e.key==="Escape"){if($("helpModal").classList.contains("open"))$("helpModal").classList.remove("open");else if($("resetModal").classList.contains("open"))$("resetModal").classList.remove("open");else if($("relModal").classList.contains("open"))closeRel();else if($("leaveModal").classList.contains("open"))closeLeave();else if($("notiModal").classList.contains("open"))closeNoti();else if($("trashModal").classList.contains("open"))closeTrash();else if($("confirmModal").classList.contains("open"))closeConfirm();else if($("logModal").classList.contains("open"))closeLog();else if($("editModal").classList.contains("open"))closeEdit();}},{signal});

  /* controls */
  function syncViewSeg(){document.querySelectorAll("#viewSeg button").forEach(function(b){b.classList.toggle("on",b.dataset.v===viewMode);});}
  function syncLayoutSeg(){document.querySelectorAll("#listLayoutSeg button").forEach(function(b){b.classList.toggle("on",b.dataset.ll===listLayout);});}
  function syncCalModeSeg(){document.querySelectorAll("#calModeSeg button").forEach(function(b){b.classList.toggle("on",b.dataset.cm===calMode);});}
  document.querySelectorAll("#viewSeg button").forEach(function(b){b.onclick=function(){viewMode=b.dataset.v;syncViewSeg();saveView();saveSettings();render();};});
  document.querySelectorAll("#listLayoutSeg button").forEach(function(b){b.onclick=function(){listLayout=b.dataset.ll;syncLayoutSeg();saveLayout();saveSettings();render();};});
  document.querySelectorAll("#filterSeg button").forEach(function(b){b.onclick=function(){document.querySelectorAll("#filterSeg button").forEach(x=>x.classList.remove("on"));b.classList.add("on");filter=b.dataset.f;render();};});
  document.querySelectorAll("#calModeSeg button").forEach(function(b){b.onclick=function(){calMode=b.dataset.cm;try{localStorage.setItem(CMKEY,calMode);}catch(e){}syncCalModeSeg();saveSettings();render();};});
  $("listHideBtn").onclick=function(){listHideDone=!listHideDone;$("listHideSw").classList.toggle("on",!listHideDone);saveSettings();render();};
  $("priGroupBtn").onclick=function(){priGroup=!priGroup;$("priGroupSw").classList.toggle("on",priGroup);saveSettings();render();};

  // 폼 도움말(?) — 데스크탑은 hover 툴팁(CSS), 클릭 시 모달(모바일 포함)
  document.querySelectorAll(".fhelp").forEach(function(b){b.onclick=function(e){e.preventDefault();e.stopPropagation();const tip=b.querySelector(".fhelp-tip");$("hmTitle").textContent=b.dataset.help||"도움말";$("hmBody").textContent=tip?tip.textContent:"";$("helpModal").classList.add("open");};});
  $("hmClose").onclick=function(){$("helpModal").classList.remove("open");};
  $("hmDone").onclick=function(){$("helpModal").classList.remove("open");};
  $("helpModal").addEventListener("mousedown",function(e){if(e.target===$("helpModal"))$("helpModal").classList.remove("open");});

  // 레이아웃 토글/정렬 표시 동기화 (DB 설정 로드 후 등)
  function syncLayoutToggles(){
    $("listHideSw").classList.toggle("on",!listHideDone);
    $("priGroupSw").classList.toggle("on",priGroup);
    $("sortDot").style.display=(sortBy&&sortBy!=="created")?"block":"none";
  }

  /* ===== 정렬 드롭다운 ===== */
  function sortPopOpen(){return $("sortPop").classList.contains("open");}
  function positionSortPop(){const r=$("sortBtn").getBoundingClientRect();const pop=$("sortPop");const pw=pop.offsetWidth||260;let left=r.left,top=r.bottom+8;if(left+pw>window.innerWidth-8)left=window.innerWidth-8-pw;if(left<8)left=8;pop.style.left=left+"px";pop.style.top=top+"px";const ph=pop.offsetHeight;if(top+ph>window.innerHeight-8){const nt=r.top-ph-8;pop.style.top=(nt<8?8:nt)+"px";}}
  function renderSortList(){const q=($("sortSearch").value||"").trim().toLowerCase();const opts=SORT_OPTS.filter(function(o){return!q||o.label.toLowerCase().indexOf(q)>=0||o.k.toLowerCase().indexOf(q)>=0;});$("sortList").innerHTML=opts.length?opts.map(function(o){return '<button class="sortopt'+(o.k===sortBy?" sel":"")+'" data-sk="'+o.k+'"><span class="sortopt-l">'+esc(o.label)+'</span>'+(o.k===sortBy?'<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>':"")+'</button>';}).join(""):'<div class="sortopt-empty">결과 없음</div>';}
  function openSortPop(){$("sortPop").classList.add("open");$("sortSearch").value="";renderSortList();positionSortPop();setTimeout(function(){$("sortSearch").focus();},0);}
  function closeSortPop(){$("sortPop").classList.remove("open");}
  function applySort(k){sortBy=k;syncLayoutToggles();saveSettings();closeSortPop();render();}
  $("sortBtn").onclick=function(e){e.stopPropagation();if(sortPopOpen())closeSortPop();else openSortPop();};
  $("sortSearch").addEventListener("input",function(){renderSortList();});
  $("sortSearch").addEventListener("keydown",function(e){if(e.key==="Enter"){const first=$("sortList").querySelector(".sortopt");if(first){applySort(first.dataset.sk);}}else if(e.key==="Escape"){closeSortPop();}});
  $("sortList").addEventListener("click",function(e){const b=e.target.closest(".sortopt");if(b)applySort(b.dataset.sk);});
  $("sortReset").onclick=function(){applySort("created");};
  document.addEventListener("mousedown",function(e){if(sortPopOpen()&&!$("sortPop").contains(e.target)&&!$("sortBtn").contains(e.target))closeSortPop();},{signal});
  window.addEventListener("resize",function(){if(sortPopOpen())positionSortPop();},{signal});
  function calShift(dir){const d=new Date((calRef||todayISO())+"T00:00:00");if(calMode==="month")d.setMonth(d.getMonth()+dir);else if(calMode==="week")d.setDate(d.getDate()+dir*7);else d.setDate(d.getDate()+dir);calRef=ymd(d);}
  $("calNav").addEventListener("click",function(e){const b=e.target.closest("[data-cn]");if(b){calShift(+b.dataset.cn);render();}});
  function updateControls(){
    const isList=viewMode==="list", isCal=viewMode==="calendar", isKan=viewMode==="kanban";
    $("listLayoutSeg").style.display=isList?"flex":"none";
    $("sortBtn").style.display=(isList||isKan)?"inline-flex":"none";
    $("priGroupBtn").style.display=isList?"inline-flex":"none";
    $("listHideBtn").style.display=isList?"inline-flex":"none";
    $("calNav").style.display=isCal?"flex":"none";
    if(!isList&&!isKan&&sortPopOpen())closeSortPop();
  }

  const CHK='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M20 6L9 17l-5-5"/></svg>';
  const CAL='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>';
  const TRASH='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>';
  const PENCIL='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>';
  function dateLabel(t){const s=showTime?" "+t.startTime:"",e=showTime?" "+t.endTime:"";if(t.start&&t.end){if(t.start===t.end)return '<b>'+fmtMD(t.start)+'</b>'+(showTime?" "+t.startTime+"~"+t.endTime:"");return '<b>'+fmtMD(t.start)+'</b>'+s+' → <b>'+fmtMD(t.end)+'</b>'+e;}if(t.end)return "~ <b>"+fmtMD(t.end)+"</b>";if(t.start)return '<b>'+fmtMD(t.start)+'</b> 시작';return"";}
  function pillHtml(t){const dl=dateLabel(t);if(!dl)return"";const di=dueInfo(refDate(t));const dd=di?'<span class="dday'+(di.cls?" "+di.cls:"")+'">'+di.label+'</span>':"";return '<span class="due">'+CAL+dl+'</span>'+dd;}
  function cfChip(t){const cfs=taskConfirms(t);if(!cfs.length)return"";const done=cfs.filter(c=>c.done).length;return '<span class="cf-chip'+(done===cfs.length?" all":"")+'">컨펌 '+done+'/'+cfs.length+'</span>';}
  function metaHtml(t,withEdited){const e=(withEdited&&t.history&&t.history.length)?'<span class="edited" data-act="log">수정됨 '+t.history.length+'회</span>':"";return '<div class="meta"><span class="pri">'+priIcon(t.pri)+priTxt[t.pri]+'</span>'+pillHtml(t)+cfChip(t)+e+'</div>';}
  // 칸반: 중요도 한 줄, 날짜+D-day 같은 줄
  function kanbanMeta(t){return '<div class="kmeta"><div class="kmeta-row"><span class="pri">'+priIcon(t.pri)+priTxt[t.pri]+'</span>'+cfChip(t)+'</div><div class="kmeta-row">'+pillHtml(t)+'</div></div>';}
  function emptyHtml(msg){return '<div class="empty"><svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><p>'+msg+'</p></div>';}

  // 리스트/카드 (#14 순서: 제목→내용→추가정보, #15 카드 자세히보기, #17 완료 숨기기)
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

  function renderListCards(){
    const isCard=listLayout==="cards";
    const open=(!isCard)||cardsExpanded;
    function taskLi(t){
      const bh=mdToHtml(t.body);const body=bh?'<div class="md'+(open?" open":"")+'">'+bh+'</div>':"";
      const more=(isCard&&bh)?'<button class="cardmore" data-act="exp">'+(cardsExpanded?"내용 닫기":"자세히 보기")+'</button>':"";
      return '<li class="task clickable '+(t.done?"done":"")+'" data-id="'+t.id+'" data-act="e"><button class="check" data-act="t" aria-label="완료" title="완료 처리">'+CHK+'</button><div class="body"><div class="title">'+esc(t.title)+'</div>'+body+metaHtml(t,true)+more+'</div><div class="acts"><button class="iconbtn" data-act="d" title="삭제">'+TRASH+'</button></div></li>';
    }
    function ul(items){return '<ul class="list'+(isCard?" cards":"")+'">'+items.map(taskLi).join("")+'</ul>';}
    let arr=tasks;
    if(filter==="active")arr=arr.filter(t=>!t.done);else if(filter==="done")arr=arr.filter(t=>t.done);
    if(listHideDone)arr=arr.filter(t=>!t.done);
    arr=sortT(arr);
    if(!arr.length){$("view").innerHTML=emptyHtml(filter==="done"?"완료된 항목이 없어요":(filter==="active"||listHideDone)?"진행 중인 일이 없어요":"위에서 새 할 일을 추가해보세요");return;}
    if(priGroup){
      const groups=[{k:"high",l:"높음"},{k:"mid",l:"중간"},{k:"low",l:"낮음"}];
      let html="";
      groups.forEach(function(g){const items=arr.filter(t=>t.pri===g.k);if(!items.length)return;html+='<div class="prigroup"><div class="prigroup-hd"><span class="pri">'+priIcon(g.k)+priTxt[g.k]+'</span><span class="prigroup-n">'+items.length+'</span></div>'+ul(items)+'</div>';});
      $("view").innerHTML=html;return;
    }
    $("view").innerHTML=ul(arr);
  }

  // 칸반 (#4 카드 클릭 → 수정, 연필 제거)
  const COLS=[{k:"todo",l:"시작전"},{k:"doing",l:"진행 중"},{k:"done",l:"완료"},{k:"drop",l:"Drop"}];
  function renderKanban(){
    const g={todo:[],doing:[],done:[],drop:[]};tasks.forEach(t=>g[classify(t)].push(t));Object.keys(g).forEach(k=>g[k]=sortT(g[k]));
    const cols=COLS.map(function(c){const items=g[c.k];const cards=items.length?items.map(function(t){return '<div class="kcard '+(t.done?"done":"")+'" draggable="true" data-id="'+t.id+'" data-act="e"><div class="krow"><button class="check sm" data-act="t" aria-label="완료" title="완료 처리">'+CHK+'</button><div class="ktitle">'+esc(t.title)+'</div></div>'+kanbanMeta(t)+'</div>';}).join(""):'<div class="kempty">없음</div>';return '<div class="kcol"><div class="khd"><span>'+c.l+'</span><span class="kcount">'+items.length+'</span></div><div class="kbody" data-col="'+c.k+'">'+cards+'</div></div>';}).join("");
    $("view").innerHTML='<div class="khint">카드를 클릭하면 수정, 완료 칸으로 끌어다 놓으면 완료 처리돼요. 분류는 기간·오늘 날짜로 자동 결정됩니다.</div><div class="kanban">'+cols+'</div>';
  }

  /* 달력 (#5 진행중 색상, #11 일/주/월) */
  function calToolbar(showWeekday){
    return '<div class="cv-toolbar">'
     +(showWeekday?'<button class="swrow" data-cal="weekday"><span class="swlbl">주말 보기</span><span class="switch '+(calDays==="all"?"on":"")+'"><span class="knob"></span></span></button>':'')
     +'<button class="swrow" data-cal="hidedone"><span class="swlbl">완료 숨기기</span><span class="switch '+(calHideDone?"on":"")+'"><span class="knob"></span></span></button>'
     +'</div>';
  }
  function barClass(t){let c="cv-bar";if(t.done)c+=" done";else if(classify(t)==="doing")c+=" doing";return c;}
  // 본문(마크다운)에서 n차컨펌 추출: <!--cf0/1-->날짜  → [{date,done,label}]
  function taskConfirms(t){const out=[];(t.body||"").split("\n").forEach(function(line){const m=line.match(/^<!--cf([01])-->(.*)$/);if(!m)return;const txt=m[2].trim();const dm=txt.match(/(\d{4}|\d{2})[.\/-](\d{1,2})[.\/-](\d{1,2})/);if(!dm)return;let y=+dm[1];if(dm[1].length===2)y+=2000;out.push({date:y+"-"+pad(+dm[2])+"-"+pad(+dm[3]),done:m[1]==="1",label:txt});});return out;}
  // 막대 안 중간컨펌 번호 배지 (해당 날짜 위치)
  function confirmBadges(t,colDate,minC,maxC){
    const cfs=taskConfirms(t);if(!cfs.length)return"";
    let s="";
    cfs.forEach(function(cf,ci){
      let col=-1;for(let c=minC;c<=maxC;c++){if(colDate[c]===cf.date){col=c;break;}}
      if(col<0)return;
      const relX=((col-minC+0.5)/(maxC-minC+1))*100;
      s+='<span class="cv-cf'+(cf.done?" done":"")+'" style="left:'+relX+'%" title="'+esc((ci+1)+"차 · "+cf.label)+'">'+(cf.done?"✓":(ci+1))+'</span>';
    });
    return s;
  }
  // n차컨펌 틱(얇은 선 + 작은 번호) — 막대 하단 줄에 표시(글자와 안 겹침)
  function confirmTicks(cfs,colDate,minC,maxC){
    let s="";
    cfs.forEach(function(cf,ci){
      let col=-1;for(let c=minC;c<=maxC;c++){if(colDate[c]===cf.date){col=c;break;}}
      if(col<0)return;
      const relX=((col-minC)/(maxC-minC+1))*100;
      s+='<span class="cv-tick'+(cf.done?" done":"")+'" style="left:'+relX+'%" title="'+esc((ci+1)+"차 · "+cf.label)+'"><b>'+(ci+1)+(cf.done?"✓":"")+'</b><i></i></span>';
    });
    return s;
  }
  // 한 주(컬럼 ISO 배열)에 대한 세그먼트 + 레인 계산
  function weekSegs(colDate,N,evs){
    const segs=[];
    evs.forEach(function(t){
      const cov=[];for(let c=0;c<N;c++){if(colDate[c]>=t.start&&colDate[c]<=t.end&&(t.incHol||!isExcludedDay(colDate[c])))cov.push(c);}
      if(!cov.length)return;
      function flush(r){const minC=r[0],maxC=r[r.length-1];segs.push({t:t,minC:minC,maxC:maxC,isStart:colDate[minC]===t.start,isEnd:colDate[maxC]===t.end});}
      let run=[cov[0]];for(let k=1;k<cov.length;k++){if(cov[k]===cov[k-1]+1)run.push(cov[k]);else{flush(run);run=[cov[k]];}}flush(run);
    });
    // 같은 할 일은 항상 같은 줄(lane). 한 주에 등장하는 할 일을 전역 순서대로 정렬해 고정 배치
    // → 공휴일로 막대가 끊겨도 위아래 순서가 바뀌지 않는다.
    const idx={};tasks.forEach(function(t,i){idx[t.id]=i;});
    const present=[];segs.forEach(function(s){if(present.indexOf(s.t.id)<0)present.push(s.t.id);});
    present.sort(function(a,b){return (idx[a]==null?1e9:idx[a])-(idx[b]==null?1e9:idx[b]);});
    const laneOf={};present.forEach(function(id,i){laneOf[id]=i;});
    segs.forEach(function(sg){sg.lane=laneOf[sg.t.id];});
    return {segs:segs,lanes:present.length};
  }

  function renderCalMonth(){
    const ref=new Date((calRef||todayISO())+"T00:00:00"),y=ref.getFullYear(),m=ref.getMonth();
    $("calTitle").textContent=y+"년 "+(m+1)+"월";
    const first=new Date(y,m,1),sd=first.getDay(),dim=new Date(y,m+1,0).getDate(),todayI=todayISO();
    const cells=Math.ceil((sd+dim)/7)*7, weeks=cells/7, gridStart=new Date(y,m,1-sd);
    const visDows=calDays==="weekday"?[1,2,3,4,5]:[0,1,2,3,4,5,6], N=visDows.length;
    const NAMES=["일","월","화","수","목","금","토"];
    const evs=tasks.filter(t=>t.start&&t.end&&(!calHideDone||!t.done));
    let html='<div class="calview">'+calToolbar(true);
    html+='<div class="cv-wd" style="grid-template-columns:repeat('+N+',1fr)">'+visDows.map(dw=>'<span>'+NAMES[dw]+'</span>').join("")+'</div>';
    for(let w=0;w<weeks;w++){
      const ws=new Date(gridStart);ws.setDate(gridStart.getDate()+w*7);
      const colDate=[];for(let c=0;c<N;c++){const dt=new Date(ws);dt.setDate(ws.getDate()+visDows[c]);colDate.push(ymd(dt));}
      const wk=weekSegs(colDate,N,evs);const segs=wk.segs;
      const anyCf=segs.some(function(sg){return taskConfirms(sg.t).length>0;});const rowH=anyCf?34:24;
      const cellH=Math.max(104,30+wk.lanes*rowH+6);
      html+='<div class="cv-week"><div class="cv-row" style="grid-template-columns:repeat('+N+',1fr)">';
      for(let c=0;c<N;c++){const dt=new Date(ws);dt.setDate(ws.getDate()+visDows[c]);const iso=colDate[c];const inM=dt.getMonth()===m;const hol=HOLIDAYS[iso];const dow=dt.getDay();let cls="cv-dc";if(!inM)cls+=" out";if(dow===0||dow===6||hol)cls+=" wk";if(dow===0)cls+=" sun";if(hol)cls+=" hol";const lvh=inM?leaveHoursOn(iso):0;if(lvh)cls+=" leave";const lvbg=lvh?';background:linear-gradient(to top,var(--soft-bg) '+Math.min(100,Math.round(lvh/8*100))+'%,transparent 0)':'';const tb=iso===todayI?" today":"";html+='<div class="'+cls+'" style="min-height:'+cellH+'px'+lvbg+'"><span class="cv-d'+tb+'">'+dt.getDate()+'</span>'+(hol&&inM?'<div class="cv-hol">'+esc(hol)+'</div>':"")+(lvh?'<span class="cv-lvtag">'+leaveLabel(lvh)+'</span>':"")+'</div>';}
      html+='</div>';
      segs.forEach(function(sg){const cf=taskConfirms(sg.t),hasCf=cf.length>0,barH=hasCf?32:20;const leftP=sg.minC/N*100,widthP=(sg.maxC-sg.minC+1)/N*100;const top=30+sg.lane*rowH;const li=sg.isStart?4:0,ri=sg.isEnd?4:0;let bcls=barClass(sg.t)+(hasCf?" has-cf":"");if(sg.isStart)bcls+=" bstart";if(sg.isEnd)bcls+=" bend";const lbl=(showTime&&sg.isStart?sg.t.startTime+" ":"")+sg.t.title;let inner='<span class="cv-bartitle">'+esc(lbl)+'</span>'+(hasCf?'<span class="cv-cfrow">'+confirmTicks(cf,colDate,sg.minC,sg.maxC)+'</span>':"");html+='<div class="'+bcls+'" data-act="e" data-id="'+sg.t.id+'" title="'+esc(sg.t.title)+'" style="left:calc('+leftP+'% + '+li+'px);width:calc('+widthP+'% - '+(li+ri)+'px);top:'+top+'px;height:'+barH+'px">'+inner+'</div>';});
      html+='</div>';
    }
    html+='</div>';
    $("view").innerHTML=html;
  }

  function renderCalWeek(){
    const ref=new Date((calRef||todayISO())+"T00:00:00"),sd=ref.getDay();
    const ws=new Date(ref);ws.setDate(ref.getDate()-sd);
    const visDows=calDays==="weekday"?[1,2,3,4,5]:[0,1,2,3,4,5,6], N=visDows.length;
    const NAMES=["일","월","화","수","목","금","토"];
    const todayI=todayISO();
    const colDate=[],colObj=[];for(let c=0;c<N;c++){const dt=new Date(ws);dt.setDate(ws.getDate()+visDows[c]);colDate.push(ymd(dt));colObj.push(dt);}
    $("calTitle").textContent=fmtMD(colDate[0])+" ~ "+fmtMD(colDate[N-1]);
    const evs=tasks.filter(t=>t.start&&t.end&&(!calHideDone||!t.done));
    const wk=weekSegs(colDate,N,evs);const segs=wk.segs;
    const anyCf=segs.some(function(sg){return taskConfirms(sg.t).length>0;});const rowH=anyCf?36:26;
    const cellH=Math.max(220,40+wk.lanes*rowH+8);
    let html='<div class="calview">'+calToolbar(true);
    html+='<div class="cv-wd" style="grid-template-columns:repeat('+N+',1fr)">'+visDows.map(dw=>'<span>'+NAMES[dw]+'</span>').join("")+'</div>';
    html+='<div class="cv-week cv-weekbig"><div class="cv-row" style="grid-template-columns:repeat('+N+',1fr)">';
    for(let c=0;c<N;c++){const iso=colDate[c],dt=colObj[c];const hol=HOLIDAYS[iso];const dow=dt.getDay();let cls="cv-dc";if(dow===0||dow===6||hol)cls+=" wk";if(dow===0)cls+=" sun";if(hol)cls+=" hol";const lvh=leaveHoursOn(iso);if(lvh)cls+=" leave";const lvbg=lvh?';background:linear-gradient(to top,var(--soft-bg) '+Math.min(100,Math.round(lvh/8*100))+'%,transparent 0)':'';const tb=iso===todayI?" today":"";html+='<div class="'+cls+'" style="min-height:'+cellH+'px'+lvbg+'"><span class="cv-d'+tb+'">'+dt.getDate()+'</span>'+(hol?'<div class="cv-hol">'+esc(hol)+'</div>':"")+(lvh?'<span class="cv-lvtag">'+leaveLabel(lvh)+'</span>':"")+'</div>';}
    html+='</div>';
    segs.forEach(function(sg){const cf=taskConfirms(sg.t),hasCf=cf.length>0,barH=hasCf?34:23;const leftP=sg.minC/N*100,widthP=(sg.maxC-sg.minC+1)/N*100;const top=40+sg.lane*rowH;const li=sg.isStart?4:0,ri=sg.isEnd?4:0;let bcls=barClass(sg.t)+" big"+(hasCf?" has-cf":"");if(sg.isStart)bcls+=" bstart";if(sg.isEnd)bcls+=" bend";const lbl=(showTime&&sg.isStart?sg.t.startTime+" ":"")+sg.t.title;let inner='<span class="cv-bartitle">'+esc(lbl)+'</span>'+(hasCf?'<span class="cv-cfrow">'+confirmTicks(cf,colDate,sg.minC,sg.maxC)+'</span>':"");html+='<div class="'+bcls+'" data-act="e" data-id="'+sg.t.id+'" title="'+esc(sg.t.title)+'" style="left:calc('+leftP+'% + '+li+'px);width:calc('+widthP+'% - '+(li+ri)+'px);top:'+top+'px;height:'+barH+'px">'+inner+'</div>';});
    html+='</div></div>';
    $("view").innerHTML=html;
  }

  function renderCalDay(){
    const day=calRef||todayISO(),dt=new Date(day+"T00:00:00"),wd=["일","월","화","수","목","금","토"];
    $("calTitle").textContent=(dt.getMonth()+1)+"월 "+dt.getDate()+"일 ("+wd[dt.getDay()]+")";
    const dayExcluded=isExcludedDay(day);
    const evs=tasks.filter(t=>t.start&&t.end&&t.start<=day&&day<=t.end&&(!calHideDone||!t.done)&&(t.incHol||!dayExcluded));
    const items=evs.map(function(t){let sM=(day===t.start)?toMin(t.startTime):0;let eM=(day===t.end)?toMin(t.endTime):24*60;sM=Math.max(0,sM);eM=Math.min(24*60,eM);if(eM<=sM)eM=sM+30;return {t:t,sM:sM,eM:eM};});
    items.sort((a,b)=>a.sM-b.sM||a.eM-b.eM);
    const lanes=[];items.forEach(function(it){let placed=-1;for(let li=0;li<lanes.length;li++){if(lanes[li].every(x=>it.sM>=x.eM||it.eM<=x.sM)){placed=li;break;}}if(placed<0){placed=lanes.length;lanes.push([]);}lanes[placed].push(it);it.lane=placed;});
    const laneN=Math.max(1,lanes.length),HH=46,totalH=24*HH;
    let grid="";for(let hh=0;hh<24;hh++){grid+='<div class="cv-hour" style="top:'+(hh*HH)+'px"><span class="cv-hl">'+pad(hh)+':00</span></div>';}
    let now="";if(day===todayISO()){const n=new Date();const nm=n.getHours()*60+n.getMinutes();now='<div class="cv-now" style="top:'+(nm/60*HH)+'px"></div>';}
    const blocks=items.map(function(it){const top=it.sM/60*HH,h=Math.max(24,(it.eM-it.sM)/60*HH);const w=100/laneN,left=it.lane*w;let cls="cv-evt";if(it.t.done)cls+=" done";else if(classify(it.t)==="doing")cls+=" doing";const tm=(day===it.t.start?it.t.startTime:"00:00")+" ~ "+(day===it.t.end?it.t.endTime:"24:00");return '<div class="'+cls+'" data-act="e" data-id="'+it.t.id+'" style="top:'+top+'px;height:'+h+'px;left:calc('+left+'% + 56px + 3px);width:calc('+w+'% - 8px)"><div class="cv-et">'+esc(it.t.title)+'</div><div class="cv-etm">'+tm+'</div></div>';}).join("");
    const dlvh=leaveHoursOn(day);
    let html='<div class="calview">'+calToolbar(false)+(dlvh?'<div class="cv-dayleave">🏖 연차 — '+leaveLabel(dlvh)+' ('+dlvh+'시간)</div>':"")+'<div class="cv-day" style="height:'+totalH+'px">'+grid+now+blocks+(items.length?"":'<div class="cv-day-empty">이 날짜에 일정이 없어요</div>')+'</div></div>';
    $("view").innerHTML=html;
  }

  function renderCalendarView(){syncCalModeSeg();if(calMode==="day")renderCalDay();else if(calMode==="week")renderCalWeek();else renderCalMonth();}

  function updateStats(){const done=tasks.filter(t=>t.done).length,total=tasks.length,active=total-done;$("summary").textContent= total? "전체 "+total+"개 · 남은 일 "+active+"개" : "아직 할 일이 없어요";const tc=$("trashCount");if(tc)tc.style.display="none";}
  function render(){updateStats();paintLeaveBtn();updateControls();if(viewMode==="kanban")renderKanban();else if(viewMode==="calendar")renderCalendarView();else if(viewMode==="dash")renderDashboard();else renderListCards();}

  $("view").addEventListener("click",function(e){
    const sw=e.target.closest("[data-cal]");if(sw){const k=sw.dataset.cal;if(k==="weekday")calDays=calDays==="weekday"?"all":"weekday";else if(k==="hidedone")calHideDone=!calHideDone;saveSettings();render();return;}
    const b=e.target.closest("[data-act]");if(!b)return;const host=b.closest("[data-id]");
    const a=b.dataset.act;
    if(a==="exp"){cardsExpanded=!cardsExpanded;render();return;}
    if(!host)return;const id=host.dataset.id;
    if(a==="t")toggle(id);else if(a==="d")askDelete(id);else if(a==="e")openEdit(id);else if(a==="log")openLog(id);
  });
  let dragId=null;
  $("view").addEventListener("dragstart",function(e){const c=e.target.closest(".kcard");if(!c)return;dragId=c.dataset.id;e.dataTransfer.effectAllowed="move";try{e.dataTransfer.setData("text/plain",dragId);}catch(_){}c.classList.add("dragging");});
  $("view").addEventListener("dragend",function(e){const c=e.target.closest(".kcard");if(c)c.classList.remove("dragging");document.querySelectorAll(".kbody.over").forEach(x=>x.classList.remove("over"));dragId=null;});
  $("view").addEventListener("dragover",function(e){const body=e.target.closest(".kbody");if(!body)return;e.preventDefault();e.dataTransfer.dropEffect="move";});
  $("view").addEventListener("dragenter",function(e){const body=e.target.closest(".kbody");if(body)body.classList.add("over");});
  $("view").addEventListener("dragleave",function(e){const body=e.target.closest(".kbody");if(body&&!body.contains(e.relatedTarget))body.classList.remove("over");});
  $("view").addEventListener("drop",function(e){const body=e.target.closest(".kbody");if(!body||!dragId)return;e.preventDefault();body.classList.remove("over");const t=tasks.find(x=>x.id===dragId);if(t){t.done=(body.dataset.col==="done");save();render();}dragId=null;});

  // 달력: 여러 주/세그먼트에 걸친 같은 할 일을 동시에 하이라이트 (#1)
  function calHover(e,on){const bar=e.target.closest(".cv-bar, .cv-evt");if(!bar)return;const id=bar.dataset.id;if(!id)return;$("view").querySelectorAll('[data-id="'+id+'"]').forEach(x=>{if(x.classList.contains("cv-bar")||x.classList.contains("cv-evt"))x.classList.toggle("hl",on);});}
  $("view").addEventListener("mouseover",function(e){calHover(e,true);});
  $("view").addEventListener("mouseout",function(e){calHover(e,false);});

  const d=new Date(),wd=["일","월","화","수","목","금","토"];
  $("today").textContent=d.getFullYear()+"년 "+(d.getMonth()+1)+"월 "+d.getDate()+"일 ("+wd[d.getDay()]+")";
  calRef=todayISO();

  // 컨트롤 바 sticky(헤더 높이에 맞춰 top) + fixed footer 높이만큼 하단 패딩 확보
  const headerEl=document.querySelector("header"),controlsEl=document.querySelector(".controls"),footerEl=document.querySelector("footer");
  function syncStickyTop(){if(headerEl&&controlsEl)controlsEl.style.top=(headerEl.offsetHeight)+"px";if(footerEl)document.body.style.paddingBottom=(footerEl.offsetHeight+18)+"px";}
  syncStickyTop();
  window.addEventListener("resize",syncStickyTop,{signal});
  if(window.ResizeObserver){const ro=new ResizeObserver(syncStickyTop);ro.observe(headerEl);if(footerEl)ro.observe(footerEl);signal.addEventListener("abort",function(){ro.disconnect();});}

  cNotifyTF=makeTimeField($("notifyTimeField"),"09:00");mNotifyTF=makeTimeField($("emNotifyTimeField"),"09:00");
  paintCRange();syncViewSeg();syncLayoutSeg();syncCalModeSeg();paintBell();render();load();
}
