import { useState, useEffect } from "react";
import { generarFacturaPDF } from "../utils/generarPDF";
import { getVentasDia, getClientes, crearFactura } from "../api/api";
import styles from "./ModalFacturar.module.css";

const USOS_CFDI = [
  { clave: "G01", desc: "Adquisición de mercancias" },
  { clave: "G02", desc: "Devoluciones, descuentos o bonificaciones" },
  { clave: "G03", desc: "Gastos en general" },
  { clave: "I01", desc: "Construcciones" },
  { clave: "I02", desc: "Mobiliario y equipo de oficina" },
  { clave: "I03", desc: "Equipo de transporte" },
  { clave: "I04", desc: "Equipo de computo y accesorios" },
  { clave: "I08", desc: "Otra maquinaria y equipo" },
  { clave: "D01", desc: "Honorarios médicos, dentales y gastos hospitalarios" },
  { clave: "D10", desc: "Pagos por servicios educativos (colegiaturas)" },
  { clave: "S01", desc: "Sin efectos fiscales" },
  { clave: "CP01", desc: "Pagos" },
  { clave: "CN01", desc: "Nómina" },
];

const METODOS_PAGO_SAT = [
  { clave: "PUE", desc: "Pago en una sola exhibición" },
  { clave: "PPD", desc: "Pago en parcialidades o diferido" },
];

const FORMAS_PAGO_SAT = [
  { clave: "01", desc: "Efectivo" },
  { clave: "02", desc: "Cheque nominativo" },
  { clave: "03", desc: "Transferencia electrónica" },
  { clave: "04", desc: "Tarjeta de crédito" },
  { clave: "28", desc: "Tarjeta de débito" },
  { clave: "99", desc: "Por definir" },
];

export default function ModalFacturar({ onCerrar }) {
  const [fase,        setFase]        = useState("folios"); // folios | cliente | cfdi | confirmar | listo
  const [ventas,      setVentas]      = useState([]);
  const [clientes,    setClientes]    = useState([]);
  const [cargando,    setCargando]    = useState(true);
  const [guardando,   setGuardando]   = useState(false);
  const [resultado,   setResultado]   = useState(null);

  // Selección de folios
  const [foliosSelec, setFoliosSelec] = useState(new Set());

  // Datos del cliente
  const [modoCliente,   setModoCliente]   = useState("existente"); // existente | nuevo
  const [clienteId,     setClienteId]     = useState(null);
  const [busqCliente,   setBusqCliente]   = useState("");
  const [rfc,           setRfc]           = useState("");
  const [nombreFiscal,  setNombreFiscal]  = useState("");

  // CFDI
  const [usoCfdi,      setUsoCfdi]      = useState("G03");
  const [metodoPago,   setMetodoPago]   = useState("PUE");
  const [formaPago,    setFormaPago]    = useState("01");
  const [notas,        setNotas]        = useState("");

  useEffect(() => {
    Promise.all([getVentasDia(), getClientes()])
      .then(([v, c]) => { setVentas(v); setClientes(c); })
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  const toggleFolio = (folio) => {
    setFoliosSelec((prev) => {
      const next = new Set(prev);
      next.has(folio) ? next.delete(folio) : next.add(folio);
      return next;
    });
  };

  const ventasSeleccionadas = ventas.filter((v) => foliosSelec.has(v.folio));
  const totalFacturar = ventasSeleccionadas.reduce((a, v) => a + parseFloat(v.total || 0), 0);

  const clienteSeleccionado = clientes.find((c) => c.id_cliente === clienteId);
  const clientesFiltrados   = clientes.filter((c) =>
    c.nombre.toLowerCase().includes(busqCliente.toLowerCase()) ||
    (c.rfc || "").toLowerCase().includes(busqCliente.toLowerCase())
  );

  // Al seleccionar cliente existente, autorellenar RFC y nombre
  const seleccionarCliente = (c) => {
    setClienteId(c.id_cliente);
    setRfc(c.rfc || "");
    setNombreFiscal(c.nombre_fiscal || c.nombre || "");
    setUsoCfdi(c.uso_cfdi || "G03");
    setBusqCliente("");
  };

  const confirmar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      const res = await crearFactura({
        folios:          [...foliosSelec],
        id_cliente:      clienteId,
        rfc,
        nombre_fiscal:   nombreFiscal,
        uso_cfdi:        usoCfdi,
        metodo_pago_sat: metodoPago,
        forma_pago_sat:  formaPago,
        notas,
      });
      generarFacturaPDF({
        ventasData:   ventasSeleccionadas,
        cliente:      clienteSeleccionado?.nombre || "Público General",
        rfc, nombreFiscal, usoCfdi,
        metodoPago, formaPago, notas,
        folio_factura: res.folio_factura,
      });
      setResultado(res);
      setFase("listo");
    } catch (e) {
      // fallback: generar pre-factura PDF aunque el backend no responda
      const folioLocal = `FAC-${Date.now()}`;
      generarFacturaPDF({
        ventasData:   ventasSeleccionadas,
        cliente:      clienteSeleccionado?.nombre || "Público General",
        rfc, nombreFiscal, usoCfdi,
        metodoPago, formaPago, notas,
        folio_factura: folioLocal,
      });
      setResultado({ folio_factura: folioLocal, total: totalFacturar });
      setFase("listo");
    } finally {
      setGuardando(false);
    }
  };

  // ── Pasos del wizard ──────────────────────────────────────
  const PASOS = ["folios", "cliente", "cfdi", "confirmar"];
  const pasoActual = PASOS.indexOf(fase);

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

        <div className={styles.header}>
          <span className={styles.titulo}>📋 Facturar ticket(s)</span>
          <button className={styles.cerrarBtn} onClick={onCerrar}>✕</button>
        </div>

        {/* Indicador de pasos */}
        {fase !== "listo" && (
          <div className={styles.pasos}>
            {["Tickets", "Cliente", "CFDI", "Confirmar"].map((p, i) => (
              <div key={i} className={`${styles.paso} ${i === pasoActual ? styles.pasoActivo : ""} ${i < pasoActual ? styles.pasoDone : ""}`}>
                <div className={styles.pasoNum}>{i < pasoActual ? "✓" : i + 1}</div>
                <span className={styles.pasoLabel}>{p}</span>
              </div>
            ))}
          </div>
        )}

        <div className={styles.body}>

          {/* ── PASO 1: Seleccionar folios ── */}
          {fase === "folios" && (
            <>
              <div className={styles.seccionLabel}>Selecciona los tickets a facturar</div>
              {cargando ? (
                <div className={styles.empty}>Cargando ventas del día...</div>
              ) : ventas.length === 0 ? (
                <div className={styles.empty}>
                  <span>🧾</span><span>Sin ventas hoy</span>
                </div>
              ) : (
                <div className={styles.foliosList}>
                  {ventas.map((v) => {
                    const selec = foliosSelec.has(v.folio);
                    return (
                      <div
                        key={v.folio}
                        className={`${styles.folioCard} ${selec ? styles.folioCardActivo : ""}`}
                        onClick={() => toggleFolio(v.folio)}
                      >
                        <div className={styles.folioCheck}>{selec ? "✓" : ""}</div>
                        <div className={styles.folioInfo}>
                          <span className={styles.folioNum}>{v.folio}</span>
                          <span className={styles.folioMeta}>
                            {v.cliente || "Público General"} · {v.metodo_pago}
                          </span>
                        </div>
                        <span className={styles.folioTotal}>${parseFloat(v.total).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {foliosSelec.size > 0 && (
                <div className={styles.resumenFolios}>
                  <span>{foliosSelec.size} ticket(s) seleccionado(s)</span>
                  <span className={styles.resumenTotal}>${totalFacturar.toFixed(2)}</span>
                </div>
              )}
            </>
          )}

          {/* ── PASO 2: Datos del cliente ── */}
          {fase === "cliente" && (
            <>
              <div className={styles.modoBtns}>
                <button
                  className={`${styles.modoBtn} ${modoCliente === "existente" ? styles.modoBtnActivo : ""}`}
                  onClick={() => setModoCliente("existente")}
                >Cliente registrado</button>
                <button
                  className={`${styles.modoBtn} ${modoCliente === "nuevo" ? styles.modoBtnActivo : ""}`}
                  onClick={() => setModoCliente("nuevo")}
                >Datos manuales</button>
              </div>

              {modoCliente === "existente" ? (
                <>
                  <input
                    className={styles.inputField}
                    type="text"
                    placeholder="Buscar por nombre o RFC..."
                    value={busqCliente}
                    onChange={(e) => setBusqCliente(e.target.value)}
                    autoFocus
                  />
                  <div className={styles.clienteLista}>
                    {clientesFiltrados.map((c) => (
                      <div
                        key={c.id_cliente}
                        className={`${styles.clienteRow} ${clienteId === c.id_cliente ? styles.clienteRowActivo : ""}`}
                        onClick={() => seleccionarCliente(c)}
                      >
                        <div className={styles.clienteAvatar}>{c.nombre.charAt(0)}</div>
                        <div className={styles.clienteInfo}>
                          <span className={styles.clienteNombre}>{c.nombre}</span>
                          <span className={styles.clienteRfc}>{c.rfc || "Sin RFC"}</span>
                        </div>
                        {clienteId === c.id_cliente && <span className={styles.clienteCheck}>✓</span>}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className={styles.camposGrid}>
                  <div className={styles.campo}>
                    <label className={styles.campoLabel}>RFC *</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder="XAXX010101000"
                      value={rfc}
                      onChange={(e) => setRfc(e.target.value.toUpperCase())}
                      maxLength={13}
                    />
                  </div>
                  <div className={styles.campo}>
                    <label className={styles.campoLabel}>Razón social / Nombre fiscal *</label>
                    <input
                      className={styles.inputField}
                      type="text"
                      placeholder="Nombre como aparece en el SAT"
                      value={nombreFiscal}
                      onChange={(e) => setNombreFiscal(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Vista previa datos que se usarán */}
              {(rfc || nombreFiscal) && (
                <div className={styles.previewCliente}>
                  <div className={styles.previewRow}><span>RFC</span><strong>{rfc || "—"}</strong></div>
                  <div className={styles.previewRow}><span>Nombre fiscal</span><strong>{nombreFiscal || "—"}</strong></div>
                </div>
              )}
            </>
          )}

          {/* ── PASO 3: Datos CFDI ── */}
          {fase === "cfdi" && (
            <div className={styles.camposGrid}>
              <div className={styles.campo}>
                <label className={styles.campoLabel}>Uso de CFDI *</label>
                <select className={styles.selectField} value={usoCfdi} onChange={(e) => setUsoCfdi(e.target.value)}>
                  {USOS_CFDI.map((u) => (
                    <option key={u.clave} value={u.clave}>{u.clave} – {u.desc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label className={styles.campoLabel}>Método de pago *</label>
                <select className={styles.selectField} value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  {METODOS_PAGO_SAT.map((m) => (
                    <option key={m.clave} value={m.clave}>{m.clave} – {m.desc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label className={styles.campoLabel}>Forma de pago *</label>
                <select className={styles.selectField} value={formaPago} onChange={(e) => setFormaPago(e.target.value)}>
                  {FORMAS_PAGO_SAT.map((f) => (
                    <option key={f.clave} value={f.clave}>{f.clave} – {f.desc}</option>
                  ))}
                </select>
              </div>

              <div className={styles.campo}>
                <label className={styles.campoLabel}>Notas / observaciones</label>
                <textarea
                  className={styles.textareaField}
                  placeholder="Opcional..."
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* ── PASO 4: Confirmar ── */}
          {fase === "confirmar" && (
            <div className={styles.confirmarWrap}>
              <div className={styles.confirmarSection}>
                <div className={styles.confirmarLabel}>Tickets a facturar</div>
                {ventasSeleccionadas.map((v) => (
                  <div key={v.folio} className={styles.confirmarRow}>
                    <span>{v.folio}</span>
                    <span>${parseFloat(v.total).toFixed(2)}</span>
                  </div>
                ))}
                <div className={`${styles.confirmarRow} ${styles.confirmarTotal}`}>
                  <span>Total</span><span>${totalFacturar.toFixed(2)}</span>
                </div>
              </div>

              <div className={styles.confirmarSection}>
                <div className={styles.confirmarLabel}>Datos fiscales</div>
                <div className={styles.confirmarRow}><span>RFC</span><strong>{rfc || "XAXX010101000"}</strong></div>
                <div className={styles.confirmarRow}><span>Nombre</span><strong>{nombreFiscal || clienteSeleccionado?.nombre || "Público General"}</strong></div>
                <div className={styles.confirmarRow}><span>Uso CFDI</span><strong>{usoCfdi} – {USOS_CFDI.find(u => u.clave === usoCfdi)?.desc}</strong></div>
                <div className={styles.confirmarRow}><span>Método pago</span><strong>{metodoPago}</strong></div>
                <div className={styles.confirmarRow}><span>Forma pago</span><strong>{formaPago} – {FORMAS_PAGO_SAT.find(f => f.clave === formaPago)?.desc}</strong></div>
              </div>

              {notas && (
                <div className={styles.confirmarSection}>
                  <div className={styles.confirmarLabel}>Notas</div>
                  <div className={styles.confirmarNota}>{notas}</div>
                </div>
              )}
            </div>
          )}

          {/* ── LISTO ── */}
          {fase === "listo" && resultado && (
            <div className={styles.listoWrap}>
              <div className={styles.listoCheck}>✓</div>
              <div className={styles.listoTitulo}>Factura generada</div>
              <div className={styles.listoFolio}>{resultado.folio_factura}</div>
              {resultado.uuid && resultado.uuid !== "PENDIENTE-TIMBRADO" && (
                <div className={styles.listoUuid}>UUID: {resultado.uuid}</div>
              )}
              <div className={styles.listoTotal}>${Number(resultado.total || totalFacturar).toFixed(2)}</div>
              <div className={styles.listoBtns}>
                <button className={styles.btnSecundario} onClick={() => window.print()}>🖨️ Imprimir</button>
                <button className={styles.btnPrimario} onClick={onCerrar}>Cerrar</button>
              </div>
            </div>
          )}

        </div>

        {/* ── Navegación entre pasos ── */}
        {fase !== "listo" && (
          <div className={styles.navBtns}>
            {pasoActual > 0 ? (
              <button className={styles.btnVolver} onClick={() => setFase(PASOS[pasoActual - 1])}>
                ← Volver
              </button>
            ) : (
              <div />
            )}

            {fase === "confirmar" ? (
              <button className={styles.btnPrimario} onClick={confirmar} disabled={guardando}>
                {guardando ? "Generando..." : "✓ Generar factura"}
              </button>
            ) : (
              <button
                className={styles.btnPrimario}
                disabled={
                  (fase === "folios"   && foliosSelec.size === 0) ||
                  (fase === "cliente"  && modoCliente === "nuevo" && (!rfc || !nombreFiscal))
                }
                onClick={() => setFase(PASOS[pasoActual + 1])}
              >
                Siguiente →
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
