import { useState, useEffect } from "react";

const RATE_PER_CLIENT = 3;
const MY_NAME = "Juan Carlos";
const ACCENT = "#3B82F6";
const BG_CARD = "#1E293B";

function todayStr() { return new Date().toISOString().slice(0, 10); }
function formatDate(str) { if (!str) return ""; const [y,m,d] = str.split("-"); return `${d}/${m}/${y}`; }
function formatCurrency(n) { return "$" + (parseFloat(n)||0).toFixed(2); }
function calcHours(e, s) {
  if (!e || !s) return null;
  const [h1,m1] = e.split(":").map(Number);
  const [h2,m2] = s.split(":").map(Number);
  const mins = (h2*60+m2)-(h1*60+m1);
  if (mins <= 0) return null;
  return `${Math.floor(mins/60)}h${mins%60>0?" "+mins%60+"m":""}`;
}
function calcMins(e, s) {
  if (!e || !s) return 0;
  const [h1,m1] = e.split(":").map(Number);
  const [h2,m2] = s.split(":").map(Number);
  const mins = (h2*60+m2)-(h1*60+m1);
  return mins > 0 ? mins : 0;
}
function formatMins(totalMins) {
  if (!totalMins) return "0h";
  const h = Math.floor(totalMins/60);
  const m = totalMins%60;
  return `${h}h${m>0?" "+m+"m":""}`;
}
function getWeekDates(ref) {
  const d = new Date(ref+"T00:00:00");
  const diff = d.getDay()===0 ? -6 : 1-d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate()+diff);
  return Array.from({length:7},(_,i)=>{ const dd=new Date(mon); dd.setDate(mon.getDate()+i); return dd.toISOString().slice(0,10); });
}
function getBiweekDates(ref) {
  const d = new Date(ref+"T00:00:00");
  const day = d.getDate(); const y = d.getFullYear(); const mo = d.getMonth();
  let start, end;
  if (day <= 15) { start = new Date(y, mo, 1); end = new Date(y, mo, 15); }
  else { start = new Date(y, mo, 16); end = new Date(y, mo+1, 0); }
  const dates = [];
  for (let dd = new Date(start); dd <= end; dd.setDate(dd.getDate()+1))
    dates.push(dd.toISOString().slice(0,10));
  return { dates, start, end };
}
const DAYS_ES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS_ES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function shortDate(str) { const d=new Date(str+"T00:00:00"); return `${DAYS_ES[d.getDay()]} ${d.getDate()} ${MONTHS_ES[d.getMonth()]}`; }

function loadRecords() {
  try { return JSON.parse(localStorage.getItem("dl-records-v2") || "[]"); } catch { return []; }
}
function saveRecords(recs) {
  try { localStorage.setItem("dl-records-v2", JSON.stringify(recs)); } catch(e) { console.error(e); }
}

export default function DeliveryTracker() {
  const [records, setRecords] = useState([]);
  const [vista, setVista] = useState("registro");

  const [fecha, setFecha] = useState(todayStr());
  const [entrada, setEntrada] = useState("");
  const [salida, setSalida] = useState("");
  const [clientes, setClientes] = useState("");
  const [tips, setTips] = useState("");
  const [notas, setNotas] = useState("");
  const [editId, setEditId] = useState(null);
  const [semanaRef, setSemanaRef] = useState(todayStr());
  const [quinRef, setQuinRef] = useState(todayStr());
  const [toast, setToast] = useState(null);

  useEffect(() => { setRecords(loadRecords()); }, []);

  function showToast(msg, tipo="ok") {
    setToast({msg, tipo});
    setTimeout(()=>setToast(null), 2800);
  }

  const myRecords = [...records].sort((a,b) => b.fecha.localeCompare(a.fecha));
  const todayRecord = myRecords.find(r => r.fecha===todayStr());

  function resetForm() {
    setFecha(todayStr()); setEntrada(""); setSalida("");
    setClientes(""); setTips(""); setNotas(""); setEditId(null);
  }

  function loadIntoForm(rec) {
    setFecha(rec.fecha); setEntrada(rec.entrada); setSalida(rec.salida);
    setClientes(String(rec.clientes)); setTips(String(rec.tips));
    setNotas(rec.notas||""); setEditId(rec.id); setVista("registro");
  }

  function handleSave() {
    if (!entrada || !salida || !clientes) { showToast("Completá entrada, salida y clientes.","err"); return; }
    const rec = {
      id: editId||Date.now(), fecha, entrada, salida,
      clientes: parseInt(clientes)||0,
      tips: parseFloat(tips)||0,
      notas,
      ganancia: (parseInt(clientes)||0)*RATE_PER_CLIENT + (parseFloat(tips)||0),
    };
    let updated;
    if (editId) {
      updated = records.map(r => r.id===editId ? rec : r);
      showToast("Actualizado ✓");
    } else {
      if (records.find(r => r.fecha===fecha)) { showToast("Ya registraste ese día. Editá el existente.","err"); return; }
      updated = [...records, rec];
      showToast("Día guardado ✓");
    }
    setRecords(updated); saveRecords(updated); resetForm();
  }

  function handleDelete(id) {
    const updated = records.filter(r => r.id!==id);
    setRecords(updated); saveRecords(updated); showToast("Eliminado.","err");
  }

  const weekDates = getWeekDates(semanaRef);
  const weekRecs = records.filter(r => weekDates.includes(r.fecha));
  const wClientes = weekRecs.reduce((a,r)=>a+r.clientes,0);
  const wTips = weekRecs.reduce((a,r)=>a+r.tips,0);
  const wGanancia = weekRecs.reduce((a,r)=>a+r.ganancia,0);

  const mesActual = todayStr().slice(0,7);
  const mesRecs = records.filter(r => r.fecha.startsWith(mesActual));
  const mGanancia = mesRecs.reduce((a,r)=>a+r.ganancia,0);
  const mClientes = mesRecs.reduce((a,r)=>a+r.clientes,0);

  const { dates: quinDates } = getBiweekDates(quinRef);
  const quinRecs = records.filter(r => quinDates.includes(r.fecha));
  const quinMins = quinRecs.reduce((a,r) => a + calcMins(r.entrada, r.salida), 0);
  const quinClientes = quinRecs.reduce((a,r) => a + r.clientes, 0);
  const quinGanancia = quinRecs.reduce((a,r) => a + r.ganancia, 0);

  const totalGanancia = todayRecord ? todayRecord.ganancia : 0;

  return (
    <div style={{minHeight:"100vh", background:"#0F172A", fontFamily:"'Segoe UI',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#1E3A5F,#1E293B)", padding:"20px 20px 0"}}>
        <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:4}}>
          <span style={{fontSize:26}}>🚚</span>
          <div style={{flex:1}}>
            <div style={{color:"#fff", fontWeight:800, fontSize:18}}>DeliveryLog</div>
            <div style={{color:"rgba(255,255,255,.5)", fontSize:11}}>{MY_NAME}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{color:"#fff", fontWeight:800, fontSize:24}}>{formatCurrency(totalGanancia)}</div>
            <div style={{color:"rgba(255,255,255,.5)", fontSize:11}}>
              {todayRecord ? `${todayRecord.clientes} clientes hoy` : "Sin registro hoy"}
            </div>
          </div>
        </div>
        <div style={{display:"flex", marginTop:16}}>
          {[["registro","📝 Registrar"],["historial","📋 Historial"],["resumen","📊 Resumen"]].map(([k,label])=>(
            <button key={k} onClick={()=>setVista(k)}
              style={{flex:1, padding:"10px 4px", border:"none", cursor:"pointer", fontWeight:600, fontSize:12,
                background: vista===k ? "#0F172A" : "transparent",
                color: vista===k ? ACCENT : "rgba(255,255,255,.65)",
                borderRadius: vista===k ? "8px 8px 0 0" : 0, transition:"all .2s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:999,
          background: toast.tipo==="err" ? "#EF4444" : "#10B981", color:"#fff",
          padding:"10px 22px", borderRadius:24, fontWeight:600, fontSize:14,
          boxShadow:"0 4px 20px rgba(0,0,0,.4)"}}>
          {toast.msg}
        </div>
      )}

      <div style={{padding:"20px 16px", maxWidth:500, margin:"0 auto"}}>

        {vista==="registro" && (
          <div>
            {todayRecord && !editId && (
              <div style={{background:BG_CARD, borderRadius:14, padding:"14px 16px", marginBottom:16, border:`1px solid ${ACCENT}44`}}>
                <div style={{color:ACCENT, fontWeight:700, fontSize:13, marginBottom:10}}>✅ Registro de hoy</div>
                <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
                  <div style={{display:"flex", gap:16}}>
                    <Pill label="Entrada" value={todayRecord.entrada}/>
                    <Pill label="Salida" value={todayRecord.salida}/>
                    <Pill label="Clientes" value={todayRecord.clientes}/>
                    <Pill label="Tips" value={formatCurrency(todayRecord.tips)}/>
                  </div>
                  <div style={{color:ACCENT, fontWeight:800, fontSize:20}}>{formatCurrency(todayRecord.ganancia)}</div>
                </div>
                <button onClick={()=>loadIntoForm(todayRecord)}
                  style={{width:"100%", padding:"9px", borderRadius:9, border:`1px solid ${ACCENT}55`,
                    background:"transparent", color:ACCENT, fontWeight:600, cursor:"pointer", fontSize:13}}>
                  ✏️ Editar registro de hoy
                </button>
              </div>
            )}
            <div style={{background:BG_CARD, borderRadius:16, padding:20}}>
              <div style={{color:"#fff", fontWeight:700, fontSize:16, marginBottom:16}}>
                {editId ? "✏️ Editando registro" : "Nuevo registro"}
              </div>
              <DField label="Fecha"><input type="date" value={fecha} onChange={e=>setFecha(e.target.value)} style={iS}/></DField>
              <div style={{display:"flex", gap:10}}>
                <DField label="Hora entrada" style={{flex:1}}><input type="time" value={entrada} onChange={e=>setEntrada(e.target.value)} style={iS}/></DField>
                <DField label="Hora salida" style={{flex:1}}><input type="time" value={salida} onChange={e=>setSalida(e.target.value)} style={iS}/></DField>
              </div>
              {calcHours(entrada,salida) && (
                <div style={{color:ACCENT, fontSize:12, fontWeight:600, marginTop:-8, marginBottom:10}}>⏱ {calcHours(entrada,salida)} trabajadas</div>
              )}
              <DField label="Clientes entregados">
                <input type="number" min="0" value={clientes} onChange={e=>setClientes(e.target.value)} placeholder="0" style={iS}/>
              </DField>
              {clientes && <div style={{color:ACCENT, fontSize:12, fontWeight:600, marginTop:-8, marginBottom:10}}>💵 {parseInt(clientes)||0} × $3 = {formatCurrency((parseInt(clientes)||0)*3)}</div>}
              <DField label="Tips recibidos ($)">
                <input type="number" min="0" step="0.01" value={tips} onChange={e=>setTips(e.target.value)} placeholder="0.00" style={iS}/>
              </DField>
              {(clientes||tips) && (
                <div style={{background:`${ACCENT}15`, borderRadius:10, padding:"12px 14px", marginBottom:14,
                  display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <span style={{color:"#94A3B8", fontSize:13}}>Total del día</span>
                  <span style={{color:ACCENT, fontWeight:800, fontSize:20}}>{formatCurrency((parseInt(clientes)||0)*3+(parseFloat(tips)||0))}</span>
                </div>
              )}
              <DField label="Notas (opcional)">
                <textarea value={notas} onChange={e=>setNotas(e.target.value)} placeholder="Rutas, observaciones..." rows={2} style={{...iS, resize:"vertical"}}/>
              </DField>
              <div style={{display:"flex", gap:10}}>
                {editId && <button onClick={resetForm} style={{flex:1, padding:12, borderRadius:10, border:"1px solid #334155", background:"transparent", color:"#64748B", fontWeight:600, cursor:"pointer"}}>Cancelar</button>}
                <button onClick={handleSave} style={{flex:2, padding:12, borderRadius:10, border:"none", background:`linear-gradient(135deg,#1E3A5F,${ACCENT})`, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:15}}>
                  {editId ? "Guardar cambios" : "Guardar día"}
                </button>
              </div>
            </div>
          </div>
        )}

        {vista==="historial" && (
          <div>
            {myRecords.length===0 ? (
              <div style={{textAlign:"center", padding:"60px 0"}}>
                <div style={{fontSize:40}}>📋</div>
                <div style={{color:"#64748B", fontWeight:600, marginTop:8}}>Sin registros aún</div>
              </div>
            ) : myRecords.map(rec=>(
              <div key={rec.id} style={{background:BG_CARD, borderRadius:13, marginBottom:10, overflow:"hidden"}}>
                <div style={{padding:"12px 16px", display:"flex", alignItems:"center", gap:12}}>
                  <div style={{background:`${ACCENT}20`, borderRadius:10, padding:"8px 10px", color:ACCENT, fontWeight:700, fontSize:11, textAlign:"center", minWidth:52}}>
                    {shortDate(rec.fecha)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{color:"#fff", fontWeight:600, fontSize:14}}>{rec.clientes} clientes · {rec.entrada}–{rec.salida}</div>
                    <div style={{color:"#64748B", fontSize:12}}>{calcHours(rec.entrada,rec.salida)||""}{rec.tips>0?` · Tips: ${formatCurrency(rec.tips)}`:""}</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:ACCENT, fontWeight:800, fontSize:16}}>{formatCurrency(rec.ganancia)}</div>
                    <div style={{display:"flex", gap:6, marginTop:4, justifyContent:"flex-end"}}>
                      <button onClick={()=>loadIntoForm(rec)} style={{background:"transparent", border:"none", color:"#64748B", cursor:"pointer", fontSize:15}}>✏️</button>
                      <button onClick={()=>handleDelete(rec.id)} style={{background:"transparent", border:"none", color:"#EF4444", cursor:"pointer", fontSize:15}}>🗑️</button>
                    </div>
                  </div>
                </div>
                {rec.notas && <div style={{padding:"0 16px 10px", color:"#64748B", fontSize:12}}>📝 {rec.notas}</div>}
              </div>
            ))}
          </div>
        )}

        {vista==="resumen" && (
          <div>
            {/* QUINCENA */}
            <div style={{background:BG_CARD, borderRadius:14, padding:16, marginBottom:14, border:"1px solid #F59E0B44"}}>
              <div style={{color:"#F59E0B", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10}}>⏱ Resumen por quincena</div>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                <span style={{color:"#64748B", fontSize:12}}>Período:</span>
                <input type="date" value={quinRef} onChange={e=>setQuinRef(e.target.value)} style={{...iS, flex:1}}/>
              </div>
              <div style={{color:"#64748B", fontSize:12, marginBottom:12}}>📅 {formatDate(quinDates[0])} – {formatDate(quinDates[quinDates.length-1])}</div>
              <div style={{background:"#0F172A", borderRadius:10, padding:"12px 14px", marginBottom:8}}>
                <div style={{color:"#64748B", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6}}>Horas trabajadas</div>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div style={{color:"#F59E0B", fontWeight:800, fontSize:28}}>{quinMins>0 ? formatMins(quinMins) : "0h"}</div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#64748B", fontSize:11}}>{quinRecs.length} días trabajados</div>
                    <div style={{color:"#94A3B8", fontSize:11}}>Prom. {quinRecs.length>0 ? formatMins(Math.round(quinMins/quinRecs.length)) : "0h"}/día</div>
                  </div>
                </div>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8}}>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px 14px"}}>
                  <div style={{color:"#64748B", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6}}>🚚 Deliveries</div>
                  <div style={{color:ACCENT, fontWeight:800, fontSize:22}}>{formatCurrency(quinClientes * RATE_PER_CLIENT)}</div>
                  <div style={{color:"#64748B", fontSize:11, marginTop:2}}>{quinClientes} clientes × $3</div>
                </div>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px 14px"}}>
                  <div style={{color:"#64748B", fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:6}}>💵 Tips</div>
                  <div style={{color:"#F59E0B", fontWeight:800, fontSize:22}}>{formatCurrency(quinRecs.reduce((a,r)=>a+r.tips,0))}</div>
                  <div style={{color:"#64748B", fontSize:11, marginTop:2}}>Prom. {formatCurrency(quinRecs.length>0 ? quinRecs.reduce((a,r)=>a+r.tips,0)/quinRecs.length : 0)}/día</div>
                </div>
              </div>
              <div style={{background:"linear-gradient(135deg,#10B98122,#0F172A)", borderRadius:10, padding:"12px 14px", border:"1px solid #10B98133", marginBottom:12}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <div style={{color:"#64748B", fontSize:12}}>Total quincena</div>
                  <div style={{color:"#10B981", fontWeight:800, fontSize:24}}>{formatCurrency(quinGanancia)}</div>
                </div>
                <div style={{display:"flex", justifyContent:"flex-end", gap:16, marginTop:4}}>
                  <span style={{color:"#64748B", fontSize:11}}>Delivery: {formatCurrency(quinClientes*RATE_PER_CLIENT)}</span>
                  <span style={{color:"#64748B", fontSize:11}}>+ Tips: {formatCurrency(quinRecs.reduce((a,r)=>a+r.tips,0))}</span>
                </div>
              </div>
              <div style={{color:"#64748B", fontSize:11, fontWeight:600, marginBottom:6}}>Detalle por día</div>
              <div style={{display:"flex", flexDirection:"column", gap:3}}>
                {[...quinRecs].sort((a,b)=>a.fecha.localeCompare(b.fecha)).map(r=>(
                  <div key={r.id} style={{background:"#0F172A", borderRadius:8, padding:"8px 10px", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div>
                      <div style={{color:"#94A3B8", fontSize:12}}>{shortDate(r.fecha)}</div>
                      <div style={{color:"#475569", fontSize:11}}>{r.entrada}–{r.salida} · {calcHours(r.entrada,r.salida)||"—"}</div>
                    </div>
                    <div style={{display:"flex", gap:10, alignItems:"center"}}>
                      <div style={{textAlign:"center"}}>
                        <div style={{color:ACCENT, fontWeight:700, fontSize:12}}>{r.clientes} cl.</div>
                        <div style={{color:"#475569", fontSize:10}}>{formatCurrency(r.clientes*RATE_PER_CLIENT)}</div>
                      </div>
                      <div style={{textAlign:"center"}}>
                        <div style={{color:"#F59E0B", fontWeight:700, fontSize:12}}>{formatCurrency(r.tips)}</div>
                        <div style={{color:"#475569", fontSize:10}}>tips</div>
                      </div>
                      <div style={{color:"#10B981", fontWeight:800, fontSize:13}}>{formatCurrency(r.ganancia)}</div>
                    </div>
                  </div>
                ))}
                {quinRecs.length===0 && <div style={{color:"#334155", fontSize:13, textAlign:"center", padding:"12px 0"}}>Sin registros en esta quincena</div>}
              </div>
            </div>

            {/* SEMANA */}
            <div style={{background:BG_CARD, borderRadius:14, padding:16, marginBottom:14}}>
              <div style={{color:"#64748B", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:10}}>📆 Semana</div>
              <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:12}}>
                <span style={{color:"#64748B", fontSize:12}}>Semana:</span>
                <input type="date" value={semanaRef} onChange={e=>setSemanaRef(e.target.value)} style={{...iS, margin:0, flex:1}}/>
              </div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:6, marginBottom:12}}>
                <MiniStat label="Horas" value={formatMins(weekRecs.reduce((a,r)=>a+calcMins(r.entrada,r.salida),0))} color="#F59E0B"/>
                <MiniStat label="Clientes" value={wClientes} color={ACCENT}/>
                <MiniStat label="Tips" value={formatCurrency(wTips)} color="#F59E0B"/>
                <MiniStat label="Total" value={formatCurrency(wGanancia)} color="#10B981"/>
              </div>
              <div style={{display:"flex", gap:4}}>
                {weekDates.map(date=>{
                  const rec = records.find(r=>r.fecha===date);
                  const isToday = date===todayStr();
                  return (
                    <div key={date} style={{flex:1, borderRadius:8, padding:"6px 2px", textAlign:"center",
                      background: rec ? `${ACCENT}25` : "#0F172A",
                      border: isToday ? `1px solid ${ACCENT}` : "1px solid transparent"}}>
                      <div style={{fontSize:9, color:"#64748B"}}>{DAYS_ES[new Date(date+"T00:00:00").getDay()]}</div>
                      {rec ? <>
                        <div style={{color:ACCENT, fontWeight:700, fontSize:10, marginTop:1}}>{formatCurrency(rec.ganancia)}</div>
                        <div style={{color:"#475569", fontSize:9}}>{calcHours(rec.entrada,rec.salida)||""}</div>
                      </> : <div style={{color:"#334155", fontSize:11, marginTop:2}}>—</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACUMULADO */}
            <div style={{background:"linear-gradient(135deg,#1E3A5F,#1E293B)", borderRadius:14, padding:16, border:`1px solid ${ACCENT}33`}}>
              <div style={{color:"#64748B", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12}}>📊 Total acumulado</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px"}}>
                  <div style={{color:"#64748B", fontSize:10}}>Días registrados</div>
                  <div style={{color:"#fff", fontWeight:800, fontSize:24}}>{records.length}</div>
                </div>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px"}}>
                  <div style={{color:"#64748B", fontSize:10}}>Horas totales</div>
                  <div style={{color:"#F59E0B", fontWeight:800, fontSize:24}}>{formatMins(records.reduce((a,r)=>a+calcMins(r.entrada,r.salida),0))}</div>
                </div>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px"}}>
                  <div style={{color:"#64748B", fontSize:10}}>🚚 Total delivery</div>
                  <div style={{color:ACCENT, fontWeight:800, fontSize:20}}>{formatCurrency(records.reduce((a,r)=>a+(r.clientes*RATE_PER_CLIENT),0))}</div>
                  <div style={{color:"#475569", fontSize:10}}>{records.reduce((a,r)=>a+r.clientes,0)} clientes</div>
                </div>
                <div style={{background:"#0F172A", borderRadius:10, padding:"12px"}}>
                  <div style={{color:"#64748B", fontSize:10}}>💵 Total tips</div>
                  <div style={{color:"#F59E0B", fontWeight:800, fontSize:20}}>{formatCurrency(records.reduce((a,r)=>a+r.tips,0))}</div>
                </div>
              </div>
              <div style={{background:"#0F172A", borderRadius:10, padding:"12px", marginTop:8, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div style={{color:"#94A3B8", fontSize:13}}>Ganancia total</div>
                <div style={{color:"#10B981", fontWeight:800, fontSize:26}}>{formatCurrency(records.reduce((a,r)=>a+r.ganancia,0))}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DField({label, children, style}) {
  return (
    <div style={{marginBottom:12, ...style}}>
      <label style={{fontSize:12, fontWeight:600, color:"#64748B", display:"block", marginBottom:4}}>{label}</label>
      {children}
    </div>
  );
}
function Pill({label, value}) {
  return (
    <div style={{textAlign:"center"}}>
      <div style={{color:"#64748B", fontSize:10}}>{label}</div>
      <div style={{color:"#fff", fontWeight:700, fontSize:14}}>{value}</div>
    </div>
  );
}
function MiniStat({label, value, color}) {
  return (
    <div style={{background:"#0F172A", borderRadius:10, padding:"10px 8px", textAlign:"center"}}>
      <div style={{color, fontWeight:800, fontSize:16}}>{value}</div>
      <div style={{color:"#64748B", fontSize:10, marginTop:2}}>{label}</div>
    </div>
  );
}

const iS = {
  width:"100%", padding:"10px 12px", borderRadius:10,
  border:"1px solid #334155", background:"#0F172A",
  color:"#fff", fontSize:14, outline:"none", boxSizing:"border-box",
};
