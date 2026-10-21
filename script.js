const responseOptions = [
  ["", "Não avaliado"], ["sim","Sim"], ["nao","Não"], ["parcial","Parcialmente"], ["naosei","Não sabe / não consegue informar"], ["pular","Preferiu não responder"]
];
const groups = {
 common: [
  {id:"orientation",text:"O paciente consegue informar onde está neste momento?",domain:"context"},
  {id:"identity",text:"O paciente consegue informar sua identidade, conforme esperado para o contexto?",domain:"context"},
  {id:"recentRecall",text:"O paciente consegue relatar algo que aconteceu há pouco tempo?",domain:"recent"},
  {id:"pastRecall",text:"O paciente consegue recordar acontecimentos anteriores ao início percebido?",domain:"past"},
  {id:"recognition",text:"Reconhece pessoas próximas, quando isso é pertinente?",domain:"context"},
  {id:"onsetRecall",text:"Consegue situar quando percebeu a mudança na memória?",domain:"context"}
 ],
 specific: [
  {id:"newInfo",text:"Consegue guardar uma informação nova e recordá-la após um intervalo?",domain:"recent"},
  {id:"repeatInfo",text:"Consegue repetir uma informação recém-apresentada?",domain:"recent"},
  {id:"recentEvents",text:"Relata esquecimentos de conversas ou acontecimentos recentes?",domain:"recent",reverse:true},
  {id:"autobiographical",text:"Consegue recordar aspectos relevantes de sua história pessoal anterior?",domain:"past"},
  {id:"preEvent",text:"Há dificuldade para recordar acontecimentos anteriores ao início/evento?",domain:"past",reverse:true},
  {id:"newLearning",text:"Percebe dificuldade para aprender ou conservar informações novas?",domain:"recent",reverse:true},
  {id:"bothDomains",text:"Relata dificuldades tanto com lembranças antigas quanto com novas informações?",domain:"context"}
 ],
 clinical: [
  {id:"headInjury",text:"Houve queda, acidente ou pancada na cabeça perto do início dos sintomas?",domain:"context"},
  {id:"suddenConfusion",text:"Há confusão súbita, desorientação importante ou piora rápida agora?",domain:"context"},
  {id:"neurological",text:"Há alteração da fala, fraqueza, convulsão ou outro sintoma neurológico novo?",domain:"context"},
  {id:"substances",text:"Há uso recente de álcool, medicamentos ou outras substâncias que mereça avaliação?",domain:"context"},
  {id:"stressfulEvent",text:"O paciente deseja mencionar alguma situação física ou emocional marcante?",domain:"context"},
  {id:"intrusions",text:"Relata lembranças involuntárias, pesadelos ou reações intensas a lembretes?",domain:"context"},
  {id:"dailyImpact",text:"A dificuldade relatada interfere nas atividades cotidianas?",domain:"context"}
 ]
};
const allItems = [...groups.common,...groups.specific,...groups.clinical];
function makeQuestion(item, idx){
 const div=document.createElement("div"); div.className="q";
 const p=document.createElement("p"); p.textContent=(idx+1)+". "+item.text; div.appendChild(p);
 const opts=document.createElement("div"); opts.className="options";
 responseOptions.forEach(([val,label])=>{
  const lab=document.createElement("label"), inp=document.createElement("input");
  inp.type="radio";inp.name=item.id;inp.value=val;inp.addEventListener("change",updateResults);
  lab.append(inp,document.createTextNode(label));opts.appendChild(lab);
 });
 div.appendChild(opts);return div;
}
groups.common.forEach((q,i)=>document.getElementById("commonQuestions").appendChild(makeQuestion(q,i)));
groups.specific.forEach((q,i)=>document.getElementById("specificQuestions").appendChild(makeQuestion(q,i+groups.common.length)));
groups.clinical.forEach((q,i)=>document.getElementById("clinicalQuestions").appendChild(makeQuestion(q,i+groups.common.length+groups.specific.length)));
function answer(id){const el=document.querySelector(`input[name="${id}"]:checked`);return el?el.value:"";}
function counts(domain){
 let yes=0,partial=0,no=0,answered=0;
 allItems.filter(q=>q.domain===domain).forEach(q=>{
  const v=answer(q.id);if(!v)return;
  if(["sim","nao","parcial"].includes(v)){answered++; if(v==="sim")yes++;if(v==="parcial")partial++;if(v==="nao")no++;}
 });
 return {yes,partial,no,answered,total:allItems.filter(q=>q.domain===domain).length};
}
function setText(id,text){document.getElementById(id).textContent=text;}
function pct(c){return c.answered?Math.round((c.yes+c.partial*.5)/c.answered*100):0;}
function renderBars(){
 const bars=document.getElementById("bars");bars.innerHTML="";
 const defs=[
  ["recent","Memória recente / novas informações"],
  ["past","Memória autobiográfica passada"],
  ["context","Contexto / outros sinais"]
 ];
 defs.forEach(([domain,label])=>{
  const c=counts(domain),row=document.createElement("div");row.className="barrow";
  const name=document.createElement("div");name.textContent=label;
  const track=document.createElement("div");track.className="bartrack";
  const fill=document.createElement("div");fill.className="bar";fill.style.width=pct(c)+"%";track.appendChild(fill);
  const score=document.createElement("div");score.className="score";score.textContent=c.answered?pct(c)+"%":"—";
  row.append(name,track,score);bars.appendChild(row);
 });
}
function summary(domain){
 const c=counts(domain);
 if(!c.answered)return "Ainda sem respostas classificáveis.";
 return `Respostas classificáveis: ${c.answered}. “Sim”: ${c.yes}; “Parcialmente”: ${c.partial}; “Não”: ${c.no}. Índice descritivo: ${pct(c)}% (não diagnóstico).`;
}
function updateResults(){
 setText("recentSummary",summary("recent"));
 setText("pastSummary",summary("past"));
 setText("contextSummary",summary("context"));
 renderBars();drawChart();
}
function drawChart(){
 const canvas=document.getElementById("trendChart"),ctx=canvas.getContext("2d");
 const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);ctx.fillStyle="#fff";ctx.fillRect(0,0,w,h);
 const labels=["Memória recente","Memória passada","Contexto"];
 const vals=[pct(counts("recent")),pct(counts("past")),pct(counts("context"))];
 const known=[counts("recent").answered,counts("past").answered,counts("context").answered];
 ctx.font="14px system-ui";ctx.fillStyle="#586577";ctx.strokeStyle="#e1e6ed";ctx.lineWidth=1;
 for(let i=0;i<=4;i++){let y=24+i*45;ctx.beginPath();ctx.moveTo(190,y);ctx.lineTo(w-35,y);ctx.stroke();ctx.fillText(String(100-i*25)+"%",130,y+5);}
 labels.forEach((label,i)=>{
  const y=37+i*75;ctx.fillStyle="#273449";ctx.fillText(label,12,y+7);
  ctx.fillStyle="#557fc0";ctx.fillRect(190,y-10,(w-235)*vals[i]/100,25);
  ctx.fillStyle="#273449";ctx.fillText(known[i]?vals[i]+"%":"sem dados",Math.min(w-100,198+(w-235)*vals[i]/100),y+7);
 });
}
function value(id){return document.getElementById(id)?.value?.trim()||""}
function collectText(){
 const lines=["ROTEIRO DIDÁTICO DE ANAMNESE DA MEMÓRIA",""];
 const fields=[["Paciente/código","patientName"],["Idade","age"],["Sexo","sex"],["Data da entrevista","date"],["Horário","time"],["Fonte","source"],["Acompanhante","companion"],["Motivo/encaminhamento","referral"],["Início percebido","onset"],["Local","place"],["Profissional","professionalName"],["Identificador profissional","professionalId"],["Profissão/formação","profession"],["Cargo/função","role"],["Data do registro","signatureDate"]];
 fields.forEach(([label,id])=>{if(value(id))lines.push(label+": "+value(id));});
 lines.push("","RESPOSTAS");
 allItems.forEach((q,i)=>{const v=answer(q.id);const label=responseOptions.find(x=>x[0]===v)?.[1]||"Não respondido";lines.push((i+1)+". "+q.text+"\n   Resposta: "+label);});
 [["Observações iniciais","commonNotes"],["Observações clínicas","clinicalNotes"],["Síntese/hipótese de trabalho","impression"],["Encaminhamentos/próximos passos","plan"],["Assinatura/observações","signatureNotes"]].forEach(([label,id])=>{if(value(id))lines.push("",label+":",value(id));});
 lines.push("","RESUMO DESCRITIVO");
 lines.push("Memória recente: "+summary("recent"));
 lines.push("Memória passada: "+summary("past"));
 lines.push("Contexto: "+summary("context"));
 lines.push("","Limite: material didático experimental; não validado nem diagnóstico. Interpretar no contexto clínico e profissional.");
 return lines.join("\n");
}
document.getElementById("updateBtn").addEventListener("click",updateResults);
document.getElementById("printBtn").addEventListener("click",()=>{updateResults();window.print()});
document.getElementById("exportBtn").addEventListener("click",()=>{
 const blob=new Blob([collectText()],{type:"text/plain;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="resumo_anamnese_memoria.txt";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
});
document.getElementById("clearBtn").addEventListener("click",()=>{
 if(!confirm("Limpar todos os campos e respostas? Esta ação não pode ser desfeita."))return;
 document.querySelectorAll("input,textarea").forEach(el=>{if(el.type==="radio"||el.type==="checkbox")el.checked=false;else if(el.type!=="button")el.value=""});
 document.querySelectorAll("select").forEach(el=>el.selectedIndex=0);
 updateResults();
});
const today=new Date();const localDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
document.getElementById("date").value=localDate;document.getElementById("signatureDate").value=localDate;
updateResults();

  /*==========================================
 TRAVAR A CÓPIA CONTEÚDO COM REF. AUTOR 
      bY: IRAÊ CÉSAR BRANDÃO - 05-2026
 ==========================================*/


//---------- BLOQUEAR CLIQUE DIREITO ----------
document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Bloqueia o menu do botão direito
    alert("Copiar conteúdo não é permitido sem referência ao autor '© 2026 Iraê César Brandão' .");
});

// ---------- BLOQUEAR CTRL+C E CTRL+X ----------
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'x')) {
        e.preventDefault(); // Bloqueia copiar e recortar
        alert("Copiar/Recortar desativado. Cite o autor! '© 2026 Iraê César Brandão'");
    }
});
