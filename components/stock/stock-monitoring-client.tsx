"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, Loader2, AlertTriangle,
  CheckCircle2, ChevronDown, ClipboardList, Calendar,
  RefreshCw, Package,
} from "lucide-react";
import { recordStockMovement } from "../../lib/actions/stock";

export type StockProduct = {
  id: string; name: string; currentStock: number;
  lowStockThreshold: number; status: string;
  category: { name: string };
};

export type StockMovement = {
  id: string; type: string; productId: string; quantity: number;
  reason: string | null; userId: string; createdAt: string;
  product: { id: string; name: string; currentStock: number; category: { name: string } };
  user: { id: string; name: string; role: string };
};

const REASONS_IN  = ["Delivery from supplier","Restocking","Return from customer","Adjustment – count increase","Transfer from other branch"];
const REASONS_OUT = ["Sold","Expired – Disposed","Damaged goods","Transferred to other branch","Adjustment – count decrease","Stolen / Missing"];

const inp: React.CSSProperties = {
  width:"100%", padding:"9px 12px", border:"1px solid #e2e8f0", borderRadius:8,
  fontSize:13.5, fontFamily:"DM Sans, sans-serif", color:"#0f172a",
  background:"#fff", outline:"none", boxSizing:"border-box" as any,
  transition:"border-color 0.14s, box-shadow 0.14s", appearance:"none" as any,
};
function iFocus(e:React.FocusEvent<HTMLInputElement|HTMLSelectElement>){
  e.currentTarget.style.borderColor="#16a34a";
  e.currentTarget.style.boxShadow="0 0 0 3px rgba(22,163,74,0.12)";
}
function iBlur(e:React.FocusEvent<HTMLInputElement|HTMLSelectElement>){
  e.currentTarget.style.borderColor="#e2e8f0";
  e.currentTarget.style.boxShadow="none";
}

export function StockMonitoringClient({
  products:initProducts, movements:initMovements, userId,
}:{
  products:StockProduct[]; movements:StockMovement[]; userId:string;
}) {
  const [products,  setProducts]  = useState(initProducts);
  const [movements, setMovements] = useState(initMovements);
  const [tab,       setTab]       = useState<"IN"|"OUT">("IN");
  const [productId, setProductId] = useState("");
  const [quantity,  setQuantity]  = useState("");
  const [reason,    setReason]    = useState("");
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");
  const [isPending, start]        = useTransition();

  const selected = products.find(p=>p.id===productId)??null;

  function switchTab(t:"IN"|"OUT"){setTab(t);setReason("");setError("");}

  function handleSubmit(e:React.FormEvent){
    e.preventDefault(); setError(""); setSuccess("");
    const qty=parseInt(quantity);
    if(!productId){setError("Please select a product.");return;}
    if(!qty||qty<1){setError("Enter a valid quantity (min 1).");return;}
    if(tab==="OUT"&&selected&&qty>selected.currentStock){
      setError(`Only ${selected.currentStock} unit${selected.currentStock!==1?"s":""} available.`);return;
    }
    start(async()=>{
      try{
        const result=await recordStockMovement({type:tab,productId,quantity:qty,reason:reason||null,userId});
        setProducts(prev=>prev.map(p=>p.id===productId?{...p,currentStock:result.newStock,status:result.newStatus}:p));
        setMovements(prev=>[result.movement,...prev].slice(0,50));
        setProductId(""); setQuantity(""); setReason("");
        setSuccess(`Successfully ${tab==="IN"?"added":"removed"} ${qty} unit${qty!==1?"s":""} ${tab==="IN"?"to":"from"} ${result.movement.product.name}.`);
        setTimeout(()=>setSuccess(""),4000);
      }catch(err:any){setError(err.message??"Something went wrong.");}
    });
  }

  return (
    <div style={{padding:24,display:"flex",flexDirection:"column",gap:20}}>

      {success&&(
        <div style={{position:"fixed",bottom:24,right:24,zIndex:100,background:"#15803d",color:"#fff",padding:"13px 18px",borderRadius:10,fontSize:13.5,fontWeight:600,boxShadow:"0 8px 28px rgba(21,128,61,0.35)",display:"flex",alignItems:"center",gap:9,animation:"toast-in 0.25s ease both",maxWidth:380}}>
          <CheckCircle2 size={17}/>{success}
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"380px 1fr",gap:20,alignItems:"start"}}>

        {/* ── LEFT: Record Card ── */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"15px 20px 13px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:8,background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <ClipboardList size={16} color="#15803d"/>
            </div>
            <span style={{fontSize:14,fontWeight:700,color:"#0f172a",letterSpacing:"-0.01em"}}>Record Stock Movement</span>
          </div>

          <div style={{padding:20}}>
            {/* Tab buttons */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,background:"#f8fafc",borderRadius:10,padding:4}}>
              {(["IN","OUT"] as const).map(t=>{
                const active=tab===t;
                const col=t==="IN"?{light:"#dcfce7",border:"#16a34a",text:"#15803d"}:{light:"#fee2e2",border:"#dc2626",text:"#b91c1c"};
                return(
                  <button key={t} type="button" onClick={()=>switchTab(t)} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"9px 0",borderRadius:7,border:active?`1.5px solid ${col.border}`:"1.5px solid transparent",background:active?col.light:"transparent",color:active?col.text:"#64748b",fontWeight:active?700:500,fontSize:13.5,fontFamily:"DM Sans, sans-serif",cursor:"pointer",transition:"all 0.14s"}}>
                    {t==="IN"?<ArrowDownToLine size={15} strokeWidth={2.5}/>:<ArrowUpFromLine size={15} strokeWidth={2.5}/>}
                    Stock {t==="IN"?"In":"Out"}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:14}}>

              {/* Product dropdown */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#374151",marginBottom:5}}>Product Name <span style={{color:"#dc2626"}}>*</span></label>
                <div style={{position:"relative"}}>
                  <select style={{...inp,paddingRight:32}} value={productId} onChange={e=>{setProductId(e.target.value);setError("");}} onFocus={iFocus} onBlur={iBlur} required>
                    <option value="">Select product…</option>
                    {products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <ChevronDown size={13} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}/>
                </div>
                {selected&&(
                  <div style={{display:"flex",alignItems:"center",gap:6,marginTop:7,padding:"5px 10px",background:selected.currentStock<=selected.lowStockThreshold?"#fff7ed":"#f0fdf4",border:`1px solid ${selected.currentStock<=selected.lowStockThreshold?"#fed7aa":"#bbf7d0"}`,borderRadius:7,fontSize:12,fontWeight:600,color:selected.currentStock<=selected.lowStockThreshold?"#c2410c":"#15803d"}}>
                    <Package size={12}/>
                    Current stock: {selected.currentStock} units
                    {selected.currentStock<=selected.lowStockThreshold&&<span style={{marginLeft:4,color:"#ea580c"}}>⚠ Low</span>}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#374151",marginBottom:5}}>Quantity <span style={{color:"#dc2626"}}>*</span></label>
                <input style={inp} type="number" min="1" placeholder="Enter quantity" value={quantity} onChange={e=>{setQuantity(e.target.value);setError("");}} onFocus={iFocus} onBlur={iBlur} required/>
                {selected&&quantity&&parseInt(quantity)>0&&(
                  <div style={{marginTop:7,padding:"5px 10px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:7,fontSize:12,color:"#475569"}}>
                    After this movement: <strong style={{color:"#0f172a"}}>{tab==="IN"?selected.currentStock+parseInt(quantity):Math.max(0,selected.currentStock-parseInt(quantity))} units</strong>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label style={{display:"block",fontSize:12.5,fontWeight:600,color:"#374151",marginBottom:5}}>Reason</label>
                <div style={{position:"relative"}}>
                  <select style={{...inp,paddingRight:32}} value={reason} onChange={e=>setReason(e.target.value)} onFocus={iFocus} onBlur={iBlur}>
                    <option value="">{tab==="IN"?"Delivery from supplier":"Select reason…"}</option>
                    {(tab==="IN"?REASONS_IN:REASONS_OUT).map(r=><option key={r} value={r}>{r}</option>)}
                  </select>
                  <ChevronDown size={13} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",color:"#94a3b8",pointerEvents:"none"}}/>
                </div>
              </div>

              {/* Error */}
              {error&&(
                <div style={{display:"flex",alignItems:"flex-start",gap:8,background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 13px",borderRadius:8,fontSize:13,fontWeight:500}}>
                  <AlertTriangle size={14} style={{flexShrink:0,marginTop:1}}/>{error}
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={isPending}
                style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,width:"100%",padding:"11px 0",borderRadius:8,border:"none",background:isPending?(tab==="IN"?"#86efac":"#fca5a5"):(tab==="IN"?"#16a34a":"#dc2626"),color:"#fff",fontSize:14,fontWeight:700,fontFamily:"DM Sans, sans-serif",cursor:isPending?"not-allowed":"pointer",transition:"background 0.14s",boxShadow:isPending?"none":tab==="IN"?"0 2px 8px rgba(22,163,74,0.28)":"0 2px 8px rgba(220,38,38,0.25)",marginTop:2}}
                onMouseEnter={e=>{if(!isPending)(e.currentTarget as HTMLButtonElement).style.background=tab==="IN"?"#15803d":"#b91c1c";}}
                onMouseLeave={e=>{if(!isPending)(e.currentTarget as HTMLButtonElement).style.background=tab==="IN"?"#16a34a":"#dc2626";}}>
                {isPending?(<><Loader2 size={15} style={{animation:"spin 0.7s linear infinite"}}/>Saving…</>):(<>{tab==="IN"?<ArrowDownToLine size={15} strokeWidth={2.5}/>:<ArrowUpFromLine size={15} strokeWidth={2.5}/>}Save Stock {tab==="IN"?"In":"Out"}</>)}
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT: History Table ── */}
        <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"15px 20px 13px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:32,height:32,borderRadius:8,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <RefreshCw size={15} color="#0284c7"/>
              </div>
              <span style={{fontSize:14,fontWeight:700,color:"#0f172a",letterSpacing:"-0.01em"}}>Stock Movement History</span>
            </div>
            <span style={{fontSize:12,color:"#94a3b8",background:"#f8fafc",border:"1px solid #e2e8f0",padding:"3px 10px",borderRadius:99}}>{movements.length} records</span>
          </div>

          {movements.length===0?(
            <div style={{padding:"56px 24px",textAlign:"center",color:"#94a3b8"}}>
              <RefreshCw size={36} strokeWidth={1.5} style={{marginBottom:10,opacity:0.35}}/>
              <div style={{fontSize:14,fontWeight:500}}>No movements recorded yet.</div>
              <div style={{fontSize:13,marginTop:4}}>Use the form on the left to record stock changes.</div>
            </div>
          ):(
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"DM Sans, sans-serif"}}>
                <thead>
                  <tr style={{background:"#f8fafc"}}>
                    {["TYPE","PRODUCT","QTY","REASON","DATE","USER"].map((h,i)=>(
                      <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:10.5,fontWeight:700,letterSpacing:"0.07em",textTransform:"uppercase" as any,color:"#94a3b8",borderBottom:"1px solid #f1f5f9",whiteSpace:"nowrap" as any,width:i===0?130:i===2?70:i===4?130:i===5?110:"auto"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m,idx)=>(
                    <MovementRow key={m.id} movement={m} isLast={idx===movements.length-1}/>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}

function MovementRow({movement:m,isLast}:{movement:StockMovement;isLast:boolean}){
  const [hov,setHov]=useState(false);
  const isIn=m.type==="IN";
  return(
    <tr style={{borderBottom:isLast?"none":"1px solid #f8fafc"}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:99,fontSize:12,fontWeight:700,background:isIn?"#dcfce7":"#fee2e2",color:isIn?"#15803d":"#b91c1c",whiteSpace:"nowrap" as any}}>
          {isIn?<ArrowDownToLine size={11} strokeWidth={2.5}/>:<ArrowUpFromLine size={11} strokeWidth={2.5}/>}
          Stock {isIn?"In":"Out"}
        </span>
      </td>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <div style={{fontSize:13.5,fontWeight:600,color:"#0f172a"}}>{m.product.name}</div>
        <div style={{fontSize:11.5,color:"#94a3b8",marginTop:1}}>{m.product.category.name}</div>
      </td>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <span style={{fontSize:13.5,fontWeight:800,color:isIn?"#15803d":"#b91c1c"}}>{isIn?"+":"−"}{m.quantity}</span>
      </td>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <span style={{fontSize:13,color:m.reason?"#475569":"#94a3b8",fontStyle:m.reason?"normal":"italic"}}>{m.reason??"—"}</span>
      </td>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <Calendar size={12} color="#94a3b8"/>
          <span style={{fontSize:12.5,color:"#64748b"}}>{new Date(m.createdAt).toLocaleDateString("en-PH",{year:"numeric",month:"short",day:"2-digit"})}</span>
        </div>
      </td>
      <td style={{padding:"12px 16px",background:hov?"#fafafa":"transparent"}}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:m.user.role==="ADMIN"?"#dcfce7":"#dbeafe",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:m.user.role==="ADMIN"?"#15803d":"#1d4ed8",flexShrink:0}}>{m.user.name[0]?.toUpperCase()}</div>
          <span style={{fontSize:12.5,color:"#374151",fontWeight:500}}>{m.user.name}</span>
        </div>
      </td>
    </tr>
  );
}
