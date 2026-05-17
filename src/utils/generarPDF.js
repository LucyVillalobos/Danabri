/**
 * generarPDF.js — genera documentos PDF abriendo una ventana imprimible.
 * Sin librerías externas, funciona con window.print() / "Guardar como PDF".
 */

const DANABRI = {
  nombre:      "PAPELERÍA DANABRI",
  rfc:         "DXXX000000XXX",
  direccion:   "Av. Principal #123, Col. Centro",
  ciudad:      "León, Guanajuato, C.P. 37000",
  tel:         "477-XXX-XXXX",
  email:       "contacto@danabri.com",
  web:         "www.danabri.com",
  facturacion: "facturacion.danabri.com/factura",
};

function estilosBase() {
  return `<style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;font-size:11px;color:#1a1a1a;background:#fff}
    .page{width:210mm;min-height:140mm;margin:0 auto;padding:12mm 14mm}
    table{width:100%;border-collapse:collapse}
    th{background:#1e3a5f;color:#fff;padding:6px 8px;text-align:left;font-size:10px;text-transform:uppercase}
    td{padding:5px 8px;border-bottom:1px solid #e5e7eb;font-size:11px}
    tr:nth-child(even) td{background:#f9fafb}
    .right{text-align:right} .center{text-align:center}
    .bold{font-weight:700} .muted{color:#6b7280;font-size:10px}
    hr.thick{border:none;border-top:2px solid #1e3a5f;margin:8px 0}
    @media print{body{margin:0}.page{padding:8mm 10mm}.no-print{display:none!important}}
    @media screen{
      body{background:#f3f4f6}
      .page{background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);margin:20px auto;border-radius:4px}
      .toolbar{position:fixed;top:16px;right:16px;display:flex;gap:8px;z-index:100}
      .btn{padding:8px 18px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}
      .btn-print{background:#e8734a;color:#fff}
      .btn-close{background:#e5e7eb;color:#374151}
    }
  </style>`;
}

function toolbar() {
  return `<div class="toolbar no-print">
    <button class="btn btn-print" onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
    <button class="btn btn-close" onclick="window.close()">✕ Cerrar</button>
  </div>`;
}

function abrir(html, titulo) {
  const win = window.open("", "_blank", "width=920,height=720");
  if (!win) { alert("Permite ventanas emergentes para generar el PDF"); return; }
  win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${titulo}</title>${estilosBase()}</head><body>${toolbar()}${html}</body></html>`);
  win.document.close();
  win.focus();
}

function header() {
  return `<table style="margin-bottom:12px"><tr>
    <td style="border:none;padding:0;width:55%">
      <div style="font-size:20px;font-weight:900;color:#1e3a5f">PAPELERÍA<span style="color:#e8734a"> DANABRI</span></div>
      <div class="muted">${DANABRI.rfc}</div>
      <div class="muted">${DANABRI.direccion}</div>
      <div class="muted">${DANABRI.ciudad}</div>
      <div class="muted">Tel: ${DANABRI.tel} · ${DANABRI.email}</div>
    </td>
    <td style="border:none;padding:0;text-align:right;vertical-align:top">
      <div class="muted">Facturación en línea:</div>
      <div style="color:#e8734a;font-weight:700;font-size:11px">${DANABRI.facturacion}</div>
    </td>
  </tr></table>`;
}

function totalesBox(subtotal, iva, total, ahorro) {
  return `<table style="width:240px;margin-left:auto;margin-top:8px">
    <tr><td style="border:none;padding:3px 8px" class="muted">Subtotal</td><td style="border:none;padding:3px 8px" class="right">$${Number(subtotal).toFixed(2)}</td></tr>
    <tr><td style="border:none;padding:3px 8px" class="muted">IVA (16%)</td><td style="border:none;padding:3px 8px" class="right">$${Number(iva).toFixed(2)}</td></tr>
    ${ahorro > 0.01 ? `<tr><td style="border:none;padding:3px 8px;color:#16a34a;font-weight:700">Ahorro mayoreo</td><td style="border:none;padding:3px 8px;text-align:right;color:#16a34a;font-weight:700">-$${Number(ahorro).toFixed(2)}</td></tr>` : ""}
    <tr style="border-top:2px solid #1e3a5f">
      <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800">TOTAL</td>
      <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800;text-align:right;color:#e8734a">$${Number(total).toFixed(2)}</td>
    </tr>
  </table>`;
}

function firmas(cols) {
  return `<div style="margin-top:20px;display:flex;gap:20px">
    ${cols.map(c => `<div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">${c}</div>`).join("")}
  </div>`;
}

// ── 1. FACTURA ────────────────────────────────────────────
export function generarFacturaPDF({ ventasData, cliente, rfc, nombreFiscal, usoCfdi, metodoPago, formaPago, notas, folio_factura }) {
  const fecha  = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const folio  = folio_factura || `FAC-${Date.now()}`;
  const subSinIva = ventasData.reduce((a, v) => a + parseFloat(v.total||0)/1.16, 0);
  const ivaTotal  = subSinIva * 0.16;
  const total     = subSinIva + ivaTotal;

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">FACTURA</div>
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:3px 8px;display:inline-block;margin-top:4px;font-size:9px;font-weight:700;color:#92400e">
          ⚠ PENDIENTE DE TIMBRADO — No tiene validez fiscal hasta ser timbrado por un PAC
        </div>
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folio}</div>
        <div class="muted">Fecha: ${fecha}</div>
        <div class="muted">Método pago SAT: ${metodoPago}</div>
        <div class="muted">Forma de pago: ${formaPago}</div>
      </td>
    </tr></table>

    <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;margin:8px 0">
      <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:4px">Receptor</div>
      <table><tr>
        <td style="border:none;padding:2px 0;width:50%"><span class="muted">Razón social:</span><br><span class="bold">${nombreFiscal||cliente||"Público General"}</span></td>
        <td style="border:none;padding:2px 0"><span class="muted">RFC:</span><br><span class="bold">${rfc||"XAXX010101000"}</span></td>
      </tr><tr>
        <td style="border:none;padding:2px 0"><span class="muted">Uso CFDI:</span><br><span class="bold">${usoCfdi}</span></td>
        <td style="border:none;padding:2px 0"><span class="muted">Régimen fiscal:</span><br><span class="bold">616 – Sin obligaciones fiscales</span></td>
      </tr></table>
    </div>

    <table style="margin:8px 0">
      <thead><tr>
        <th>Folio ticket</th><th>Descripción</th>
        <th class="right">Importe s/IVA</th><th class="right">IVA 16%</th><th class="right">Total</th>
      </tr></thead>
      <tbody>${ventasData.map(v => {
        const s = parseFloat(v.total||0)/1.16, i = s*0.16;
        return `<tr>
          <td class="bold">${v.folio}</td>
          <td>${v.cliente||"Venta mostrador"} · ${v.metodo_pago}</td>
          <td class="right">$${s.toFixed(2)}</td>
          <td class="right">$${i.toFixed(2)}</td>
          <td class="right bold">$${parseFloat(v.total).toFixed(2)}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>

    <table style="width:240px;margin-left:auto;margin-top:8px">
      <tr><td style="border:none;padding:3px 8px" class="muted">Subtotal s/IVA</td><td style="border:none;padding:3px 8px" class="right">$${subSinIva.toFixed(2)}</td></tr>
      <tr><td style="border:none;padding:3px 8px" class="muted">IVA (16%)</td><td style="border:none;padding:3px 8px" class="right">$${ivaTotal.toFixed(2)}</td></tr>
      <tr style="border-top:2px solid #1e3a5f">
        <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800">TOTAL</td>
        <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800;text-align:right;color:#e8734a">$${total.toFixed(2)}</td>
      </tr>
    </table>

    ${notas ? `<div style="margin-top:10px;padding:6px 10px;background:#f9fafb;border-left:3px solid #e8734a;font-size:10px;color:#374151"><span class="muted">Notas: </span>${notas}</div>` : ""}

    <div style="margin-top:16px;border:2px dashed #d1d5db;border-radius:6px;padding:12px;text-align:center">
      <div style="font-size:11px;font-weight:700;color:#9ca3af">SELLO DIGITAL DEL EMISOR</div>
      <div style="font-size:9px;color:#d1d5db;margin:4px 0">Pendiente de timbrado por PAC autorizado SAT</div>
      <div style="font-size:11px;font-weight:700;color:#9ca3af;margin-top:8px">UUID: —</div>
    </div>
    <div style="margin-top:12px;text-align:center;font-size:10px;color:#9ca3af">
      Para factura timbrada: <strong style="color:#e8734a">${DANABRI.facturacion}</strong>
    </div>
  </div>`;
  abrir(html, `Factura ${folio}`);
}

// ── 2. COTIZACIÓN ─────────────────────────────────────────
export function generarCotizacionPDF({ items, cliente, vendedor, folio, subtotal, iva, total, ahorro = 0 }) {
  const fecha   = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const vigDate = new Date(Date.now() + 5*86400000).toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const folioStr = folio || `COT-${Date.now()}`;

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">COTIZACIÓN</div>
        <div class="muted" style="margin-top:3px">Vigente hasta: <strong>${vigDate}</strong></div>
        ${cliente ? `<div style="margin-top:6px"><span class="muted">Cliente: </span><span class="bold">${cliente.nombre||cliente}</span></div>` : ""}
        ${cliente?.rfc ? `<div class="muted">RFC: ${cliente.rfc}</div>` : ""}
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folioStr}</div>
        <div class="muted">Fecha: ${fecha}</div>
        ${vendedor ? `<div class="muted">Vendedor: ${vendedor}</div>` : ""}
      </td>
    </tr></table>

    <table style="margin:8px 0">
      <thead><tr>
        <th style="width:42%">Descripción</th>
        <th class="right">P. Unit.</th><th class="center">Cant.</th>
        <th class="right">Importe</th><th class="right">Precio</th>
      </tr></thead>
      <tbody>${items.map(item => {
        const p = item.precio_unitario ?? item.precio_menudeo ?? item.precio ?? 0;
        const imp = p * item.cantidad;
        const esMay = p < (item.precio_menudeo ?? p);
        return `<tr>
          <td>${item.nombre}</td>
          <td class="right">$${Number(p).toFixed(2)}</td>
          <td class="center">${item.cantidad}</td>
          <td class="right bold">$${imp.toFixed(2)}</td>
          <td class="right"><span style="font-size:9px;padding:1px 5px;border-radius:8px;background:${esMay?"#f0fdf4":"#eff6ff"};color:${esMay?"#16a34a":"#2563eb"};font-weight:700">${esMay?"Mayoreo":"Menudeo"}</span></td>
        </tr>`;
      }).join("")}</tbody>
    </table>

    ${totalesBox(subtotal, iva, total, ahorro)}
    ${firmas(["Elaboró", "Autorizó", "Acepta cliente"])}
    <div style="margin-top:12px;text-align:center;font-size:10px;color:#9ca3af">
      Vigencia 5 días · ${DANABRI.tel} · ${DANABRI.email}
    </div>
  </div>`;
  abrir(html, `Cotización ${folioStr}`);
}

// ── 3. REMISIÓN ───────────────────────────────────────────
export function generarRemisionPDF({ items, cliente, vendedor, folio, subtotal, iva, total, pagos = [], cambio = 0, ahorro = 0 }) {
  const fecha    = new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const folioStr = folio || `REM-${Date.now()}`;
  const totalPzs = items.reduce((a,i) => a+i.cantidad, 0);
  const METODOS  = { efectivo:"💵 Efectivo", tarjeta:"💳 Tarjeta", transferencia:"📱 Transferencia", cheque:"📝 Cheque", vale:"🎫 Vale" };

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">REMISIÓN</div>
        ${cliente ? `<div style="margin-top:5px"><span class="muted">Cliente: </span><span class="bold">${cliente.nombre||cliente}</span></div>` : ""}
        ${cliente?.rfc ? `<div class="muted">RFC: ${cliente.rfc}</div>` : ""}
        ${cliente?.telefono ? `<div class="muted">Tel: ${cliente.telefono}</div>` : ""}
        ${cliente?.condiciones_pago ? `<div class="muted">Condiciones: ${cliente.condiciones_pago}</div>` : ""}
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folioStr}</div>
        <div class="muted">Fecha: ${fecha}</div>
        ${vendedor ? `<div class="muted">Vendedor: ${vendedor}</div>` : ""}
        <div class="muted">Total piezas: <strong>${totalPzs}</strong></div>
      </td>
    </tr></table>

    <table style="margin:8px 0">
      <thead><tr>
        <th style="width:48%">Descripción</th>
        <th class="right">P. Unit.</th><th class="center">Cant.</th><th class="right">Importe</th>
      </tr></thead>
      <tbody>${items.map(item => {
        const p = item.precio_unitario ?? item.precio_menudeo ?? item.precio ?? 0;
        return `<tr>
          <td>${item.nombre}</td>
          <td class="right">$${Number(p).toFixed(2)}</td>
          <td class="center">${item.cantidad}</td>
          <td class="right bold">$${(p*item.cantidad).toFixed(2)}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>

    ${totalesBox(subtotal, iva, total, ahorro)}

    ${pagos.length > 0 ? `
    <div style="margin-top:8px;padding:7px 10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px">
      <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:3px">Forma de pago</div>
      ${pagos.map(p=>`<div style="display:flex;justify-content:space-between;font-size:11px"><span>${METODOS[p.metodo_pago]||p.metodo_pago}</span><span>$${parseFloat(p.monto).toFixed(2)}</span></div>`).join("")}
      ${cambio > 0 ? `<div style="display:flex;justify-content:space-between;font-size:11px;color:#16a34a;font-weight:700"><span>Cambio</span><span>$${Number(cambio).toFixed(2)}</span></div>` : ""}
    </div>` : ""}

    <div style="margin-top:12px;border:1px solid #e5e7eb;border-radius:6px;padding:8px 12px;font-size:10px;color:#6b7280;line-height:1.7">
      <span class="bold" style="color:#374151">PAGARÉ: </span>
      Debo(emos) y pagaré(mos) incondicionalmente a la orden de <strong>PAPELERÍA DANABRI</strong>
      la cantidad de <strong>$${Number(total).toFixed(2)}</strong> por los bienes de la remisión
      <strong>${folioStr}</strong> con fecha <strong>${fecha}</strong>.
    </div>

    ${firmas(["Elaboró", "Revisó", "Recibió conforme"])}
    <div style="margin-top:12px;text-align:center;font-size:10px;color:#9ca3af">
      Facturación en línea: <strong style="color:#e8734a">${DANABRI.facturacion}</strong> · ${DANABRI.tel}
    </div>
  </div>`;
  abrir(html, `Remisión ${folioStr}`);
}

// ── 4. PRE-CORTE / CORTE FINAL ────────────────────────────
export function generarCortePDF({ tipo, datos, folio, denominaciones }) {
  const fecha = new Date().toLocaleString("es-MX", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
  const esFinal  = tipo === "corte_final";
  const folioStr = folio || (esFinal ? `C-${Date.now()}` : null);

  const METODOS = [
    { key: "ventas_efectivo",      label: "💵 Efectivo" },
    { key: "ventas_tarjeta",       label: "💳 Tarjeta" },
    { key: "ventas_transferencia", label: "📱 Transferencia" },
    { key: "ventas_cheque",        label: "📝 Cheque" },
    { key: "ventas_vale",          label: "🎫 Vale" },
  ];

  const totalVentas = METODOS.reduce((a, m) => a + parseFloat(datos[m.key] || 0), 0);
  const montoEsperado = parseFloat(datos.monto_en_caja || 0);

  let totalContado = 0;
  let denomHtml = "";
  if (esFinal && denominaciones) {
    const DENOMS = [1000,500,200,100,50,20,10,5,2,1];
    totalContado = DENOMS.reduce((a, d) => a + d * (parseInt(denominaciones[d])||0), 0);
    const diferencia = totalContado - montoEsperado;
    denomHtml = `
      <div style="margin-top:12px">
        <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px">Conteo de efectivo</div>
        <table style="width:100%">
          <thead><tr>
            <th>Denominación</th><th class="right">Piezas</th><th class="right">Subtotal</th>
          </tr></thead>
          <tbody>
            ${DENOMS.map(d => {
              const pzas = parseInt(denominaciones[d])||0;
              return pzas > 0
                ? `<tr><td>$${d}</td><td class="right">${pzas}</td><td class="right">$${(d*pzas).toFixed(2)}</td></tr>`
                : "";
            }).join("")}
          </tbody>
        </table>
        <table style="width:220px;margin-left:auto;margin-top:8px">
          <tr><td style="border:none;padding:3px 8px" class="muted">Total contado</td><td style="border:none;padding:3px 8px" class="right bold">$${totalContado.toFixed(2)}</td></tr>
          <tr><td style="border:none;padding:3px 8px" class="muted">Esperado</td><td style="border:none;padding:3px 8px" class="right">$${montoEsperado.toFixed(2)}</td></tr>
          <tr style="border-top:2px solid ${diferencia===0?"#16a34a":diferencia>0?"#2563eb":"#dc2626"}">
            <td style="border:none;padding:5px 8px;font-weight:800;color:${diferencia===0?"#16a34a":diferencia>0?"#2563eb":"#dc2626"}">
              ${diferencia===0?"✓ Cuadrado":diferencia>0?"Sobrante":"Faltante"}
            </td>
            <td style="border:none;padding:5px 8px;font-weight:800;text-align:right;color:${diferencia===0?"#16a34a":diferencia>0?"#2563eb":"#dc2626"}">
              ${diferencia!==0?`${diferencia>0?"+":""}$${diferencia.toFixed(2)}`:""}
            </td>
          </tr>
        </table>
      </div>`;
  }

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">
          ${esFinal ? "CORTE FINAL DE CAJA" : "PRE-CORTE DE CAJA"}
        </div>
        ${!esFinal ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:3px 8px;display:inline-block;margin-top:4px;font-size:9px;font-weight:700;color:#92400e">
          El pre-corte no tiene folio y no afecta el corte final
        </div>` : ""}
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        ${folioStr ? `<div style="font-size:13px;font-weight:800;color:#e8734a">${folioStr}</div>` : ""}
        <div class="muted">Fecha: ${fecha}</div>
        <div class="muted">Caja 1</div>
      </td>
    </tr></table>

    <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin-bottom:6px">Ventas por método de pago</div>
    <table style="margin-bottom:8px">
      <thead><tr><th>Método</th><th class="right">Importe</th></tr></thead>
      <tbody>
        ${METODOS.map(m => `
          <tr>
            <td>${m.label}</td>
            <td class="right">$${parseFloat(datos[m.key]||0).toFixed(2)}</td>
          </tr>`).join("")}
      </tbody>
    </table>

    <table style="width:220px;margin-left:auto;margin-top:4px">
      <tr style="border-top:2px solid #1e3a5f">
        <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800">Total ventas</td>
        <td style="border:none;padding:6px 8px;font-size:13px;font-weight:800;text-align:right;color:#e8734a">$${totalVentas.toFixed(2)}</td>
      </tr>
    </table>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div class="muted">Órdenes atendidas</div>
        <div style="font-size:18px;font-weight:800">${datos.total_clientes||0}</div>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div class="muted">Devoluciones</div>
        <div style="font-size:18px;font-weight:800;color:#dc2626">-$${parseFloat(datos.total_devoluciones||0).toFixed(2)}</div>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div class="muted">Retiros</div>
        <div style="font-size:18px;font-weight:800;color:#dc2626">-$${parseFloat(datos.total_retiros||0).toFixed(2)}</div>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px">
        <div class="muted">💰 Efectivo en caja</div>
        <div style="font-size:18px;font-weight:800;color:#16a34a">$${montoEsperado.toFixed(2)}</div>
      </div>
    </div>

    ${denomHtml}

    <div style="margin-top:20px;display:flex;gap:20px">
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Cajero</div>
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Supervisor</div>
    </div>
  </div>`;

  abrir(html, esFinal ? `Corte Final ${folioStr}` : "Pre-corte de Caja");
}

// ── 5. SALIDA DE EFECTIVO ─────────────────────────────────
export function generarSalidaPDF({ folio, concepto, monto, cajero = "Caja 1" }) {
  const fecha = new Date().toLocaleString("es-MX", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
  const folioStr = folio || `SE-${Date.now()}`;

  // Generar dos copias (original y copia)
  const copia = (titulo) => `
    <div class="page" style="min-height:auto;padding:10mm 14mm;border-bottom:2px dashed #d1d5db">
      ${header()}
      <hr class="thick">
      <table style="margin:10px 0"><tr>
        <td style="border:none;padding:0">
          <div style="font-size:17px;font-weight:800;color:#1e3a5f">SALIDA DE EFECTIVO</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">${titulo}</div>
        </td>
        <td style="border:none;padding:0;text-align:right;vertical-align:top">
          <div style="font-size:13px;font-weight:800;color:#e8734a">${folioStr}</div>
          <div class="muted">${fecha}</div>
          <div class="muted">${cajero}</div>
        </td>
      </tr></table>

      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:14px;margin:12px 0;text-align:center">
        <div class="muted">Concepto</div>
        <div style="font-size:14px;font-weight:700;color:#1a1a1a;margin:4px 0">${concepto}</div>
        <div style="font-size:24px;font-weight:900;color:#dc2626">-$${Number(monto).toFixed(2)}</div>
      </div>

      <div style="display:flex;gap:20px;margin-top:16px">
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Entregó</div>
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Autorizó</div>
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Recibió</div>
      </div>
    </div>`;

  const html = copia("ORIGINAL") + copia("COPIA");
  abrir(html, `Salida de Efectivo ${folioStr}`);
}

// ── 6. APERTURA DE CAJA ───────────────────────────────────
export function generarAperturaPDF({ folio, fondo, cajero, caja }) {
  const fecha = new Date().toLocaleString("es-MX", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
  const html = `<div class="page" style="min-height:auto;padding:12mm 14mm">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">APERTURA DE CAJA</div>
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folio||`APE-${Date.now()}`}</div>
        <div class="muted">${fecha}</div>
        <div class="muted">${caja||"Caja 1"} · ${cajero||"—"}</div>
      </td>
    </tr></table>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center;margin:12px 0">
      <div class="muted">Fondo inicial registrado</div>
      <div style="font-size:28px;font-weight:900;color:#16a34a">$${Number(fondo).toFixed(2)}</div>
    </div>
    <div style="display:flex;gap:20px;margin-top:20px">
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Cajero</div>
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Supervisor</div>
    </div>
  </div>`;
  abrir(html, "Apertura de Caja");
}

// ── 7. RETIRO DE EFECTIVO ─────────────────────────────────
export function generarRetiroPDF({ folio, monto, concepto, denominaciones, cajero, caja }) {
  const fecha = new Date().toLocaleString("es-MX", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
  const DENOMS = [1000,500,200,100,50,20,10,5,2,1];

  const copias = (titulo) => `
    <div class="page" style="min-height:auto;padding:10mm 14mm;border-bottom:2px dashed #d1d5db">
      ${header()}
      <hr class="thick">
      <table style="margin:8px 0"><tr>
        <td style="border:none;padding:0">
          <div style="font-size:17px;font-weight:800;color:#1e3a5f">RETIRO DE EFECTIVO</div>
          <div style="font-size:10px;color:#6b7280">${titulo}</div>
        </td>
        <td style="border:none;padding:0;text-align:right;vertical-align:top">
          <div style="font-size:13px;font-weight:800;color:#e8734a">${folio||`RET-${Date.now()}`}</div>
          <div class="muted">${fecha}</div>
          <div class="muted">${caja||"Caja 1"} · ${cajero||"—"}</div>
        </td>
      </tr></table>
      ${concepto ? `<div style="padding:8px 12px;background:#f9fafb;border-left:3px solid #e8734a;font-size:12px;margin-bottom:8px">${concepto}</div>` : ""}
      ${denominaciones ? `
      <table style="margin-bottom:8px">
        <thead><tr><th>Denominación</th><th class="right">Piezas</th><th class="right">Subtotal</th></tr></thead>
        <tbody>${DENOMS.map(d => {
          const pzas = parseInt(denominaciones[d])||0;
          return pzas > 0 ? `<tr><td>$${d}</td><td class="right">${pzas}</td><td class="right">$${(d*pzas).toFixed(0)}</td></tr>` : "";
        }).join("")}</tbody>
      </table>` : ""}
      <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:12px;text-align:center">
        <div class="muted">Total retirado</div>
        <div style="font-size:24px;font-weight:900;color:#dc2626">-$${Number(monto).toFixed(2)}</div>
      </div>
      <div style="display:flex;gap:20px;margin-top:16px">
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Entregó</div>
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Autorizó</div>
        <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Recibió</div>
      </div>
    </div>`;

  abrir(copias("ORIGINAL") + copias("COPIA"), "Retiro de Efectivo");
}

// ── 8. CAMBIO DE TURNO ────────────────────────────────────
export function generarCambioTurnoPDF({ folio, cajeroSaliente, cajeroEntrante, caja, montoEsperado, totalContado, excedente, denominaciones }) {
  const fecha = new Date().toLocaleString("es-MX", {
    day:"2-digit", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit"
  });
  const DENOMS = [1000,500,200,100,50,20,10,5,2,1];
  const dif = excedente || (totalContado - montoEsperado);

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">CAMBIO DE TURNO / ENTREGA DE CAJA</div>
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folio||`TUR-${Date.now()}`}</div>
        <div class="muted">${fecha}</div>
        <div class="muted">${caja||"Caja 1"}</div>
      </td>
    </tr></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;font-weight:700">Cajero saliente</div>
        <div style="font-size:14px;font-weight:800;color:#1e3a5f">${cajeroSaliente||"—"}</div>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px">
        <div style="font-size:9px;color:#6b7280;text-transform:uppercase;font-weight:700">Cajero entrante</div>
        <div style="font-size:14px;font-weight:800;color:#1e3a5f">${cajeroEntrante||"—"}</div>
      </div>
    </div>
    ${denominaciones ? `
    <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;margin:8px 0 4px">Conteo de efectivo</div>
    <table>
      <thead><tr><th>Denominación</th><th class="right">Piezas</th><th class="right">Subtotal</th></tr></thead>
      <tbody>${DENOMS.map(d => {
        const pzas = parseInt(denominaciones[d])||0;
        return pzas > 0 ? `<tr><td>$${d}</td><td class="right">${pzas}</td><td class="right">$${(d*pzas).toFixed(0)}</td></tr>` : "";
      }).join("")}</tbody>
    </table>` : ""}
    <table style="width:260px;margin-left:auto;margin-top:8px">
      <tr><td style="border:none;padding:3px 8px" class="muted">Total contado</td><td style="border:none;padding:3px 8px" class="right bold">$${Number(totalContado||0).toFixed(2)}</td></tr>
      <tr><td style="border:none;padding:3px 8px" class="muted">Monto esperado</td><td style="border:none;padding:3px 8px" class="right">$${Number(montoEsperado||0).toFixed(2)}</td></tr>
      <tr style="border-top:2px solid ${dif===0?"#16a34a":dif>0?"#2563eb":"#dc2626"}">
        <td style="border:none;padding:5px 8px;font-weight:800;color:${dif===0?"#16a34a":dif>0?"#2563eb":"#dc2626"}">
          ${dif===0?"✓ Cuadrado":dif>0?"Excedente":"Faltante"}
        </td>
        <td style="border:none;padding:5px 8px;font-weight:800;text-align:right;color:${dif===0?"#16a34a":dif>0?"#2563eb":"#dc2626"}">
          ${dif!==0?`${dif>0?"+":""}$${Math.abs(dif).toFixed(2)}`:""}
        </td>
      </tr>
    </table>
    <div style="font-size:10px;color:#9ca3af;text-align:center;margin-top:8px">Este documento no afecta el corte final de caja</div>
    <div style="display:flex;gap:20px;margin-top:20px">
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Cajero saliente</div>
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Cajero entrante</div>
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Supervisor</div>
    </div>
  </div>`;
  abrir(html, "Cambio de Turno");
}

// ── 9. HOJA DE RUTA ───────────────────────────────────────
export function generarRutaPDF({ folio, vendedor, ciudad, fecha, remisiones = [] }) {
  const fechaStr = fecha
    ? new Date(fecha).toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" })
    : new Date().toLocaleDateString("es-MX", { day:"2-digit", month:"long", year:"numeric" });
  const folioStr = folio || `RUT-${Date.now()}`;
  const totalImporte = remisiones.reduce((a, r) => a + parseFloat(r.total||0), 0);

  const html = `<div class="page">
    ${header()}
    <hr class="thick">
    <table style="margin:10px 0"><tr>
      <td style="border:none;padding:0">
        <div style="font-size:17px;font-weight:800;color:#1e3a5f">HOJA DE RUTA</div>
        <div class="muted" style="margin-top:3px">Vendedor: <strong>${vendedor||"—"}</strong></div>
        <div class="muted">Destino: <strong>${ciudad||"—"}</strong></div>
      </td>
      <td style="border:none;padding:0;text-align:right;vertical-align:top">
        <div style="font-size:13px;font-weight:800;color:#e8734a">${folioStr}</div>
        <div class="muted">Fecha: ${fechaStr}</div>
      </td>
    </tr></table>

    <table style="margin:10px 0">
      <thead><tr>
        <th style="width:18%">Folio remisión</th>
        <th>Cliente</th>
        <th class="right" style="width:14%">Importe</th>
        <th class="right" style="width:14%">Último saldo</th>
        <th class="right" style="width:16%">Monto pagado</th>
        <th class="right" style="width:14%">Restante</th>
      </tr></thead>
      <tbody>
        ${remisiones.map(r => `
          <tr>
            <td class="bold" style="color:#e8734a">${r.folio||"—"}</td>
            <td>${r.cliente||"—"}</td>
            <td class="right">$${parseFloat(r.total||0).toFixed(2)}</td>
            <td class="right">$${parseFloat(r.saldo||r.total||0).toFixed(2)}</td>
            <td class="right" style="border-bottom:1px solid #374151;min-width:80px"> </td>
            <td class="right" style="border-bottom:1px solid #374151;min-width:80px"> </td>
          </tr>`).join("")}
        ${remisiones.length === 0 ? `<tr><td colspan="6" style="text-align:center;color:#9ca3af;padding:20px">Sin remisiones asignadas</td></tr>` : ""}
      </tbody>
    </table>

    <table style="width:300px;margin-left:auto;margin-top:8px">
      <tr><td style="border:none;padding:3px 8px" class="muted">Total remisiones</td><td style="border:none;padding:3px 8px" class="right bold">${remisiones.length}</td></tr>
      <tr style="border-top:2px solid #1e3a5f">
        <td style="border:none;padding:5px 8px;font-size:13px;font-weight:800">Importe total</td>
        <td style="border:none;padding:5px 8px;font-size:13px;font-weight:800;text-align:right;color:#e8734a">$${totalImporte.toFixed(2)}</td>
      </tr>
    </table>

    <div style="display:flex;gap:20px;margin-top:24px">
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Elaboró</div>
      <div style="flex:1;border-top:1px solid #374151;padding-top:6px;text-align:center;font-size:10px;color:#6b7280">Autorizó</div>
    </div>
    <div style="margin-top:8px;font-size:10px;color:#9ca3af;text-align:center">
      Cada cliente debe firmar de recibido en la columna correspondiente
    </div>
  </div>`;
  abrir(html, `Hoja de Ruta ${folioStr}`);
}
