from pathlib import Path
import re, hashlib
p=Path('staging-v031/index.html')
t=p.read_text(encoding='utf-8')
old=hashlib.sha256(t.encode()).hexdigest()
if old!='63247d465be05a099d889bae5cf533f0917d0bf6307f4df7bf32d5db5a17692b':
    raise SystemExit(f'Unexpected source SHA256: {old}')
t=t.replace('Visual Credibility Prototype v0.3 —','Visual Credibility Prototype v0.3.1 — Pilot hotfix ·')
t=t.replace("const testKey='sreborn_usability_test_v02';","const testKey='sreborn_usability_test_v031';")

tasks="""  const TEST_TASKS=[
    {id:'T1',label:'자유롭게 둘러보기',prompt:'당장 시술받을 계획은 없습니다. 이 사이트를 잠깐 둘러보고, 그냥 읽어보고 싶은 글 하나를 골라 읽어보세요.',goal_type:'any_article',target:null},
    {id:'T2',label:'처짐 때문에 선택이 고민되는 상황',prompt:'얼굴 처짐이 신경 쓰이는데 HIFU와 고주파 중 어떤 쪽이 나에게 더 맞을지 알고 싶습니다. 이 사이트에서 도움이 될 내용을 찾아보세요.',goal_type:'target_article',target:'HIFU와 고주파, 무엇이 더 좋은지가 아니라 무엇이 더 맞는가'},
    {id:'T3',label:'리프팅을 반복해도 괜찮은지 궁금한 상황',prompt:'리프팅 시술을 반복하면 오히려 나중에 더 처질 수 있다는 말을 들었습니다. 사실인지 확인할 만한 내용을 찾아보세요.',goal_type:'target_article',target:'리프팅을 많이 하면 나중에 더 처질까?'},
    {id:'T4',label:'탈모 주사를 고려하는 상황',prompt:'탈모 주사를 고려하고 있습니다. 바로 주사를 맞기 전에 무엇을 먼저 확인해야 하는지 찾아보세요.',goal_type:'target_article',target:'탈모 주사를 맞으러 왔는데 혈액검사 이야기를 먼저 꺼낸 이유'},
    {id:'T5',label:'얼굴이 커 보이는 원인이 궁금한 상황',prompt:'요즘 얼굴이 커 보인다고 느낍니다. 단순히 지방 때문인지, 다른 원인도 있는지 알아볼 만한 내용을 찾아보세요.',goal_type:'target_article',target:'얼굴이 커 보일 때, 지방·근육·뼈·처짐 중 무엇부터 봐야 할까?'}
  ];"""
t,n=re.subn(r"  const TEST_TASKS=\[.*?\n  \];",tasks,t,count=1,flags=re.S)
assert n==1

session="""  function startTestSession(participant){
    const now=new Date().toISOString();
    const session={version:'0.3.1',pilot_hotfix:true,participant:(participant||'').trim()||('P-'+Date.now().toString().slice(-6)),started_at:now,completed_at:null,user_agent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight},task_index:0,status:'running',question_bar_found:false,tasks:TEST_TASKS.map(t=>({...t,status:'pending',started_at:null,completed_at:null,outcome:null,goal_reached:false,interactions:0,first_interaction:null,search_used:false,target_reached_at:null,time_to_target_ms:null,notes:'',events:[]}))};
    session.tasks[0].status='running';session.tasks[0].started_at=now;localStorage.setItem(testKey,JSON.stringify(session));track('usability_session_start',{participant:session.participant,version:session.version});track('usability_task_start',{task:session.tasks[0].id});renderTestPanel();return session;
  }
  function captureTestEvent(name,payload,ts){
    if(!isTestMode)return;const s=loadTest();if(!s||s.status!=='running')return;const t=s.tasks[s.task_index];if(!t||t.status!=='running')return;
    const interactions=new Set(['content_card_click','home_search_start','intent_select','concern_select','primary_next_click','branch_click','question_submit','booking_cta_click']);
    if(interactions.has(name)){t.interactions+=1;if(!t.first_interaction)t.first_interaction={name,payload,ts};}
    if(name==='home_search_start'||name==='search_submit'){t.search_used=true;if(name==='home_search_start')s.question_bar_found=true;}
    if(name==='content_open'&&!t.target_reached_at){const reached=t.goal_type==='any_article'||(t.goal_type==='target_article'&&payload?.title===t.target);if(reached){t.goal_reached=true;t.target_reached_at=ts;t.time_to_target_ms=new Date(ts)-new Date(t.started_at);}}
    t.events.push({name,payload,ts});if(t.events.length>100)t.events=t.events.slice(-100);localStorage.setItem(testKey,JSON.stringify(s));renderTestPanelIfOpen();
  }
"""
t,n=re.subn(r"  function startTestSession\(participant\).*?(?=  function track\(name,payload=\{\}\))",session,t,count=1,flags=re.S)
assert n==1

panel="""  function renderTestPanelIfOpen(){if(document.querySelector('#testPanel'))renderTestPanel()}
  function renderTestPanel(){
    if(!isTestMode)return;let p=document.querySelector('#testPanel');if(!p){p=document.createElement('aside');p.id='testPanel';p.className='test-panel';document.body.appendChild(p)}const s=loadTest();
    if(!s){p.innerHTML=`<div class=\"test-head\"><strong>모바일 사용성 확인</strong><button class=\"test-close\" id=\"testCollapse\" aria-label=\"과제 접기\">−</button></div><p>평소 홈페이지를 보듯 자유롭게 사용해 주세요. 정답을 맞히는 시험이 아닙니다.</p><label class=\"test-label\">테스트 코드<input id=\"testParticipant\" placeholder=\"예: P01\" autocomplete=\"off\"></label><button class=\"primary\" id=\"testStart\">시작하기</button>`;p.querySelector('#testStart').onclick=()=>startTestSession(p.querySelector('#testParticipant').value);p.querySelector('#testCollapse').onclick=toggleTestPanel;return;}
    const done=s.tasks.filter(x=>x.status==='complete').length;
    if(s.status==='complete'){p.innerHTML=`<div class=\"test-head\"><div><strong>사용성 확인 완료</strong><div class=\"test-progress\">5/5 상황 완료</div></div><button class=\"test-close\" id=\"testCollapse\" aria-label=\"과제 접기\">−</button></div><div class=\"test-complete\"><strong>고맙습니다.</strong><p>결과 파일을 저장하면 테스트가 끝납니다.</p></div><div class=\"test-actions secondary\"><button class=\"primary\" id=\"testExport\">결과 파일 저장</button><button class=\"ghost\" id=\"testRestart\">처음부터 다시</button></div>`;p.querySelector('#testCollapse').onclick=toggleTestPanel;p.querySelector('#testExport').onclick=exportTest;p.querySelector('#testRestart').onclick=()=>{if(confirm('현재 기록을 지우고 처음부터 다시 시작할까요?')){localStorage.removeItem(testKey);renderTestPanel()}};return;}
    const t=s.tasks[s.task_index];p.innerHTML=`<div class=\"test-head\"><div><strong>상황 ${s.task_index+1} / ${s.tasks.length}</strong><div class=\"test-progress\">${done}/5 진행</div></div><button class=\"test-close\" id=\"testCollapse\" aria-label=\"과제 접기\">−</button></div><div class=\"test-task\"><div class=\"eyebrow\">${esc(t.label)}</div><h3>${esc(t.prompt)}</h3><p class=\"test-target\">사이트를 평소처럼 자유롭게 사용해 주세요. 원하는 만큼 확인한 뒤 다음 상황으로 넘어가면 됩니다.</p><div class=\"test-actions\"><button class=\"primary\" id=\"testNext\">이 상황 탐색을 마쳤어요</button></div></div>`;p.querySelector('#testCollapse').onclick=toggleTestPanel;p.querySelector('#testNext').onclick=advanceTask;
  }
  function advanceTask(){const s=loadTest();if(!s||s.status!=='running')return;const t=s.tasks[s.task_index];t.outcome=t.goal_reached?'target_reached':'ended_without_target';t.status='complete';t.completed_at=new Date().toISOString();const ended={task:t.id,outcome:t.outcome,target_reached:t.goal_reached,interactions:t.interactions,search_used:t.search_used,time_to_target_ms:t.time_to_target_ms};const next=s.task_index+1;if(next>=s.tasks.length){s.status='complete';s.completed_at=new Date().toISOString()}else{s.task_index=next;s.tasks[next].status='running';s.tasks[next].started_at=new Date().toISOString()}localStorage.setItem(testKey,JSON.stringify(s));track('usability_task_end',ended);if(s.status==='running')track('usability_task_start',{task:s.tasks[s.task_index].id});go('/home');renderTestPanel();}
  function exportTest(){const s=loadTest();if(!s)return;const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`sreborn-usability-${s.participant}-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);track('usability_export',{participant:s.participant,version:s.version});}
  function toggleTestPanel(){const p=document.querySelector('#testPanel');if(p){p.remove();let b=document.querySelector('#testFloat');if(!b){b=document.createElement('button');b.id='testFloat';b.className='primary test-float';b.textContent='상황 보기';b.onclick=()=>{b.remove();renderTestPanel()};document.body.appendChild(b)}}}

"""
t,n=re.subn(r"  function renderTestPanelIfOpen\(\).*?(?=  function route\(\))",panel,t,count=1,flags=re.S)
assert n==1
for bad in ['data-outcome=\"complete\"','>성공<','>실패<','>건너뜀<','관찰자 목표 콘텐츠']:
    if bad in t: raise SystemExit(f'Legacy UI remains: {bad}')
p.write_text(t,encoding='utf-8')
new=hashlib.sha256(t.encode()).hexdigest()
print('patched SHA256',new)
if new!='faad303ad7f108f319bbc81eedaccc9bfeeb69ffa361126b3669f4a3aa57fe27':
    raise SystemExit(f'Unexpected patched SHA256: {new}')
