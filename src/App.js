import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// THE MOVE CLUB — gymOS MVP
// Arquitectura: React SPA + localStorage (demo) → swap a API real con 1 línea
// Stack deploy: Vercel (static export) — zero backend en MVP
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY  = 'move-club-v3';
const SESSION_KEY  = 'move-club-session-v3';
const BARILOCHE_TZ = 'America/Argentina/Buenos_Aires';

// ── Paleta The Move Club ─────────────────────────────────────────────────────
const C = {
  bg:       '#080B12',
  surface:  '#0E1218',
  surface2: '#141820',
  border:   '#1E2530',
  border2:  '#252D3A',
  accent:   '#00D4FF',   // cian eléctrico — identidad Move Club
  accent2:  '#0099CC',
  green:    '#00E676',
  amber:    '#FFB300',
  red:      '#FF3D57',
  purple:   '#A855F7',
  text:     '#E8EDF5',
  muted:    '#5A6478',
  muted2:   '#3A4255',
};

// ── Tipografía inyectada ─────────────────────────────────────────────────────
const FONT_INJECT = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Syne:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:${C.border2};border-radius:2px}
::-webkit-scrollbar-thumb:hover{background:${C.accent2}}
input,select,textarea{font-family:'DM Sans',sans-serif}
button{cursor:pointer;font-family:'DM Sans',sans-serif}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
.fade-up{animation:fadeUp .25s ease both}
.spin{animation:spin 1s linear infinite}
.pulse{animation:pulse 1.5s ease infinite}
`;

// ─── Datos semilla ─────────────────────────────────────────────────────────
const seed = {
  user: { id: 'usr_1', email: 'admin@moveclub.com', password: 'demo123', name: 'The Move Club', role: 'ADMIN' },
  members: [
    { id:'mem_1', name:'Florencia James',   email:'florencia@example.com', plan:'Mensual',     status:'Activa',   renewal:'2026-04-02', risk:'Bajo',  dni:'32100001', phone:'2944-111111', condIva:'CF' },
    { id:'mem_2', name:'Nahuel Erices',     email:'nahuel@example.com',    plan:'Trimestral',  status:'Activa',   renewal:'2026-05-18', risk:'Medio', dni:'30200002', phone:'2944-222222', condIva:'CF' },
    { id:'mem_3', name:'Valentina Ruiz',    email:'valen@example.com',     plan:'Mensual',     status:'Vencida',  renewal:'2026-03-20', risk:'Alto',  dni:'29300003', phone:'2944-333333', condIva:'CF' },
    { id:'mem_4', name:'Rodrigo Pichot',    email:'rodri@example.com',     plan:'Pase diario', status:'Activa',   renewal:'2026-03-28', risk:'Bajo',  dni:'31400004', phone:'2944-444444', condIva:'MO' },
    { id:'mem_5', name:'Camila Destéfanis', email:'cami@example.com',      plan:'Mensual',     status:'Por vencer',renewal:'2026-04-01',risk:'Medio',dni:'33500005', phone:'2944-555555', condIva:'CF' },
  ],
  products: [
    { id:'prd_1', name:'Agua 500ml',        cat:'Bebidas',      stock:18, min:10, price:2500,  cost:800,  sku:'BEB-001' },
    { id:'prd_2', name:'Proteína Whey 1kg', cat:'Suplementos',  stock:3,  min:5,  price:48000, cost:28000,sku:'SUP-001' },
    { id:'prd_3', name:'Creatina 300g',     cat:'Suplementos',  stock:7,  min:4,  price:22000, cost:11000,sku:'SUP-002' },
    { id:'prd_4', name:'Remera Move Club',  cat:'Indumentaria', stock:12, min:3,  price:15000, cost:5500, sku:'IND-001' },
    { id:'prd_5', name:'Energizante 250ml', cat:'Bebidas',      stock:24, min:12, price:4200,  cost:1500, sku:'BEB-002' },
  ],
  invoices: [
    { id:'F-0001', client:'Florencia James', email:'florencia@example.com', amount:95000, status:'Emitido',  cae:'73482910412', source:'Membresías', emailStatus:'Enviado',  sentAt:'24/03/2026 09:15', pdfReady:true },
    { id:'F-0002', client:'Nahuel Erices',   email:'nahuel@example.com',    amount:2500,  status:'Pendiente',cae:'-',           source:'Bebidas',    emailStatus:'Pendiente',sentAt:'-',               pdfReady:false },
    { id:'F-0003', client:'Rodrigo Pichot',  email:'rodri@example.com',     amount:15000, status:'Pendiente',cae:'-',           source:'Membresías', emailStatus:'Pendiente',sentAt:'-',               pdfReady:false },
  ],
  costs: [
    { id:'cst_1', type:'Fijo',    concept:'Alquiler local',    amount:4200000 },
    { id:'cst_2', type:'Fijo',    concept:'Servicios (luz/gas/wifi)', amount:280000 },
    { id:'cst_3', type:'Variable',concept:'Marketing digital',  amount:600000 },
    { id:'cst_4', type:'Variable',concept:'Insumos limpieza',   amount:120000 },
  ],
  sales: [
    { id:'sal_1', unit:'Membresías',  concept:'Plan mensual — Florencia', client:'Florencia James', amount:95000, method:'Transferencia', createdAt:'28/03/2026 08:30' },
    { id:'sal_2', unit:'Bebidas',     concept:'Agua 500ml x2',           client:'Nahuel Erices',   amount:5000,  method:'Efectivo',      createdAt:'28/03/2026 09:00' },
    { id:'sal_3', unit:'Membresías',  concept:'Pase diario — Rodrigo',   client:'Rodrigo Pichot',  amount:15000, method:'QR',            createdAt:'28/03/2026 09:45' },
    { id:'sal_4', unit:'Suplementos', concept:'Creatina 300g',           client:'Rodrigo Pichot',  amount:22000, method:'Efectivo',      createdAt:'28/03/2026 10:15' },
  ],
  activity: [
    { id:'act_1', text:'Sistema iniciado — The Move Club', createdAt:'28/03/2026 08:00' },
  ],
};

// ─── Utilidades ───────────────────────────────────────────────────────────────
const money = n =>
  new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(Number(n)||0);

const now = () =>
  new Date().toLocaleString('es-AR', { year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit' });

const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e||'').trim());

function readStore() {
  try { const r=localStorage.getItem(STORAGE_KEY); return r?JSON.parse(r):{...seed}; }
  catch { return {...seed}; }
}
function writeStore(d) { localStorage.setItem(STORAGE_KEY,JSON.stringify(d)); }
function wait(ms=200) { return new Promise(r=>setTimeout(r,ms)); }

function computeTotals({ sales, costs, products, invoices, members }) {
  const revenue = sales.reduce((a,s)=>a+Number(s.amount||0),0);
  const totalCosts = costs.reduce((a,c)=>a+Number(c.amount||0),0);
  const byMethod = {};
  sales.forEach(s=>{ byMethod[s.method]=(byMethod[s.method]||0)+Number(s.amount||0); });
  const byUnit = {};
  sales.forEach(s=>{ byUnit[s.unit]=(byUnit[s.unit]||0)+Number(s.amount||0); });
  return {
    revenue, totalCosts, profit: revenue-totalCosts,
    members: members.length,
    activeMembers:  members.filter(m=>m.status==='Activa').length,
    expiredMembers: members.filter(m=>m.status==='Vencida').length,
    lowStock:       products.filter(p=>Number(p.stock)<=Number(p.min)).length,
    pendingInv:     invoices.filter(i=>i.status!=='Emitido').length,
    emittedInv:     invoices.filter(i=>i.status==='Emitido').length,
    transactions:   sales.length,
    avgTicket:      sales.length ? Math.round(revenue/sales.length) : 0,
    byMethod, byUnit,
  };
}

// ─── Mock API (reemplazar con fetch real en el futuro) ──────────────────────
const api = {
  async login(email,pw) {
    await wait();
    if(email===seed.user.email&&pw===seed.user.password) {
      const s={token:'demo-token',user:{...seed.user}};
      localStorage.setItem(SESSION_KEY,JSON.stringify(s)); return s;
    }
    throw new Error('Email o contraseña incorrectos');
  },
  async getSession() { await wait(80); const r=localStorage.getItem(SESSION_KEY); return r?JSON.parse(r):null; },
  async logout()     { await wait(80); localStorage.removeItem(SESSION_KEY); return true; },
  async reset()      { await wait(80); writeStore({...seed}); localStorage.removeItem(SESSION_KEY); return true; },

  // Members
  async getMembers(q='') { await wait(); return readStore().members.filter(m=>m.name.toLowerCase().includes(q.toLowerCase())); },
  async saveMember(f) {
    await wait(); const s=readStore();
    s.members = f.id
      ? s.members.map(m=>m.id===f.id?{...m,...f}:m)
      : [{id:`mem_${Date.now()}`,...f,risk:'Bajo'},...s.members];
    s.activity=[{id:`act_${Date.now()}`,text:`${f.id?'Socio actualizado':'Nuevo socio'}: ${f.name}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return s.members;
  },
  async deleteMember(id) {
    await wait(); const s=readStore(); const t=s.members.find(m=>m.id===id);
    s.members=s.members.filter(m=>m.id!==id);
    s.activity=[{id:`act_${Date.now()}`,text:`Baja: ${t?.name||id}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return true;
  },
  // Products
  async getProducts() { await wait(); return readStore().products; },
  async saveProduct(f) {
    await wait(); const s=readStore();
    s.products = f.id
      ? s.products.map(p=>p.id===f.id?{...p,...f,stock:Number(f.stock),min:Number(f.min),price:Number(f.price)}:p)
      : [{id:`prd_${Date.now()}`,...f,stock:Number(f.stock),min:Number(f.min),price:Number(f.price)},...s.products];
    s.activity=[{id:`act_${Date.now()}`,text:`Producto: ${f.name}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return s.products;
  },
  async deleteProduct(id) {
    await wait(); const s=readStore();
    s.products=s.products.filter(p=>p.id!==id); writeStore(s); return true;
  },
  // Sales + stock
  async saveSale(f) {
    await wait(); const s=readStore();
    const sale={id:`sal_${Date.now()}`,unit:f.unit,concept:f.concept,client:f.client,amount:Number(f.amount),method:f.method||'Efectivo',createdAt:now()};
    const inv={id:`F-${String(s.invoices.length+1).padStart(4,'0')}`,client:f.client,email:f.email||'',amount:Number(f.amount),status:'Pendiente',cae:'-',source:f.unit,emailStatus:'Pendiente',sentAt:'-',pdfReady:false};
    s.sales=[sale,...s.sales]; s.invoices=[inv,...s.invoices];
    s.activity=[{id:`act_${Date.now()}`,text:`Venta: ${f.concept}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return {sales:s.sales,invoices:s.invoices};
  },
  async quickSell(f) {
    await wait(); const s=readStore();
    const p=s.products.find(x=>x.id===f.productId);
    if(!p) throw new Error('Producto no encontrado');
    const qty=Number(f.quantity||0);
    if(qty<=0||qty>Number(p.stock)) throw new Error('Cantidad inválida o sin stock');
    const total=Number(p.price)*qty;
    const sale={id:`sal_${Date.now()}`,unit:p.cat,concept:`${p.name} x${qty}`,client:f.client||'Consumidor final',amount:total,method:f.method||'Efectivo',createdAt:now()};
    const inv={id:`F-${String(s.invoices.length+1).padStart(4,'0')}`,client:f.client||'Consumidor final',email:f.email||'',amount:total,status:'Pendiente',cae:'-',source:p.cat,emailStatus:'Pendiente',sentAt:'-',pdfReady:false};
    s.sales=[sale,...s.sales]; s.invoices=[inv,...s.invoices];
    s.products=s.products.map(x=>x.id===p.id?{...x,stock:x.stock-qty}:x);
    s.activity=[{id:`act_${Date.now()}`,text:`Venta rápida: ${p.name} x${qty}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return {sales:s.sales,invoices:s.invoices,products:s.products};
  },
  // Costs
  async getCosts() { await wait(); return readStore().costs; },
  async saveCost(f) {
    await wait(); const s=readStore();
    s.costs = f.id
      ? s.costs.map(c=>c.id===f.id?{...c,...f,amount:Number(f.amount)}:c)
      : [{id:`cst_${Date.now()}`,...f,amount:Number(f.amount)},...s.costs];
    writeStore(s); return s.costs;
  },
  async deleteCost(id) {
    await wait(); const s=readStore(); s.costs=s.costs.filter(c=>c.id!==id); writeStore(s); return true;
  },
  // Invoices / ARCA
  async getInvoices(filter='Todos') {
    await wait(); const s=readStore();
    return filter==='Todos'?s.invoices:s.invoices.filter(i=>i.status===filter);
  },
  async issueInvoice(id) {
    await wait(600); const s=readStore();
    s.invoices=s.invoices.map(i=>i.id===id?{...i,status:'Emitido',cae:String(Math.floor(10000000000+Math.random()*89999999999)),pdfReady:true}:i);
    s.activity=[{id:`act_${Date.now()}`,text:`Factura emitida: ${id}`,createdAt:now()},...s.activity].slice(0,20);
    writeStore(s); return s.invoices;
  },
  async sendEmail(id) {
    await wait(400); const s=readStore();
    s.invoices=s.invoices.map(i=>{
      if(i.id!==id) return i;
      if(i.status!=='Emitido') return {...i,emailStatus:'Error: no emitida'};
      if(!validEmail(i.email)) return {...i,emailStatus:'Email inválido'};
      return {...i,emailStatus:'Enviado',sentAt:now()};
    });
    writeStore(s); return s.invoices;
  },
  async getActivity() { await wait(60); return readStore().activity; },
};

// ─── Componentes base ─────────────────────────────────────────────────────────

function Spinner({ size=16, color=C.accent }) {
  return <div className="spin" style={{width:size,height:size,border:`2px solid ${color}22`,borderTopColor:color,borderRadius:'50%'}} />;
}

function Tag({ children, color=C.accent, bg }) {
  return (
    <span style={{
      display:'inline-flex',alignItems:'center',gap:4,
      padding:'3px 10px',borderRadius:999,fontSize:11,fontWeight:600,letterSpacing:.3,
      background: bg || color+'18', color,
      border:`1px solid ${color}30`,
    }}>{children}</span>
  );
}

function Btn({ children, onClick, variant='primary', size='md', loading, disabled, full, style={} }) {
  const base = {
    display:'inline-flex',alignItems:'center',justifyContent:'center',gap:6,
    border:'none',borderRadius:10,fontWeight:600,cursor:'pointer',
    transition:'all .15s ease', userSelect:'none',
    ...(full?{width:'100%'}:{}),
    ...(size==='sm'?{padding:'6px 12px',fontSize:12}:{padding:'9px 16px',fontSize:13}),
    ...(disabled||loading?{opacity:.45,pointerEvents:'none'}:{}),
  };
  const variants = {
    primary:  { background:C.accent,  color:'#000',          },
    ghost:    { background:'transparent',color:C.muted,border:`1px solid ${C.border2}` },
    danger:   { background:C.red+'18',color:C.red,           border:`1px solid ${C.red}30` },
    success:  { background:C.green+'18',color:C.green,       border:`1px solid ${C.green}30` },
    surface:  { background:C.surface2,color:C.text,          border:`1px solid ${C.border2}` },
  };
  return (
    <button onClick={onClick} disabled={disabled||loading} style={{...base,...variants[variant],...style}}>
      {loading?<Spinner size={13} color={variant==='primary'?'#000':C.accent}/>:null}
      {children}
    </button>
  );
}

function Input({ label, value, onChange, type='text', placeholder='', required }) {
  return (
    <label style={{display:'block'}}>
      {label && <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:5}}>{label}{required&&<span style={{color:C.red}}> *</span>}</div>}
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e=>onChange(e.target.value)}
        style={{
          width:'100%',padding:'9px 12px',borderRadius:9,fontSize:13,color:C.text,
          background:C.surface2,border:`1px solid ${C.border2}`,outline:'none',
          transition:'border-color .15s',
        }}
        onFocus={e=>e.target.style.borderColor=C.accent}
        onBlur={e=>e.target.style.borderColor=C.border2}
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label style={{display:'block'}}>
      {label && <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:5}}>{label}</div>}
      <select
        value={value} onChange={e=>onChange(e.target.value)}
        style={{
          width:'100%',padding:'9px 12px',borderRadius:9,fontSize:13,color:C.text,
          background:C.surface2,border:`1px solid ${C.border2}`,outline:'none',
          appearance:'none',
          backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235A6478' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
          backgroundRepeat:'no-repeat',backgroundPosition:'right 10px center',paddingRight:32,
        }}
      >
        {options.map(o=>Array.isArray(o)
          ? <option key={o[0]} value={o[0]}>{o[1]}</option>
          : <option key={o} value={o}>{o}</option>
        )}
      </select>
    </label>
  );
}

function Card({ children, style={} }) {
  return <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:20,...style}}>{children}</div>;
}

function KPI({ label, value, sub, accent, trend }) {
  return (
    <Card style={{padding:20}}>
      <div style={{fontSize:11,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:8}}>{label}</div>
      <div style={{fontSize:28,fontWeight:700,color:accent||C.text,fontFamily:'Syne,sans-serif',lineHeight:1}}>{value}</div>
      {sub && <div style={{fontSize:12,color:C.muted,marginTop:6}}>{sub}</div>}
      {trend !== undefined && (
        <div style={{fontSize:12,color:trend>=0?C.green:C.red,marginTop:4,fontWeight:600}}>
          {trend>=0?'↑':'↓'} {Math.abs(trend)}% vs ayer
        </div>
      )}
    </Card>
  );
}

function StatusDot({ status }) {
  const map = {
    'Activa':     C.green,
    'Por vencer': C.amber,
    'Vencida':    C.red,
    'Emitido':    C.green,
    'Pendiente':  C.amber,
    'Enviado':    C.green,
    'Bajo':       C.green,
    'Medio':      C.amber,
    'Alto':       C.red,
  };
  const color = map[status] || C.muted;
  return <span style={{display:'inline-flex',alignItems:'center',gap:5,fontSize:12,color,fontWeight:600}}>
    <span style={{width:6,height:6,borderRadius:'50%',background:color,flexShrink:0}}/>
    {status}
  </span>;
}

function Toast({ msg }) {
  if (!msg) return null;
  const isErr = msg.toLowerCase().includes('error')||msg.toLowerCase().includes('inválid');
  return (
    <div style={{
      position:'fixed',bottom:24,right:24,zIndex:9999,
      background: isErr? C.red+'18' : C.green+'18',
      border:`1px solid ${isErr?C.red:C.green}40`,
      color: isErr? C.red : C.green,
      padding:'11px 18px',borderRadius:12,fontSize:13,fontWeight:600,
      boxShadow:'0 8px 32px rgba(0,0,0,.4)',
      animation:'fadeUp .2s ease',
      display:'flex',alignItems:'center',gap:8,
    }}>
      {isErr?'✕':'✓'} {msg}
    </div>
  );
}

function Modal({ open, title, onClose, children, width=480 }) {
  if (!open) return null;
  return (
    <div style={{position:'fixed',inset:0,zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(4px)'}} onClick={onClose}/>
      <div style={{position:'relative',width:'100%',maxWidth:width,background:C.surface,border:`1px solid ${C.border2}`,borderRadius:20,padding:28,boxShadow:'0 32px 80px rgba(0,0,0,.5)',animation:'fadeUp .2s ease'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <div style={{fontSize:15,fontWeight:700,color:C.text,fontFamily:'Syne,sans-serif'}}>{title}</div>
          <button onClick={onClose} style={{background:'none',border:'none',color:C.muted,fontSize:20,lineHeight:1,cursor:'pointer',padding:'2px 6px',borderRadius:6}}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV = [
  { id:'dashboard',  icon:'◈', label:'Dashboard'    },
  { id:'caja',       icon:'⬡', label:'Caja del día' },
  { id:'venta',      icon:'⊕', label:'Nueva venta'  },
  { id:'socios',     icon:'◉', label:'Socios'       },
  { id:'cobros',     icon:'◎', label:'Cobros'       },
  { id:'stock',      icon:'▣', label:'Stock'        },
  { id:'arca',       icon:'◆', label:'Facturación'  },
  { id:'costos',     icon:'⊞', label:'Costos'       },
];

function Sidebar({ section, setSection, user, onLogout }) {
  return (
    <aside style={{
      width:216,flexShrink:0,background:C.surface,
      borderRight:`1px solid ${C.border}`,
      display:'flex',flexDirection:'column',
      height:'100vh',position:'sticky',top:0,
      overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{padding:'24px 20px 16px',borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{
            width:36,height:36,borderRadius:10,
            background:`linear-gradient(135deg,${C.accent},${C.purple})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:16,fontWeight:800,color:'#000',
            boxShadow:`0 4px 16px ${C.accent}40`,
          }}>M</div>
          <div>
            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:13,color:C.text,lineHeight:1.1}}>The Move Club</div>
            <div style={{fontSize:10,color:C.muted,marginTop:1}}>Bariloche · Admin</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{flex:1,padding:'12px 10px',display:'flex',flexDirection:'column',gap:2}}>
        {NAV.map(n=>{
          const active = section===n.id;
          return (
            <button key={n.id} onClick={()=>setSection(n.id)} style={{
              display:'flex',alignItems:'center',gap:10,
              padding:'9px 12px',borderRadius:10,border:'none',
              background: active ? C.accent+'18' : 'transparent',
              color: active ? C.accent : C.muted,
              fontWeight: active ? 600 : 400,
              fontSize:13,textAlign:'left',
              borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
              transition:'all .15s',
            }}>
              <span style={{fontSize:14,opacity:.8}}>{n.icon}</span>
              {n.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{padding:'12px 10px',borderTop:`1px solid ${C.border}`}}>
        <div style={{padding:'8px 12px',borderRadius:10,background:C.surface2,marginBottom:8}}>
          <div style={{fontSize:11,fontWeight:600,color:C.text,marginBottom:1}}>{user?.name}</div>
          <div style={{fontSize:10,color:C.muted}}>{user?.role}</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,padding:'6px 12px',marginBottom:8}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:C.amber}} className="pulse"/>
          <span style={{fontSize:10,color:C.muted}}>ARCA · Mock</span>
        </div>
        <Btn variant="ghost" size="sm" full onClick={onLogout}>Cerrar sesión</Btn>
      </div>
    </aside>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginView({ onLogin }) {
  const [form, setForm] = useState({ email: seed.user.email, pw: seed.user.password });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function handle() {
    setLoading(true); setErr('');
    try { await onLogin(form.email, form.pw); }
    catch(e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{minHeight:'100vh',background:C.bg,display:'grid',placeItems:'center',padding:20}}>
      <div style={{
        width:'100%',maxWidth:880,
        background:C.surface,border:`1px solid ${C.border}`,
        borderRadius:24,overflow:'hidden',
        display:'grid',gridTemplateColumns:'1.2fr 0.8fr',
        boxShadow:'0 32px 80px rgba(0,0,0,.5)',
      }}>
        {/* Lado izquierdo */}
        <div style={{
          padding:48,
          background:`linear-gradient(145deg,${C.bg} 0%,#0a0f1a 100%)`,
          borderRight:`1px solid ${C.border}`,
          position:'relative',overflow:'hidden',
        }}>
          {/* Decoración */}
          <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',background:C.accent+'08',border:`1px solid ${C.accent}15`}}/>
          <div style={{position:'absolute',bottom:-40,left:-40,width:140,height:140,borderRadius:'50%',background:C.purple+'08',border:`1px solid ${C.purple}15`}}/>

          <div style={{position:'relative'}}>
            <div style={{
              display:'inline-flex',alignItems:'center',gap:10,
              background:C.surface,border:`1px solid ${C.border2}`,
              borderRadius:999,padding:'6px 14px',marginBottom:28,
            }}>
              <span style={{width:6,height:6,borderRadius:'50%',background:C.green}} className="pulse"/>
              <span style={{fontSize:11,color:C.muted,fontWeight:600}}>Sistema operativo activo</span>
            </div>

            <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:36,color:C.text,lineHeight:1.1,marginBottom:16}}>
              The Move<br/>
              <span style={{color:C.accent}}>Club</span>
            </div>
            <p style={{color:C.muted,fontSize:14,lineHeight:1.7,maxWidth:340}}>
              Sistema de gestión para el gimnasio boutique de Bariloche. Socios, cobros, stock, caja y facturación ARCA — todo en un lugar.
            </p>

            <div style={{marginTop:32,display:'flex',flexDirection:'column',gap:10}}>
              {['Alta de socios y renovaciones','Caja del día por método de pago','Facturación ARCA integrada','Control de stock con alertas'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:C.muted}}>
                  <span style={{color:C.accent,fontWeight:700}}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lado derecho — formulario */}
        <div style={{padding:48,display:'flex',flexDirection:'column',justifyContent:'center'}}>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text,marginBottom:6}}>Ingresar</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:28}}>Panel de administración</div>

          {err && (
            <div style={{background:C.red+'12',border:`1px solid ${C.red}30`,color:C.red,padding:'9px 13px',borderRadius:9,fontSize:12,marginBottom:16}}>
              {err}
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:24}}>
            <Input label="Email" value={form.email} onChange={v=>setForm({...form,email:v})} type="email" />
            <Input label="Contraseña" value={form.pw} onChange={v=>setForm({...form,pw:v})} type="password" />
          </div>

          <Btn full loading={loading} onClick={handle}>Entrar al sistema</Btn>

          <div style={{marginTop:20,background:C.surface2,border:`1px solid ${C.border}`,borderRadius:10,padding:14}}>
            <div style={{fontSize:11,fontWeight:600,color:C.muted,marginBottom:6,textTransform:'uppercase',letterSpacing:.6}}>Demo</div>
            <div style={{fontSize:12,color:C.muted,lineHeight:1.8}}>admin@moveclub.com<br/>demo123</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({ sales, costs, products, invoices, members, activity }) {
  const t = computeTotals({ sales, costs, products, invoices, members });
  const units = ['Membresías','Bebidas','Suplementos','Indumentaria','Kinesiología','Cafetería'];

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Dashboard</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>Resumen general · {new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
        <KPI label="Ingresos totales"  value={money(t.revenue)}       accent={C.green} />
        <KPI label="Costos"            value={money(t.totalCosts)}     accent={C.red}   />
        <KPI label="Resultado neto"    value={money(t.profit)}         accent={t.profit>=0?C.green:C.red} />
        <KPI label="Socios activos"    value={t.activeMembers}         sub={`${t.expiredMembers} vencidos`} />
        <KPI label="Transacciones"     value={t.transactions}          sub={`Ticket prom: ${money(t.avgTicket)}`} />
        <KPI label="Stock bajo"        value={t.lowStock}              accent={t.lowStock>0?C.amber:C.green} sub="productos críticos" />
      </div>

      {/* Fila inferior */}
      <div style={{display:'grid',gridTemplateColumns:'1.4fr 1fr 1fr',gap:14}}>
        {/* Unidades */}
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:14}}>Ingresos por unidad</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {units.map(u=>{
              const amt = t.byUnit[u]||0;
              const pct = t.revenue ? Math.round((amt/t.revenue)*100) : 0;
              if(!amt) return null;
              return (
                <div key={u}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                    <span style={{color:C.text}}>{u}</span>
                    <span style={{color:C.muted}}>{money(amt)} · {pct}%</span>
                  </div>
                  <div style={{height:4,background:C.border2,borderRadius:999}}>
                    <div style={{height:4,width:`${pct}%`,background:C.accent,borderRadius:999,transition:'width .6s ease'}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Por método de pago */}
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:14}}>Por método de pago</div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {Object.entries(t.byMethod).sort((a,b)=>b[1]-a[1]).map(([m,v])=>(
              <div key={m} style={{display:'flex',justifyContent:'space-between',padding:'7px 10px',background:C.surface2,borderRadius:8,fontSize:12}}>
                <span style={{color:C.muted}}>{m}</span>
                <span style={{color:C.text,fontWeight:600}}>{money(v)}</span>
              </div>
            ))}
            {Object.keys(t.byMethod).length===0 && <div style={{color:C.muted,fontSize:12}}>Sin ventas registradas</div>}
          </div>
        </Card>

        {/* Actividad reciente */}
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:14}}>Actividad reciente</div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {activity.slice(0,7).map(a=>(
              <div key={a.id} style={{padding:'7px 10px',background:C.surface2,borderRadius:8}}>
                <div style={{fontSize:11,color:C.text,marginBottom:2}}>{a.text}</div>
                <div style={{fontSize:10,color:C.muted}}>{a.createdAt}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alertas */}
      {(t.lowStock>0||t.pendingInv>0||t.expiredMembers>0) && (
        <Card style={{border:`1px solid ${C.amber}30`,background:C.amber+'06'}}>
          <div style={{fontSize:12,fontWeight:700,color:C.amber,textTransform:'uppercase',letterSpacing:.6,marginBottom:10}}>⚠ Alertas</div>
          <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
            {t.lowStock>0     && <Tag color={C.amber}>{t.lowStock} productos con stock bajo</Tag>}
            {t.pendingInv>0   && <Tag color={C.amber}>{t.pendingInv} facturas pendientes</Tag>}
            {t.expiredMembers>0 && <Tag color={C.red}>{t.expiredMembers} socios vencidos</Tag>}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── CAJA DEL DÍA ─────────────────────────────────────────────────────────────
function CajaView({ sales, invoices }) {
  const hoy = new Date().toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit',year:'numeric'}).replace(/\//g,'/');
  const salesHoy = sales.filter(s=>s.createdAt.startsWith(hoy.split('/').reverse().join('/')));

  const totalHoy   = salesHoy.reduce((a,s)=>a+Number(s.amount),0);
  const byMethod   = {};
  salesHoy.forEach(s=>{ byMethod[s.method]=(byMethod[s.method]||0)+Number(s.amount); });
  const byUnit     = {};
  salesHoy.forEach(s=>{ byUnit[s.unit]=(byUnit[s.unit]||0)+Number(s.amount); });
  const ticket     = salesHoy.length ? Math.round(totalHoy/salesHoy.length) : 0;

  const [filtro, setFiltro] = useState(null);
  const timeline = filtro ? salesHoy.filter(s=>s.method===filtro) : salesHoy;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Caja del día</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>
          {new Date().toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14}}>
        <KPI label="Total ingresado hoy" value={money(totalHoy)} accent={C.green} />
        <KPI label="Transacciones"       value={salesHoy.length} sub={`Ticket prom: ${money(ticket)}`} />
        <KPI label="Facturas emitidas"   value={invoices.filter(i=>i.status==='Emitido').length} accent={C.accent} sub={`${invoices.filter(i=>i.status==='Pendiente').length} pendientes`} />
        <KPI label="Efectivo en caja"    value={money(byMethod['Efectivo']||0)} accent={C.amber} />
      </div>

      {/* Por método */}
      <Card>
        <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:14}}>
          Por método de pago · hacé clic para filtrar
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:10}}>
          {Object.entries(byMethod).map(([m,v])=>(
            <button key={m} onClick={()=>setFiltro(filtro===m?null:m)} style={{
              padding:'12px 14px',borderRadius:12,textAlign:'left',
              background: filtro===m ? C.accent+'18' : C.surface2,
              border: `1px solid ${filtro===m?C.accent:C.border2}`,
              cursor:'pointer',transition:'all .15s',
            }}>
              <div style={{fontSize:11,color:filtro===m?C.accent:C.muted,fontWeight:600,marginBottom:4}}>{m}</div>
              <div style={{fontSize:18,fontWeight:700,color:C.text,fontFamily:'Syne,sans-serif'}}>{money(v)}</div>
            </button>
          ))}
          {Object.keys(byMethod).length===0 && (
            <div style={{color:C.muted,fontSize:13,gridColumn:'1/-1',padding:8}}>Sin ventas registradas hoy</div>
          )}
        </div>
        {filtro && <div style={{marginTop:10,fontSize:12,color:C.accent}}>Filtrando por {filtro} — {timeline.length} operaciones · {money(timeline.reduce((a,s)=>a+Number(s.amount),0))}</div>}
      </Card>

      {/* Por unidad */}
      {Object.keys(byUnit).length>0 && (
        <Card>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:14}}>Por unidad de negocio</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {Object.entries(byUnit).sort((a,b)=>b[1]-a[1]).map(([u,v])=>{
              const pct = totalHoy>0?Math.round((v/totalHoy)*100):0;
              return (
                <div key={u}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,fontSize:12}}>
                    <span style={{color:C.text}}>{u}</span>
                    <span style={{color:C.muted}}>{money(v)} · {pct}%</span>
                  </div>
                  <div style={{height:3,background:C.border2,borderRadius:999}}>
                    <div style={{height:3,width:`${pct}%`,background:C.accent,borderRadius:999}}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
          <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6}}>
            Transacciones {filtro?`· ${filtro}`:'del día'}
          </div>
          <span style={{fontSize:11,color:C.muted}}>{timeline.length} operaciones</span>
        </div>
        {timeline.length===0
          ? <div style={{color:C.muted,fontSize:13,padding:'12px 0',textAlign:'center'}}>Sin transacciones</div>
          : <div style={{display:'flex',flexDirection:'column',gap:0}}>
              <div style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr 100px 90px',gap:8,padding:'6px 8px',borderBottom:`1px solid ${C.border}`,marginBottom:4}}>
                {['Hora','Socio / Cliente','Concepto','Método','Total'].map(h=>(
                  <div key={h} style={{fontSize:10,fontWeight:600,color:C.muted,textTransform:'uppercase',letterSpacing:.5}}>{h}</div>
                ))}
              </div>
              {timeline.map(s=>(
                <div key={s.id} style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr 100px 90px',gap:8,padding:'9px 8px',borderBottom:`1px solid ${C.border}22`,fontSize:12}}>
                  <div style={{color:C.muted,fontVariantNumeric:'tabular-nums'}}>{s.createdAt.split(' ')[1]||'—'}</div>
                  <div style={{color:C.text,fontWeight:500}}>{s.client}</div>
                  <div style={{color:C.muted}}>{s.concept}</div>
                  <div><Tag color={C.muted2}>{s.method}</Tag></div>
                  <div style={{color:C.text,fontWeight:600,textAlign:'right'}}>{money(s.amount)}</div>
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'80px 1fr 1fr 100px 90px',gap:8,padding:'9px 8px',borderTop:`1px solid ${C.border}`,marginTop:4}}>
                <div/><div/><div/>
                <div style={{fontSize:11,color:C.muted,fontWeight:600}}>Total</div>
                <div style={{color:C.green,fontWeight:700,textAlign:'right'}}>{money(timeline.reduce((a,s)=>a+Number(s.amount),0))}</div>
              </div>
            </div>
        }
      </Card>
    </div>
  );
}

// ─── VENTA RÁPIDA ─────────────────────────────────────────────────────────────
function VentaView({ products, onSaleCreated, toast }) {
  const emptyQ = { productId:'', client:'', email:'', quantity:1, method:'Efectivo' };
  const emptyM = { unit:'Membresías', concept:'', client:'', email:'', amount:'', method:'Efectivo' };

  const [quick, setQuick] = useState(emptyQ);
  const [manual, setManual] = useState(emptyM);
  const [loading, setLoading] = useState({ quick:false, manual:false });

  const prod = products.find(p=>p.id===quick.productId);
  const quickTotal = prod ? Number(prod.price)*Number(quick.quantity||1) : 0;

  async function handleQuick() {
    setLoading({...loading,quick:true});
    try {
      await onSaleCreated('quick', quick);
      setQuick(emptyQ);
    } finally { setLoading({...loading,quick:false}); }
  }

  async function handleManual() {
    setLoading({...loading,manual:true});
    try {
      await onSaleCreated('manual', manual);
      setManual(emptyM);
    } finally { setLoading({...loading,manual:false}); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Nueva venta</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>Registrá ventas de mostrador y descuentá stock automáticamente</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
        {/* Venta rápida */}
        <Card>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:C.accent}}>⚡</span> Venta rápida · descuenta stock
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Select label="Producto" value={quick.productId} onChange={v=>setQuick({...quick,productId:v})}
              options={[['','Seleccionar producto'],...products.map(p=>[p.id,`${p.name} — ${money(p.price)} (stock: ${p.stock})`])]} />
            <Input label="Cantidad" type="number" value={quick.quantity} onChange={v=>setQuick({...quick,quantity:v})} />
            <Input label="Cliente" value={quick.client} onChange={v=>setQuick({...quick,client:v})} placeholder="Consumidor final" />
            <Input label="Email (para factura)" value={quick.email} onChange={v=>setQuick({...quick,email:v})} type="email" />
            <Select label="Método de pago" value={quick.method} onChange={v=>setQuick({...quick,method:v})}
              options={['Efectivo','Transferencia','Débito','Crédito','QR']} />

            {prod && (
              <div style={{background:C.surface2,border:`1px solid ${C.border2}`,borderRadius:10,padding:12}}>
                <div style={{fontSize:12,color:C.muted,marginBottom:4}}>Resumen</div>
                <div style={{fontSize:20,fontWeight:700,color:C.green,fontFamily:'Syne,sans-serif'}}>{money(quickTotal)}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:2}}>{quick.quantity} × {prod.name}</div>
              </div>
            )}
            <Btn full loading={loading.quick} onClick={handleQuick} disabled={!quick.productId}>
              Cobrar {prod?money(quickTotal):''}
            </Btn>
          </div>
        </Card>

        {/* Venta manual */}
        <Card>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:C.purple}}>◈</span> Venta manual · membresías y servicios
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Select label="Unidad" value={manual.unit} onChange={v=>setManual({...manual,unit:v})}
              options={['Membresías','Bebidas','Suplementos','Indumentaria','Kinesiología','Cafetería','Eventos']} />
            <Input label="Concepto" value={manual.concept} onChange={v=>setManual({...manual,concept:v})} placeholder="Ej: Plan mensual — Florencia" />
            <Input label="Cliente" value={manual.client} onChange={v=>setManual({...manual,client:v})} />
            <Input label="Email (para factura)" value={manual.email} onChange={v=>setManual({...manual,email:v})} type="email" />
            <Input label="Monto" type="number" value={manual.amount} onChange={v=>setManual({...manual,amount:v})} />
            <Select label="Método de pago" value={manual.method} onChange={v=>setManual({...manual,method:v})}
              options={['Efectivo','Transferencia','Débito','Crédito','QR']} />
            <Btn full variant="success" loading={loading.manual} onClick={handleManual} disabled={!manual.concept||!manual.amount}>
              Registrar {manual.amount?money(manual.amount):'venta'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── SOCIOS ───────────────────────────────────────────────────────────────────
function SociosView({ members, onSave, onDelete }) {
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  const empty = { id:null, name:'', email:'', phone:'', dni:'', plan:'Mensual', status:'Activa', renewal:'', condIva:'CF' };
  const filtered = members.filter(m=>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.email||'').toLowerCase().includes(search.toLowerCase())
  );

  function openNew()  { setForm(empty);    setModal(true); }
  function openEdit(m){ setForm({...m});   setModal(true); }

  async function handleSave() {
    if(!form.name.trim()) return;
    setLoading(true);
    try { await onSave(form); setModal(false); }
    finally { setLoading(false); }
  }

  const STATUS_COLOR = { 'Activa':C.green, 'Por vencer':C.amber, 'Vencida':C.red };

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Socios</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>{members.length} registrados · {members.filter(m=>m.status==='Activa').length} activos</div>
        </div>
        <Btn onClick={openNew}>+ Nuevo socio</Btn>
      </div>

      <div style={{maxWidth:360}}>
        <Input placeholder="Buscar por nombre o email..." value={search} onChange={setSearch} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:12}}>
        {filtered.map(m=>{
          const sc = STATUS_COLOR[m.status]||C.muted;
          const rc = {Bajo:C.green,Medio:C.amber,Alto:C.red}[m.risk]||C.muted;
          return (
            <Card key={m.id} style={{padding:16}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{
                    width:38,height:38,borderRadius:12,
                    background:`linear-gradient(135deg,${sc}20,${sc}10)`,
                    border:`1px solid ${sc}30`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:14,fontWeight:700,color:sc,
                  }}>
                    {m.name.split(' ').map(n=>n[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div>
                    <div style={{fontSize:11,color:C.muted}}>{m.email}</div>
                  </div>
                </div>
                <StatusDot status={m.status} />
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
                {[
                  ['Plan', m.plan],
                  ['Vence', m.renewal||'—'],
                  ['Tel', m.phone||'—'],
                  ['DNI', m.dni||'—'],
                ].map(([k,v])=>(
                  <div key={k} style={{background:C.surface2,borderRadius:8,padding:'6px 10px'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{k}</div>
                    <div style={{fontSize:11,color:C.text,marginTop:1}}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <Tag color={rc}>Riesgo {m.risk}</Tag>
                <div style={{display:'flex',gap:6}}>
                  <Btn size="sm" variant="surface" onClick={()=>openEdit(m)}>Editar</Btn>
                  <Btn size="sm" variant="danger"  onClick={()=>onDelete(m.id)}>Baja</Btn>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal} title={form?.id?'Editar socio':'Nuevo socio'} onClose={()=>setModal(false)}>
        {form && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input label="Nombre *"    value={form.name}    onChange={v=>setForm({...form,name:v})} />
              <Input label="Apellido"    value={form.apellido||''} onChange={v=>setForm({...form,apellido:v})} />
              <Input label="Email"       value={form.email}   onChange={v=>setForm({...form,email:v})}    type="email" />
              <Input label="Teléfono"   value={form.phone||''}    onChange={v=>setForm({...form,phone:v})} />
              <Input label="DNI"         value={form.dni||''}  onChange={v=>setForm({...form,dni:v})} />
              <Select label="Cond. IVA" value={form.condIva||'CF'} onChange={v=>setForm({...form,condIva:v})}
                options={[['CF','Consumidor Final'],['MO','Monotributista'],['RI','Resp. Inscripto']]} />
              <Select label="Plan"       value={form.plan}    onChange={v=>setForm({...form,plan:v})}
                options={['Mensual','Trimestral','Pase diario','Semestral','Anual']} />
              <Select label="Estado"     value={form.status}  onChange={v=>setForm({...form,status:v})}
                options={['Activa','Por vencer','Vencida','Suspendida']} />
              <Input label="Vencimiento" value={form.renewal||''} onChange={v=>setForm({...form,renewal:v})} placeholder="YYYY-MM-DD" />
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:4}}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn loading={loading} onClick={handleSave}>{form.id?'Guardar cambios':'Crear socio'}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── COBROS ───────────────────────────────────────────────────────────────────
function CobrosView({ members, onSaleCreated }) {
  const [modal, setModal]   = useState(null); // socio seleccionado
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({ plan:'Mensual', amount:'', method:'Efectivo', desc:'', emitir:true });

  const urgencia = m => {
    if(m.status==='Vencida')    return 0;
    if(m.status==='Por vencer') return 1;
    if(m.status==='Activa')     return 2;
    return 3;
  };
  const sorted = [...members].sort((a,b)=>urgencia(a)-urgencia(b));

  const ETIQUETA = {
    'Vencida':    { color:C.red,   label:'Vencida' },
    'Por vencer': { color:C.amber, label:'Vence pronto' },
    'Activa':     { color:C.green, label:'Al día' },
  };

  async function handleCobrar() {
    if(!form.amount) return;
    setLoading(true);
    try {
      await onSaleCreated('manual', {
        unit:'Membresías',
        concept: form.desc || `Renovación ${form.plan} — ${modal.name}`,
        client:  modal.name,
        email:   modal.email,
        amount:  form.amount,
        method:  form.method,
      });
      setModal(null);
    } finally { setLoading(false); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Cobros & Renovaciones</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>
          {members.filter(m=>m.status==='Vencida').length} vencidos ·{' '}
          {members.filter(m=>m.status==='Por vencer').length} vencen pronto
        </div>
      </div>

      {/* Tira de KPIs */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <KPI label="Al día"       value={members.filter(m=>m.status==='Activa').length}     accent={C.green} />
        <KPI label="Vence pronto" value={members.filter(m=>m.status==='Por vencer').length} accent={C.amber} />
        <KPI label="Vencidos"     value={members.filter(m=>m.status==='Vencida').length}    accent={C.red}   />
      </div>

      {/* Lista */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
        {sorted.map(m=>{
          const cfg = ETIQUETA[m.status]||{color:C.muted,label:m.status};
          return (
            <Card key={m.id} style={{border:`1px solid ${cfg.color}22`}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:C.text}}>{m.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{m.plan} · vence {m.renewal||'—'}</div>
                  <div style={{fontSize:11,color:C.muted}}>{m.phone||m.email}</div>
                </div>
                <Tag color={cfg.color}>{cfg.label}</Tag>
              </div>
              <Btn full size="sm" onClick={()=>{setModal(m);setForm({plan:m.plan,amount:'',method:'Efectivo',desc:'',emitir:true});}}>
                💳 Cobrar renovación
              </Btn>
            </Card>
          );
        })}
      </div>

      <Modal open={!!modal} title={`Cobrar — ${modal?.name}`} onClose={()=>setModal(null)}>
        {modal && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Select label="Plan" value={form.plan} onChange={v=>setForm({...form,plan:v})}
              options={['Mensual','Trimestral','Pase diario','Semestral','Anual']} />
            <Input  label="Monto *" type="number" value={form.amount} onChange={v=>setForm({...form,amount:v})} />
            <Select label="Método de pago" value={form.method} onChange={v=>setForm({...form,method:v})}
              options={['Efectivo','Transferencia','Débito','Crédito','QR']} />
            <Input  label="Nota interna" value={form.desc} onChange={v=>setForm({...form,desc:v})} placeholder="Opcional" />
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:C.surface2,borderRadius:9}}>
              <span style={{fontSize:12,color:C.muted}}>Emitir factura ARCA</span>
              <button onClick={()=>setForm({...form,emitir:!form.emitir})} style={{
                width:40,height:22,borderRadius:999,border:'none',cursor:'pointer',
                background: form.emitir?C.accent:C.border2,
                transition:'background .2s',position:'relative',
              }}>
                <span style={{position:'absolute',top:2,left:form.emitir?20:2,width:18,height:18,borderRadius:'50%',background:'#fff',transition:'left .2s'}}/>
              </button>
            </div>
            {form.amount && (
              <div style={{background:C.green+'12',border:`1px solid ${C.green}30`,borderRadius:10,padding:'10px 14px'}}>
                <div style={{fontSize:12,color:C.muted}}>Total a cobrar</div>
                <div style={{fontSize:22,fontWeight:700,color:C.green,fontFamily:'Syne,sans-serif'}}>{money(form.amount)}</div>
              </div>
            )}
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn loading={loading} disabled={!form.amount} onClick={handleCobrar}>
                Confirmar cobro
              </Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── STOCK ────────────────────────────────────────────────────────────────────
function StockView({ products, onSave, onDelete }) {
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(false);
  const empty = { id:null, name:'', cat:'Bebidas', sku:'', stock:0, min:0, price:0, cost:0 };

  async function handleSave() {
    setLoading(true);
    try { await onSave(form); setModal(false); }
    finally { setLoading(false); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Stock</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>
            {products.filter(p=>p.stock<=p.min).length} productos bajo mínimo
          </div>
        </div>
        <Btn onClick={()=>{setForm(empty);setModal(true);}}>+ Agregar producto</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:12}}>
        {products.map(p=>{
          const bajo = Number(p.stock)<=Number(p.min);
          const margen = p.cost>0?Math.round(((p.price-p.cost)/p.price)*100):null;
          return (
            <Card key={p.id} style={{border:`1px solid ${bajo?C.red+'30':C.border}`}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div>
                  <div style={{fontWeight:600,fontSize:13,color:C.text}}>{p.name}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:1}}>{p.cat}{p.sku?` · ${p.sku}`:''}</div>
                </div>
                {bajo ? <Tag color={C.red}>Stock bajo</Tag> : <Tag color={C.green}>OK</Tag>}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
                {[
                  ['Stock', p.stock, bajo?C.red:C.green],
                  ['Mínimo', p.min, C.muted],
                  ['Precio', money(p.price), C.text],
                ].map(([k,v,color])=>(
                  <div key={k} style={{background:C.surface2,borderRadius:8,padding:'6px 8px',textAlign:'center'}}>
                    <div style={{fontSize:10,color:C.muted,fontWeight:600}}>{k}</div>
                    <div style={{fontSize:13,fontWeight:700,color,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>

              {margen!==null && (
                <div style={{fontSize:11,color:C.muted,marginBottom:10}}>
                  Margen: <span style={{color:margen>40?C.green:margen>20?C.amber:C.red,fontWeight:600}}>{margen}%</span>
                </div>
              )}

              <div style={{display:'flex',gap:6}}>
                <Btn size="sm" variant="surface" full onClick={()=>{setForm({...p});setModal(true);}}>Editar</Btn>
                <Btn size="sm" variant="danger" onClick={()=>onDelete(p.id)}>×</Btn>
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={modal} title={form?.id?'Editar producto':'Nuevo producto'} onClose={()=>setModal(false)}>
        {form && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              <Input label="Nombre *"  value={form.name}  onChange={v=>setForm({...form,name:v})} />
              <Input label="SKU"       value={form.sku||''}    onChange={v=>setForm({...form,sku:v})} />
              <Select label="Categoría" value={form.cat}  onChange={v=>setForm({...form,cat:v})}
                options={['Bebidas','Suplementos','Indumentaria','Accesorios']} />
              <Input label="Stock"     type="number" value={form.stock} onChange={v=>setForm({...form,stock:v})} />
              <Input label="Mínimo"    type="number" value={form.min}   onChange={v=>setForm({...form,min:v})} />
              <Input label="Precio venta" type="number" value={form.price} onChange={v=>setForm({...form,price:v})} />
              <Input label="Costo"     type="number" value={form.cost||0} onChange={v=>setForm({...form,cost:v})} />
            </div>
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn loading={loading} onClick={handleSave}>{form.id?'Guardar cambios':'Agregar'}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── ARCA / FACTURACIÓN ───────────────────────────────────────────────────────
function ArcaView({ invoices, onIssue, onSendEmail }) {
  const [filtro, setFiltro] = useState('Todos');
  const [loading, setLoading] = useState({});

  const filtered = filtro==='Todos'?invoices:invoices.filter(i=>i.status===filtro);

  async function handleIssue(id) {
    setLoading({...loading,[id+'_issue']:true});
    try { await onIssue(id); }
    finally { setLoading(l=>({...l,[id+'_issue']:false})); }
  }
  async function handleEmail(id) {
    setLoading({...loading,[id+'_email']:true});
    try { await onSendEmail(id); }
    finally { setLoading(l=>({...l,[id+'_email']:false})); }
  }

  const emitidos  = invoices.filter(i=>i.status==='Emitido').length;
  const pendientes= invoices.filter(i=>i.status==='Pendiente').length;
  const emails    = invoices.filter(i=>i.emailStatus==='Enviado').length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div>
        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Facturación ARCA</div>
        <div style={{fontSize:13,color:C.muted,marginTop:2}}>Comprobantes fiscales · modo mock/homologación activo</div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        <KPI label="Emitidos"   value={emitidos}   accent={C.green} />
        <KPI label="Pendientes" value={pendientes}  accent={pendientes>0?C.amber:C.muted} />
        <KPI label="Mails enviados" value={`${emails}/${emitidos}`} accent={C.accent} />
      </div>

      {/* Filtros */}
      <div style={{display:'flex',gap:8}}>
        {['Todos','Emitido','Pendiente'].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{
            padding:'6px 14px',borderRadius:999,fontSize:12,fontWeight:600,cursor:'pointer',
            border:`1px solid ${filtro===f?C.accent:C.border2}`,
            background: filtro===f?C.accent+'18':'transparent',
            color: filtro===f?C.accent:C.muted,
            transition:'all .15s',
          }}>{f}</button>
        ))}
      </div>

      {/* Lista */}
      <Card>
        {filtered.map((inv,i)=>(
          <div key={inv.id} style={{
            display:'grid',gridTemplateColumns:'90px 1fr 80px auto',gap:12,alignItems:'center',
            padding:'12px 8px',
            borderBottom: i<filtered.length-1?`1px solid ${C.border}22`:'none',
          }}>
            <div style={{fontSize:12,fontWeight:700,color:C.accent,fontFamily:'Syne,sans-serif'}}>{inv.id}</div>
            <div>
              <div style={{fontSize:12,fontWeight:600,color:C.text}}>{inv.client}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:1}}>
                {inv.source} · {money(inv.amount)}
                {inv.cae!=='-'&&<span style={{color:C.green}}> · CAE: {inv.cae}</span>}
              </div>
              <div style={{fontSize:10,color:C.muted,marginTop:1}}>
                📧 {inv.email||'—'} · {inv.emailStatus}
                {inv.sentAt!=='-'&&` · ${inv.sentAt}`}
              </div>
            </div>
            <StatusDot status={inv.status} />
            <div style={{display:'flex',gap:6}}>
              {inv.status!=='Emitido' && (
                <Btn size="sm" variant="surface" loading={loading[inv.id+'_issue']} onClick={()=>handleIssue(inv.id)}>
                  Emitir
                </Btn>
              )}
              <Btn size="sm" variant="ghost" loading={loading[inv.id+'_email']} onClick={()=>handleEmail(inv.id)}>
                Mail
              </Btn>
            </div>
          </div>
        ))}
        {filtered.length===0 && <div style={{color:C.muted,fontSize:13,padding:'16px 8px',textAlign:'center'}}>Sin comprobantes</div>}
      </Card>

      {/* Info técnica */}
      <Card style={{border:`1px solid ${C.accent}20`,background:C.accent+'06'}}>
        <div style={{fontSize:12,fontWeight:700,color:C.accent,marginBottom:10}}>ℹ Modo mock · próximos pasos para producción</div>
        <div style={{display:'flex',flexDirection:'column',gap:6}}>
          {[
            ['Obtener certificado AFIP/ARCA','Gestionarlo en AFIP con CUIT del negocio'],
            ['Configurar .env','ARCA_CUIT, ARCA_CERT, ARCA_KEY, ARCA_PUNTO_VENTA'],
            ['Cambiar adapter a producción','Cambiar ARCA_ENV=produccion en Vercel'],
            ['Probar en homologación primero','Con CUIT 20000000001 el adaptador ya funciona'],
          ].map(([t,d])=>(
            <div key={t} style={{display:'flex',gap:10,alignItems:'flex-start',padding:'8px 10px',background:C.surface2,borderRadius:8}}>
              <span style={{color:C.accent,flexShrink:0}}>→</span>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:C.text}}>{t}</div>
                <div style={{fontSize:11,color:C.muted,marginTop:1}}>{d}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── COSTOS ───────────────────────────────────────────────────────────────────
function CostosView({ costs, sales, onSave, onDelete }) {
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(null);
  const [loading, setLoading] = useState(false);
  const empty = { id:null, type:'Fijo', concept:'', amount:'' };

  const totalFijos    = costs.filter(c=>c.type==='Fijo').reduce((a,c)=>a+Number(c.amount),0);
  const totalVars     = costs.filter(c=>c.type==='Variable').reduce((a,c)=>a+Number(c.amount),0);
  const totalIngresos = sales.reduce((a,s)=>a+Number(s.amount),0);
  const resultado     = totalIngresos-(totalFijos+totalVars);

  async function handleSave() {
    if(!form.concept.trim()||!form.amount) return;
    setLoading(true);
    try { await onSave(form); setModal(false); }
    finally { setLoading(false); }
  }

  return (
    <div style={{display:'flex',flexDirection:'column',gap:20}} className="fade-up">
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:22,color:C.text}}>Costos</div>
          <div style={{fontSize:13,color:C.muted,marginTop:2}}>Estructura de costos fijos y variables</div>
        </div>
        <Btn onClick={()=>{setForm(empty);setModal(true);}}>+ Agregar costo</Btn>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
        <KPI label="Ingresos" value={money(totalIngresos)} accent={C.green} />
        <KPI label="Costos fijos" value={money(totalFijos)} accent={C.red} />
        <KPI label="Costos variables" value={money(totalVars)} accent={C.amber} />
        <KPI label="Resultado neto" value={money(resultado)} accent={resultado>=0?C.green:C.red} />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        {['Fijo','Variable'].map(tipo=>(
          <Card key={tipo}>
            <div style={{fontSize:12,fontWeight:700,color:C.muted,textTransform:'uppercase',letterSpacing:.6,marginBottom:12}}>
              {tipo==='Fijo'?'Costos fijos':'Costos variables'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {costs.filter(c=>c.type===tipo).map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 10px',background:C.surface2,borderRadius:8}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:C.text}}>{c.concept}</div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <span style={{fontSize:13,fontWeight:600,color:C.text}}>{money(c.amount)}</span>
                    <Btn size="sm" variant="ghost" onClick={()=>{setForm({...c});setModal(true);}}>✎</Btn>
                    <Btn size="sm" variant="danger" onClick={()=>onDelete(c.id)}>×</Btn>
                  </div>
                </div>
              ))}
              {costs.filter(c=>c.type===tipo).length===0 && (
                <div style={{color:C.muted,fontSize:12,padding:'8px 10px'}}>Sin costos {tipo.toLowerCase()}s registrados</div>
              )}
              <div style={{display:'flex',justifyContent:'space-between',padding:'6px 10px',borderTop:`1px solid ${C.border}`,marginTop:4}}>
                <span style={{fontSize:11,fontWeight:600,color:C.muted}}>Subtotal</span>
                <span style={{fontSize:13,fontWeight:700,color:tipo==='Fijo'?C.red:C.amber}}>
                  {money(costs.filter(c=>c.type===tipo).reduce((a,c)=>a+Number(c.amount),0))}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal} title={form?.id?'Editar costo':'Nuevo costo'} onClose={()=>setModal(false)}>
        {form && (
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <Select label="Tipo" value={form.type} onChange={v=>setForm({...form,type:v})} options={['Fijo','Variable']} />
            <Input  label="Concepto *" value={form.concept} onChange={v=>setForm({...form,concept:v})} />
            <Input  label="Monto *" type="number" value={form.amount} onChange={v=>setForm({...form,amount:v})} />
            <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
              <Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn>
              <Btn loading={loading} onClick={handleSave}>{form.id?'Guardar':'Agregar'}</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
export default function MoveClubApp() {
  const [session,  setSession]  = useState(null);
  const [booting,  setBooting]  = useState(true);
  const [section,  setSection]  = useState('dashboard');
  const [toast,    setToast]    = useState('');
  const [members,  setMembers]  = useState(seed.members);
  const [products, setProducts] = useState(seed.products);
  const [invoices, setInvoices] = useState(seed.invoices);
  const [costs,    setCosts]    = useState(seed.costs);
  const [sales,    setSales]    = useState(seed.sales);
  const [activity, setActivity] = useState(seed.activity);

  const show = useCallback(msg => {
    setToast(msg);
    setTimeout(()=>setToast(''), 3000);
  }, []);

  // Boot
  useEffect(()=>{
    (async()=>{
      try {
        const s=await api.getSession();
        setSession(s);
        const st=readStore();
        setMembers(st.members); setProducts(st.products);
        setInvoices(st.invoices); setCosts(st.costs);
        setSales(st.sales); setActivity(st.activity);
      } finally { setBooting(false); }
    })();
  },[]);

  async function handleLogin(email,pw) {
    const s=await api.login(email,pw);
    setSession(s);
  }
  async function handleLogout() {
    await api.logout(); setSession(null);
  }

  // Members
  async function handleSaveMember(form) {
    const updated=await api.saveMember(form);
    setMembers(updated); setActivity(readStore().activity);
    show(form.id?'Socio actualizado':'Socio creado ✓');
  }
  async function handleDeleteMember(id) {
    await api.deleteMember(id);
    setMembers(readStore().members); setActivity(readStore().activity);
    show('Baja registrada');
  }

  // Products
  async function handleSaveProduct(form) {
    const updated=await api.saveProduct(form);
    setProducts(updated); setActivity(readStore().activity);
    show('Producto guardado ✓');
  }
  async function handleDeleteProduct(id) {
    await api.deleteProduct(id); setProducts(readStore().products);
    show('Producto eliminado');
  }

  // Sales
  async function handleSaleCreated(tipo, form) {
    let result;
    if(tipo==='quick') result=await api.quickSell(form);
    else               result=await api.saveSale(form);
    setSales(result.sales); setInvoices(result.invoices);
    if(result.products) setProducts(result.products);
    setActivity(readStore().activity);
    show('Venta registrada ✓');
  }

  // Costs
  async function handleSaveCost(form) {
    const updated=await api.saveCost(form); setCosts(updated);
    show('Costo guardado ✓');
  }
  async function handleDeleteCost(id) {
    await api.deleteCost(id); setCosts(readStore().costs);
    show('Costo eliminado');
  }

  // ARCA
  async function handleIssue(id) {
    const updated=await api.issueInvoice(id); setInvoices(updated);
    setActivity(readStore().activity); show('Factura emitida (mock ARCA) ✓');
  }
  async function handleSendEmail(id) {
    const updated=await api.sendEmail(id); setInvoices(updated);
    show('Estado de email actualizado');
  }

  // ── Render ───────────────────────────────────────────────────────────────
  if(booting) {
    return (
      <div style={{minHeight:'100vh',background:C.bg,display:'grid',placeItems:'center'}}>
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
          <Spinner size={32} />
          <div style={{fontSize:13,color:C.muted}}>Iniciando The Move Club…</div>
        </div>
      </div>
    );
  }

  if(!session) return <LoginView onLogin={handleLogin} />;

  const views = {
    dashboard: <DashboardView sales={sales} costs={costs} products={products} invoices={invoices} members={members} activity={activity} />,
    caja:      <CajaView      sales={sales} invoices={invoices} />,
    venta:     <VentaView     products={products} onSaleCreated={handleSaleCreated} />,
    socios:    <SociosView    members={members} onSave={handleSaveMember} onDelete={handleDeleteMember} />,
    cobros:    <CobrosView    members={members} onSaleCreated={handleSaleCreated} />,
    stock:     <StockView     products={products} onSave={handleSaveProduct} onDelete={handleDeleteProduct} />,
    arca:      <ArcaView      invoices={invoices} onIssue={handleIssue} onSendEmail={handleSendEmail} />,
    costos:    <CostosView    costs={costs} sales={sales} onSave={handleSaveCost} onDelete={handleDeleteCost} />,
  };

  return (
    <>
      <style>{FONT_INJECT}</style>
      <div style={{display:'flex',minHeight:'100vh',background:C.bg}}>
        <Sidebar section={section} setSection={setSection} user={session.user} onLogout={handleLogout} />
        <main style={{flex:1,padding:28,overflowY:'auto',maxWidth:'100%'}}>
          {views[section] || views.dashboard}
        </main>
      </div>
      <Toast msg={toast} />
    </>
  );
}
