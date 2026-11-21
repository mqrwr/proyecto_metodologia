// ARGOS · dashboard del refugio
const API = '../api.php';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const img = (p) => (p ? (/^https?:/.test(p) ? p : '../' + p) : '');

async function api(action, body, query = '') {
  const opt = body === undefined ? {} : {
    method: 'POST',
    body: body instanceof FormData ? body : JSON.stringify(body),
    headers: { 'X-Argos': '1', ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }) },
  };
  const res = await fetch(`${API}?action=${action}${query}`, { credentials: 'same-origin', ...opt });
  const data = await res.json().catch(() => ({ error: 'El servidor no respondió. ¿Está subido api.php?' }));
  if (res.status === 401 && action !== 'login') { pantallaLogin(); throw new Error(data.error); }
  if (!res.ok || data.error) throw Object.assign(new Error(data.error || 'Error'), { campos: data.campos || {} });
  return data;
}

const ESTADO_MASCOTA = { disponible: ['ok', 'Disponible'], en_proceso: ['warn', 'Con solicitudes'], adoptado: ['info', 'Adoptado'] };
const ESTADO_SOL = { pendiente: ['warn', 'Pendiente'], en_revision: ['info', 'En revisión'], aprobada: ['ok', 'Aprobada'], rechazada: ['bad', 'Rechazada'] };
const SALUD = { bien: ['ok', 'Bien'], regular: ['warn', 'Regular'], atencion: ['bad', 'Necesita atención'] };
const pill = ([t, x]) => `<span class="pill pill--${t}">${x}</span>`;
const fecha = (s) => (s ? new Date(s.replace(' ', 'T')).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
const edad = (m) => (m < 12 ? `${m} m` : `${Math.floor(m / 12)} a`);
const dias = (s) => Math.floor((Date.now() - new Date(s.replace(' ', 'T'))) / 864e5);

function toast(t) {
  const el = $('#toast');
  el.textContent = t;
  el.classList.add('is-on');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('is-on'), 2600);
}

const drawer = $('#drawer');
$('[data-close]', drawer).addEventListener('click', () => drawer.close());
drawer.addEventListener('click', (e) => { if (e.target === drawer) drawer.close(); });
function abrir(html) { $('#drawer-body').innerHTML = html; drawer.showModal(); }

function errores(form, campos) {
  $$('.field', form).forEach((f) => f.classList.remove('has-err'));
  $$('.field__err', form).forEach((e) => (e.textContent = ''));
  for (const [k, msg] of Object.entries(campos || {})) {
    const f = form.elements[k]?.closest?.('.field');
    if (!f) continue;
    f.classList.add('has-err');
    $('.field__err', f).textContent = msg;
  }
}

async function enviar(form, accion, cuerpo) {
  const btn = $('button[type=submit]', form);
  const msg = $('.form__msg', form);
  btn.disabled = true;
  if (msg) { msg.textContent = ''; msg.className = 'form__msg'; }
  try {
    const d = await api(accion, cuerpo);
    errores(form, {});
    return d;
  } catch (e) {
    errores(form, e.campos);
    if (msg) { msg.textContent = e.message; msg.classList.add('is-bad'); }
    return null;
  } finally { btn.disabled = false; }
}

// ---------- login / primera cuenta ----------
function pantallaLogin(registro = false) {
  $('#app').innerHTML = `
    <div class="login">
      <div class="login__img"><img src="../assets/img/nieve.jpg" alt="Perra husky mirando a la cámara"></div>
      <div class="login__box"><div>
        <a class="logo" href="../"><span class="logo__mark">A</span>argos</a>
        <h1>${registro ? 'Crea la cuenta del refugio' : 'Entra al dashboard'}</h1>
        <p class="sub">${registro ? 'Es la primera vez que abres Argos. Esta cuenta será la del administrador.' : 'Solo para el personal del refugio.'}</p>
        <form class="form" id="form-login" novalidate>
          ${registro ? '<div class="field"><label for="l-nombre">Tu nombre</label><input id="l-nombre" name="nombre" autocomplete="name"><small class="field__err"></small></div>' : ''}
          <div class="field"><label for="l-email">Correo</label><input id="l-email" name="email" type="email" autocomplete="username"><small class="field__err"></small></div>
          <div class="field"><label for="l-pass">Contraseña</label><input id="l-pass" name="password" type="password" autocomplete="${registro ? 'new-password' : 'current-password'}"><small class="field__err"></small></div>
          <button class="btn btn--full" type="submit">${registro ? 'Crear cuenta y entrar' : 'Entrar'}</button>
          <p class="form__msg" role="status"></p>
        </form>
      </div></div>
    </div>`;
  $('#form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = await enviar(e.target, registro ? 'registro' : 'login', Object.fromEntries(new FormData(e.target)));
    if (d) iniciar();
  });
  $('#l-' + (registro ? 'nombre' : 'email')).focus();
}

// ---------- layout ----------
const ICON = {
  resumen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/></svg>',
  mascotas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="5" cy="9" r="2"/><circle cx="9.5" cy="5" r="2"/><circle cx="14.5" cy="5" r="2"/><circle cx="19" cy="9" r="2"/><path d="M12 11c-3 0-6 4-6 7a3 3 0 003 3c1.2 0 2-.6 3-.6s1.8.6 3 .6a3 3 0 003-3c0-3-3-7-6-7z"/></svg>',
  solicitudes: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
  seguimiento: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 000-7.8z"/></svg>',
};
const VISTAS = { resumen: 'Resumen', mascotas: 'Mascotas', solicitudes: 'Solicitudes', seguimiento: 'Seguimiento' };
let usuario = null;

function layout() {
  $('#app').innerHTML = `
    <div class="dash">
      <aside class="side" aria-label="Menú del dashboard">
        <a class="logo" href="../"><span class="logo__mark">A</span>argos</a>
        ${Object.entries(VISTAS).map(([k, t]) => `<a class="side__link" href="#${k}" data-vista="${k}">${ICON[k]}<span>${t}</span>${k === 'solicitudes' ? '<span class="badge" id="badge" hidden></span>' : ''}</a>`).join('')}
        <div class="side__foot">
          <p>${esc(usuario.nombre)}</p>
          <p style="margin-top:8px;display:flex;gap:14px;flex-wrap:wrap">
            <button class="link-btn" style="color:#fff;border-color:rgba(255,255,255,.25)" id="btn-equipo">Agregar persona</button>
            <button class="link-btn" style="color:#fff;border-color:rgba(255,255,255,.25)" id="btn-salir">Salir</button>
          </p>
        </div>
      </aside>
      <main class="main" id="main"></main>
    </div>`;
  $('#btn-salir').addEventListener('click', async () => { await api('logout', {}); pantallaLogin(); });
  $('#btn-equipo').addEventListener('click', formEquipo);
}

function ruta() {
  const v = location.hash.slice(1);
  const vista = VISTAS[v] ? v : 'resumen';
  $$('.side__link').forEach((a) => a.classList.toggle('is-on', a.dataset.vista === vista));
  $('#main').innerHTML = '<p class="empty">Cargando…</p>';
  ({ resumen, mascotas, solicitudes, seguimiento })[vista]().catch((e) => { $('#main').innerHTML = `<p class="empty">${esc(e.message)}</p>`; });
}
addEventListener('hashchange', () => usuario && ruta());

const head = (t, sub, extra = '') => `
  <div class="topbar"><a class="logo" href="../"><span class="logo__mark">A</span>argos</a><button class="link-btn" onclick="document.getElementById('btn-salir').click()">Salir</button></div>
  <div class="main__head"><div><h1>${t}</h1><p>${sub}</p></div>${extra}</div>`;

// ---------- resumen ----------
async function resumen() {
  const d = await api('resumen');
  const m = d.mascotas, s = d.solicitudes;
  const pend = s.pendiente + s.en_revision;
  badge(s.pendiente);
  const max = Math.max(1, ...Object.values(d.por_mes));
  const totalSol = Object.values(s).reduce((a, b) => a + b, 0) || 1;
  const colores = { pendiente: 'var(--warn)', en_revision: 'var(--info)', aprobada: 'var(--ok)', rechazada: 'var(--bad)' };
  const mes = (k) => new Date(k + '-15').toLocaleDateString('es-MX', { month: 'short' });
  $('#main').innerHTML = head(`Hola, ${esc(usuario.nombre.split(' ')[0])}`, 'Así va el refugio hoy.', '<a class="btn" href="#mascotas" data-nueva>+ Nueva mascota</a>') + `
    <div class="kpis">
      <div class="kpi"><small>En adopción</small><strong>${m.disponible + m.en_proceso}</strong><span>${m.en_proceso} con solicitudes</span></div>
      <div class="kpi"><small>Por atender</small><strong>${pend}</strong><span>${s.pendiente} nuevas · ${s.en_revision} en revisión</span></div>
      <div class="kpi"><small>Adopciones</small><strong>${s.aprobada}</strong><span>${m.adoptado} ${m.adoptado === 1 ? "mascota" : "mascotas"} en casa</span></div>
      <div class="kpi"><small>Seguimientos</small><strong>${d.seguimientos_30d}</strong><span>en los últimos 30 días</span></div>
    </div>
    <div class="grid2">
      <div class="panel">
        <h2>Solicitudes por mes</h2>
        <div class="bars">${Object.entries(d.por_mes).map(([k, v]) => `<div class="bars__c"><b>${v}</b><div class="bars__b" style="height:${(v / max) * 100}%"></div><small>${mes(k)}</small></div>`).join('')}</div>
      </div>
      <div class="panel">
        <h2>Estado de las solicitudes</h2>
        <div class="stack">${Object.entries(s).map(([k, v]) => `<i style="width:${(v / totalSol) * 100}%;background:${colores[k]}"></i>`).join('')}</div>
        <ul class="legend">${Object.entries(s).map(([k, v]) => `<li><i style="background:${colores[k]}"></i>${ESTADO_SOL[k][1]}<b>${v}</b></li>`).join('')}</ul>
      </div>
      <div class="panel">
        <h2>Últimas solicitudes</h2>
        ${d.recientes.length ? `<ul class="rows">${d.recientes.map((r) => `
          <li><img src="${esc(img(r.foto))}" alt=""><div class="grow"><strong>${esc(r.nombre)} → ${esc(r.mascota)}</strong><small>${esc(r.folio)} · ${fecha(r.creado)}</small></div>${pill(ESTADO_SOL[r.estado])}</li>`).join('')}</ul>
          <p style="margin-top:12px"><a class="link-btn" style="display:inline-flex;align-items:center;text-decoration:none" href="#solicitudes">Ver todas</a></p>`
          : '<p class="empty">Aún no llegan solicitudes. Comparte el sitio.</p>'}
      </div>
      <div class="panel">
        <h2>Seguimiento pendiente</h2>
        ${d.sin_seguimiento.length ? `<p style="color:var(--muted);font-size:14px;margin:-8px 0 8px">Adopciones con más de 30 días sin reporte.</p><ul class="rows">${d.sin_seguimiento.map((r) => `
          <li><div class="grow"><strong>${esc(r.mascota)} · ${esc(r.nombre)}</strong><small>Último: ${r.ultimo ? fecha(r.ultimo) : 'ninguno'}</small></div><a class="link-btn" style="display:inline-flex;align-items:center;text-decoration:none" href="#seguimiento">Registrar</a></li>`).join('')}</ul>`
          : '<p class="empty">Todo al día. Ninguna adopción lleva 30 días sin reporte.</p>'}
      </div>
    </div>`;
  $('[data-nueva]').addEventListener('click', () => setTimeout(() => formMascota(), 50));
}

function badge(n) {
  const b = $('#badge');
  if (!b) return;
  b.hidden = !n;
  b.textContent = n;
}

// ---------- mascotas ----------
let listaMascotas = [];
async function mascotas() {
  listaMascotas = (await api('admin_mascotas')).mascotas;
  $('#main').innerHTML = head('Mascotas', `${listaMascotas.length} registradas en el refugio.`, '<button class="btn" id="btn-nueva">+ Nueva mascota</button>') + `
    <div class="toolbar">
      <input type="search" id="q" placeholder="Buscar por nombre o raza" aria-label="Buscar mascota">
      <select id="f-estado" class="link-btn" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${Object.entries(ESTADO_MASCOTA).map(([k, [, t]]) => `<option value="${k}">${t}</option>`).join('')}</select>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Mascota</th><th>Especie</th><th>Edad</th><th>Estado</th><th>Solicitudes</th><th></th></tr></thead>
      <tbody id="tb"></tbody>
    </table></div>`;
  const pintar = () => {
    const q = $('#q').value.toLowerCase(), est = $('#f-estado').value;
    const l = listaMascotas.filter((m) => (!q || (m.nombre + ' ' + m.raza).toLowerCase().includes(q)) && (!est || m.estado === est));
    $('#tb').innerHTML = l.length ? l.map((m) => `
      <tr>
        <td><div class="who"><img src="${esc(img(m.foto))}" alt=""><div><strong>${esc(m.nombre)}</strong><small>${esc(m.raza)}</small></div></div></td>
        <td>${esc(m.especie)} · ${m.sexo === 'macho' ? '♂' : '♀'}</td>
        <td>${edad(+m.edad_meses)}</td>
        <td>${pill(ESTADO_MASCOTA[m.estado])}</td>
        <td>${m.solicitudes}</td>
        <td><button class="link-btn" data-edit="${m.id}">Editar</button></td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty">Sin resultados.</td></tr>';
  };
  $('#q').addEventListener('input', pintar);
  $('#f-estado').addEventListener('change', pintar);
  $('#tb').addEventListener('click', (e) => { const id = e.target.dataset.edit; if (id) formMascota(listaMascotas.find((m) => m.id == id)); });
  $('#btn-nueva').addEventListener('click', () => formMascota());
  pintar();
}

function formMascota(m = null) {
  const v = (k, d = '') => esc(m?.[k] ?? d);
  const opt = (k, opciones, d) => opciones.map(([val, t]) => `<option value="${val}" ${(m?.[k] ?? d) === val ? 'selected' : ''}>${t}</option>`).join('');
  abrir(`
    <h2 id="drawer-title">${m ? 'Editar ' + v('nombre') : 'Nueva mascota'}</h2>
    <p style="color:var(--muted);margin-bottom:20px">${m ? 'Los cambios se ven al instante en el sitio.' : 'Aparecerá en el catálogo como disponible.'}</p>
    <form class="form" id="form-m" novalidate>
      <input type="hidden" name="id" value="${v('id')}">
      <img class="preview" id="prev" src="${esc(img(m?.foto) || '../assets/img/hero.jpg')}" alt="">
      <div class="field"><label for="m-foto">Foto ${m ? '(deja vacío para conservarla)' : ''}</label><input id="m-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp"><small class="field__err"></small></div>
      <div class="form__row">
        <div class="field"><label for="m-nombre">Nombre</label><input id="m-nombre" name="nombre" value="${v('nombre')}"><small class="field__err"></small></div>
        <div class="field"><label for="m-raza">Raza</label><input id="m-raza" name="raza" value="${v('raza')}" placeholder="Mestizo"></div>
      </div>
      <div class="form__row">
        <div class="field"><label for="m-especie">Especie</label><select id="m-especie" name="especie">${opt('especie', [['perro', 'Perro'], ['gato', 'Gato'], ['otro', 'Otro']], 'perro')}</select></div>
        <div class="field"><label for="m-sexo">Sexo</label><select id="m-sexo" name="sexo">${opt('sexo', [['macho', 'Macho'], ['hembra', 'Hembra']], 'macho')}</select></div>
      </div>
      <div class="form__row">
        <div class="field"><label for="m-edad">Edad en meses</label><input id="m-edad" name="edad_meses" type="number" min="0" max="400" inputmode="numeric" value="${v('edad_meses', '12')}"></div>
        <div class="field"><label for="m-tam">Tamaño</label><select id="m-tam" name="tamano">${opt('tamano', [['chico', 'Chico'], ['mediano', 'Mediano'], ['grande', 'Grande']], 'mediano')}</select></div>
      </div>
      <div class="field"><label for="m-desc">Descripción</label><textarea id="m-desc" name="descripcion">${v('descripcion')}</textarea><small class="field__err"></small></div>
      <div class="radios">
        <label class="check"><input type="checkbox" name="vacunado" value="1" ${+m?.vacunado ? 'checked' : ''}> Vacunado</label>
        <label class="check"><input type="checkbox" name="esterilizado" value="1" ${+m?.esterilizado ? 'checked' : ''}> Esterilizado</label>
      </div>
      <div class="field"><label for="m-estado">Estado</label><select id="m-estado" name="estado">${opt('estado', Object.entries(ESTADO_MASCOTA).map(([k, [, t]]) => [k, t]), 'disponible')}</select></div>
      <button class="btn btn--full" type="submit">${m ? 'Guardar cambios' : 'Publicar mascota'}</button>
      ${m ? '<button class="btn btn--ghost btn--full" type="button" id="btn-borrar">Borrar mascota</button>' : ''}
      <p class="form__msg" role="status"></p>
    </form>`);
  $('#m-foto').addEventListener('change', (e) => { const f = e.target.files[0]; if (f) $('#prev').src = URL.createObjectURL(f); });
  $('#form-m').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await enviar(e.target, 'guardar_mascota', new FormData(e.target))) { drawer.close(); toast(m ? 'Cambios guardados' : 'Mascota publicada'); location.hash = '#mascotas'; ruta(); }
  });
  $('#btn-borrar')?.addEventListener('click', async () => {
    if (!confirm(`¿Borrar a ${m.nombre}? También se borran sus solicitudes y seguimientos. No se puede deshacer.`)) return;
    await api('borrar_mascota', { id: m.id });
    drawer.close(); toast('Mascota borrada'); ruta();
  });
}

// ---------- solicitudes ----------
let listaSol = [];
async function solicitudes() {
  listaSol = (await api('admin_solicitudes')).solicitudes;
  badge(listaSol.filter((s) => s.estado === 'pendiente').length);
  const cuenta = (k) => listaSol.filter((s) => s.estado === k).length;
  $('#main').innerHTML = head('Solicitudes', 'Revisa, agenda visita y decide.') + `
    <div class="toolbar">
      <input type="search" id="q" placeholder="Buscar por folio, nombre o mascota" aria-label="Buscar solicitud">
      <div class="chips" style="margin:0" role="group" aria-label="Filtrar por estado">
        <button class="chip is-on" data-f="">Todas · ${listaSol.length}</button>
        ${Object.entries(ESTADO_SOL).map(([k, [, t]]) => `<button class="chip" data-f="${k}">${t} · ${cuenta(k)}</button>`).join('')}
      </div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Solicitante</th><th>Mascota</th><th>Folio</th><th>Fecha</th><th>Estado</th><th></th></tr></thead>
      <tbody id="tb"></tbody>
    </table></div>`;
  let f = '';
  const pintar = () => {
    const q = $('#q').value.toLowerCase();
    const l = listaSol.filter((s) => (!f || s.estado === f) && (!q || `${s.folio} ${s.nombre} ${s.mascota}`.toLowerCase().includes(q)));
    $('#tb').innerHTML = l.length ? l.map((s) => `
      <tr>
        <td><strong>${esc(s.nombre)}</strong><small>${esc(s.ciudad)}</small></td>
        <td><div class="who"><img src="${esc(img(s.mascota_foto))}" alt="">${esc(s.mascota)}</div></td>
        <td class="mono">${esc(s.folio)}</td>
        <td>${fecha(s.creado)}</td>
        <td>${pill(ESTADO_SOL[s.estado])}</td>
        <td><button class="link-btn" data-ver="${s.id}">Revisar</button></td>
      </tr>`).join('') : '<tr><td colspan="6" class="empty">No hay solicitudes aquí.</td></tr>';
  };
  $$('.chip[data-f]').forEach((c) => c.addEventListener('click', () => { f = c.dataset.f; $$('.chip[data-f]').forEach((x) => x.classList.toggle('is-on', x === c)); pintar(); }));
  $('#q').addEventListener('input', pintar);
  $('#tb').addEventListener('click', (e) => { const id = e.target.dataset.ver; if (id) verSolicitud(listaSol.find((s) => s.id == id)); });
  pintar();
}

function verSolicitud(s) {
  abrir(`
    <p class="mono" style="color:var(--muted)">${esc(s.folio)}</p>
    <h2 id="drawer-title">${esc(s.nombre)}</h2>
    <p>quiere adoptar a <strong>${esc(s.mascota)}</strong> · ${pill(ESTADO_SOL[s.estado])}</p>
    <dl class="kv">
      <dt>Correo</dt><dd><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></dd>
      <dt>Teléfono</dt><dd><a href="tel:${esc(s.telefono)}">${esc(s.telefono)}</a></dd>
      <dt>Ciudad</dt><dd>${esc(s.ciudad)}</dd>
      <dt>Vivienda</dt><dd>${s.vivienda === 'casa' ? 'Casa' : 'Departamento'}${+s.tiene_patio ? ' con patio' : ''}</dd>
      <dt>Otras mascotas</dt><dd>${esc(s.otras_mascotas || 'Ninguna')}</dd>
      <dt>Recibida</dt><dd>${fecha(s.creado)}</dd>
      <dt>Motivo</dt><dd>${esc(s.motivo)}</dd>
    </dl>
    <form class="form" id="form-s" novalidate>
      <fieldset class="field"><legend>Cambiar estado</legend>
        <div class="radios status-btns">${Object.entries(ESTADO_SOL).map(([k, [, t]]) => `<label><input type="radio" name="estado" value="${k}" ${s.estado === k ? 'checked' : ''}> ${t}</label>`).join('')}</div>
      </fieldset>
      <div class="field"><label for="s-notas">Notas internas</label><textarea id="s-notas" name="notas" placeholder="Visita agendada, comentarios…">${esc(s.notas)}</textarea></div>
      <button class="btn btn--full" type="submit">Guardar</button>
      <p class="form__msg" role="status"></p>
    </form>`);
  $('#form-s').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    if (await enviar(e.target, 'actualizar_solicitud', { id: s.id, ...d })) {
      drawer.close();
      toast(d.estado === 'aprobada' ? `¡${s.mascota} tiene casa! Pasa a Seguimiento.` : 'Solicitud actualizada');
      ruta();
    }
  });
}

// ---------- seguimiento ----------
async function seguimiento() {
  const l = (await api('adopciones')).adopciones;
  $('#main').innerHTML = head('Seguimiento', 'Mascotas adoptadas y sus reportes. La meta: uno al mes durante 6 meses.') + `
    <div class="table-wrap"><table>
      <thead><tr><th>Mascota</th><th>Adoptante</th><th>Adoptado</th><th>Reportes</th><th>Último</th><th></th></tr></thead>
      <tbody>${l.length ? l.map((a) => {
        const ult = a.ultimo || a.adoptado;
        const tarde = dias(ult) > 30;
        return `<tr>
          <td><div class="who"><img src="${esc(img(a.foto))}" alt=""><strong>${esc(a.mascota)}</strong></div></td>
          <td>${esc(a.nombre)}<small>${esc(a.telefono)}</small></td>
          <td>${fecha(a.adoptado)}</td>
          <td>${a.total} / 6</td>
          <td>${a.ultimo ? fecha(a.ultimo) : '—'} ${tarde ? pill(['bad', 'Atrasado']) : ''}</td>
          <td><button class="link-btn" data-ver="${a.id}">Abrir</button></td>
        </tr>`;
      }).join('') : '<tr><td colspan="6" class="empty">Cuando apruebes una solicitud, aparecerá aquí.</td></tr>'}</tbody>
    </table></div>`;
  $('tbody').addEventListener('click', (e) => { const id = e.target.dataset.ver; if (id) verAdopcion(l.find((a) => a.id == id)); });
}

async function verAdopcion(a) {
  const segs = (await api('seguimientos', undefined, `&solicitud=${a.id}`)).seguimientos;
  abrir(`
    <p class="mono" style="color:var(--muted)">${esc(a.folio)}</p>
    <h2 id="drawer-title">${esc(a.mascota)} con ${esc(a.nombre)}</h2>
    <p style="color:var(--muted)">Adoptado el ${fecha(a.adoptado)} · <a href="mailto:${esc(a.email)}">${esc(a.email)}</a></p>
    <form class="form" id="form-g" novalidate style="margin:22px 0 28px">
      <fieldset class="field"><legend>Estado de salud</legend><div class="radios">
        ${Object.entries(SALUD).map(([k, [, t]], i) => `<label><input type="radio" name="salud" value="${k}" ${i ? '' : 'checked'}> ${t}</label>`).join('')}
      </div></fieldset>
      <div class="field"><label for="g-com">Comentario</label><textarea id="g-com" name="comentario" placeholder="Visita o llamada: cómo la encontraste"></textarea><small class="field__err"></small></div>
      <div class="field"><label for="g-foto">Foto (opcional)</label><input id="g-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp"><small class="field__err"></small></div>
      <button class="btn btn--full" type="submit">Registrar seguimiento</button>
      <p class="form__msg" role="status"></p>
    </form>
    <h3 style="font-size:20px;margin-bottom:6px">Historial · ${segs.length}</h3>
    ${segs.length ? `<ul class="reports">${segs.map((g) => `
      <li><small>${fecha(g.creado)} · ${g.autor === 'refugio' ? 'Refugio' : 'Adoptante'}</small>${pill(SALUD[g.salud])}<p style="margin-top:8px">${esc(g.comentario)}</p>
      ${g.foto ? `<img src="${esc(img(g.foto))}" alt="Foto del reporte" style="margin-top:10px;border-radius:10px;max-height:220px;object-fit:cover">` : ''}</li>`).join('')}</ul>`
      : '<p class="empty">Aún sin reportes.</p>'}`);
  $('#form-g').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('solicitud_id', a.id);
    if (await enviar(e.target, 'agregar_seguimiento', fd)) { toast('Seguimiento registrado'); verAdopcion(a); ruta(); }
  });
}

// ---------- equipo ----------
function formEquipo() {
  abrir(`
    <h2 id="drawer-title">Agregar persona del refugio</h2>
    <p style="color:var(--muted);margin-bottom:20px">Tendrá el mismo acceso que tú.</p>
    <form class="form" id="form-eq" novalidate>
      <div class="field"><label for="e-nombre">Nombre</label><input id="e-nombre" name="nombre"><small class="field__err"></small></div>
      <div class="field"><label for="e-email">Correo</label><input id="e-email" name="email" type="email"><small class="field__err"></small></div>
      <div class="field"><label for="e-pass">Contraseña temporal</label><input id="e-pass" name="password" type="password" autocomplete="new-password"><small class="field__err"></small></div>
      <button class="btn btn--full" type="submit">Crear acceso</button>
      <p class="form__msg" role="status"></p>
    </form>`);
  $('#form-eq').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (await enviar(e.target, 'registro', Object.fromEntries(new FormData(e.target)))) { drawer.close(); toast('Acceso creado'); }
  });
}

// ---------- inicio ----------
async function iniciar() {
  try {
    const d = await api('sesion');
    if (!d.usuario) return pantallaLogin(d.necesita_registro);
    usuario = d.usuario;
    layout();
    ruta();
  } catch (e) {
    $('#app').innerHTML = `<div class="login__box" style="min-height:100dvh"><div><h1>No hay conexión</h1><p class="sub">${esc(e.message)}</p></div></div>`;
  }
}
iniciar();
