// ARGOS · sitio público
const API = 'api.php';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function api(action, body) {
  const opt = body === undefined ? {} : { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body), headers: body instanceof FormData ? {} : { 'Content-Type': 'application/json' } };
  const res = await fetch(`${API}?action=${action}`, opt);
  const data = await res.json().catch(() => ({ error: 'El servidor no respondió. ¿Está subido api.php?' }));
  if (!res.ok || data.error) throw Object.assign(new Error(data.error || 'Error'), { campos: data.campos || {} });
  return data;
}

const edad = (m) => (m < 12 ? `${m} ${m === 1 ? 'mes' : 'meses'}` : `${Math.floor(m / 12)} ${m < 24 ? 'año' : 'años'}`);
const ESTADO_MASCOTA = { disponible: ['ok', 'Disponible'], en_proceso: ['warn', 'Con solicitudes'], adoptado: ['info', 'Adoptado'] };
const ESTADO_SOL = { pendiente: ['warn', 'Pendiente'], en_revision: ['info', 'En revisión'], aprobada: ['ok', 'Aprobada'], rechazada: ['bad', 'Rechazada'] };
const SALUD = { bien: 'Está bien', regular: 'Regular', atencion: 'Necesita atención' };
const pill = ([tono, txt]) => `<span class="pill pill--${tono}">${txt}</span>`;
const fecha = (s) => new Date(s.replace(' ', 'T')).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

// ---------- nav ----------
const nav = $('#nav');
const onScroll = () => nav.classList.toggle('is-solid', scrollY > window.innerHeight * 0.85);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------- catálogo ----------
let mascotas = [];
let filtro = 'todos';

function pintar() {
  const box = $('#pets');
  const lista = mascotas.filter((m) => filtro === 'todos' || m.especie === filtro);
  $('#pet-count').textContent = lista.length;
  $('#demo-note').hidden = !demo;
  box.innerHTML = lista.length ? lista.map((m, i) => `
    <button class="slide" type="button" data-id="${m.id}" aria-label="Ver la ficha de ${esc(m.nombre)}">
      <div class="slide__ph">
        <img src="${esc(m.foto || 'assets/img/hero.jpg')}" alt="${esc(m.nombre)}, ${esc(m.raza || m.especie)}" loading="${i < 3 ? 'eager' : 'lazy'}">
        ${m.estado === 'disponible' ? '' : pill(ESTADO_MASCOTA[m.estado])}
      </div>
      <div class="slide__meta">
        <div><h3>${esc(m.nombre)}</h3><p class="slide__info">${esc(m.raza || m.especie)} · ${m.sexo === 'macho' ? 'macho' : 'hembra'} · ${edad(+m.edad_meses)}</p></div>
        <span class="slide__n mono">${String(i + 1).padStart(2, '0')}</span>
      </div>
    </button>`).join('')
    : `<p class="pets__msg">${mascotas.length ? 'No hay mascotas de este tipo por ahora.' : 'Por ahora todas encontraron casa. Vuelve pronto.'}</p>`;
  document.dispatchEvent(new CustomEvent('argos:pets'));
}

// Mascotas de ejemplo: se muestran solo si la página se abre sin servidor (vista previa).
const EJEMPLOS = [
  ['Mango', 'perro', 'Golden retriever mestizo', 'macho', 30, 'grande', 'Sonríe con todo el cuerpo. Le encanta el agua y se lleva bien con niños.', 'mango'],
  ['Naranja', 'gato', 'Doméstica atigrada', 'hembra', 3, 'chico', 'Gatita juguetona. Ya usa arenero y duerme hecha bolita en tu regazo.', 'naranja'],
  ['Bruno', 'perro', 'Corgi', 'macho', 5, 'chico', 'Cachorro feliz y glotón. Aprende trucos por un premio.', 'bruno'],
  ['Luna', 'perro', 'Mestiza de labrador', 'hembra', 4, 'mediano', 'Cachorra curiosa. Aprende rápido y duerme donde haya sol.', 'luna'],
  ['Michi', 'gato', 'Doméstico', 'macho', 18, 'chico', 'Independiente pero pide caricias en la tarde.', 'michi'],
  ['Canela', 'perro', 'Dachshund', 'hembra', 24, 'chico', 'Le encanta el pasto y seguir olores. Se lleva bien con perros.', 'canela'],
].map(([nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto], i) => ({
  id: -(i + 1), nombre, especie, raza, sexo, edad_meses, tamano, descripcion, foto: `assets/img/${foto}.jpg`, vacunado: 1, esterilizado: i % 2, estado: 'disponible',
}));
let demo = false;

async function cargar() {
  try {
    mascotas = (await api('mascotas')).mascotas;
    demo = false;
  } catch {
    mascotas = EJEMPLOS;
    demo = true;
  }
  pintar();
}

$$('.chip').forEach((c) => c.addEventListener('click', () => {
  filtro = c.dataset.filtro;
  $$('.chip').forEach((x) => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-pressed', x === c); });
  pintar();
}));

// ---------- ficha + solicitud ----------
const modal = $('#modal');
$$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

$('#pets').addEventListener('click', (e) => {
  const card = e.target.closest('.slide');
  if (card) abrirFicha(mascotas.find((m) => m.id == card.dataset.id));
});

function abrirFicha(m) {
  $('#modal-body').innerHTML = `
    <div class="ficha">
      <img class="ficha__img" src="${esc(m.foto || 'assets/img/hero.jpg')}" alt="${esc(m.nombre)}">
      <div class="ficha__body">
        ${pill(ESTADO_MASCOTA[m.estado])}
        <h2 id="modal-title">${esc(m.nombre)}</h2>
        <p class="pet__meta">${esc(m.raza || m.especie)}</p>
        <div class="ficha__facts">
          <div><small>Edad</small>${edad(+m.edad_meses)}</div>
          <div><small>Sexo</small>${m.sexo === 'macho' ? 'Macho' : 'Hembra'}</div>
          <div><small>Tamaño</small>${esc(m.tamano[0].toUpperCase() + m.tamano.slice(1))}</div>
          <div><small>Salud</small>${+m.vacunado ? 'Vacunas al día' : 'Vacunas pendientes'}${+m.esterilizado ? ', esterilizado' : ''}</div>
        </div>
        <p>${esc(m.descripcion)}</p>
      </div>
      <div class="ficha__solicitar">
        <h3>Solicitar a ${esc(m.nombre)}</h3>
        <form class="form" id="form-sol" novalidate>
          <input type="hidden" name="mascota_id" value="${m.id}">
          <div class="hp" aria-hidden="true"><label>Sitio web <input name="sitio_web" tabindex="-1" autocomplete="off"></label></div>
          <div class="form__row">
            <div class="field"><label for="s-nombre">Nombre completo</label><input id="s-nombre" name="nombre" autocomplete="name" required><small class="field__err"></small></div>
            <div class="field"><label for="s-email">Correo</label><input id="s-email" name="email" type="email" autocomplete="email" required><small class="field__err"></small></div>
          </div>
          <div class="form__row">
            <div class="field"><label for="s-tel">Teléfono</label><input id="s-tel" name="telefono" type="tel" autocomplete="tel" required><small class="field__err"></small></div>
            <div class="field"><label for="s-ciudad">Ciudad</label><input id="s-ciudad" name="ciudad" autocomplete="address-level2" required><small class="field__err"></small></div>
          </div>
          <fieldset class="field"><legend>Vivienda</legend>
            <div class="radios">
              <label><input type="radio" name="vivienda" value="casa"> Casa</label>
              <label><input type="radio" name="vivienda" value="departamento"> Departamento</label>
              <label class="check"><input type="checkbox" name="tiene_patio" value="1"> Tiene patio</label>
            </div><small class="field__err" data-for="vivienda"></small>
          </fieldset>
          <div class="field"><label for="s-otras">¿Tienes otras mascotas? (opcional)</label><input id="s-otras" name="otras_mascotas" placeholder="Ej. un gato de 3 años"></div>
          <div class="field"><label for="s-motivo">¿Por qué quieres adoptar a ${esc(m.nombre)}?</label><textarea id="s-motivo" name="motivo" required></textarea><small class="field__err"></small></div>
          <button class="btn btn--full" type="submit">Enviar solicitud</button>
          <p class="form__msg" role="status"></p>
        </form>
      </div>
    </div>`;
  modal.showModal();
  $('#form-sol').addEventListener('submit', enviarSolicitud);
}

function errores(form, campos) {
  $$('.field', form).forEach((f) => f.classList.remove('has-err'));
  $$('.field__err', form).forEach((e) => (e.textContent = ''));
  for (const [k, msg] of Object.entries(campos)) {
    const input = form.elements[k];
    const el = input?.length && !input.tagName ? input[0] : input;
    const field = el?.closest('.field');
    if (!field) continue;
    field.classList.add('has-err');
    (field.querySelector(`[data-for="${k}"]`) || field.querySelector('.field__err')).textContent = msg;
  }
  const first = $('.has-err input, .has-err textarea', form);
  first?.focus();
}

async function enviar(form, accion, cuerpo) {
  const btn = $('button[type=submit]', form);
  const msg = $('.form__msg', form);
  btn.disabled = true;
  msg.textContent = '';
  msg.className = 'form__msg';
  try {
    const d = await api(accion, cuerpo);
    errores(form, {});
    return d;
  } catch (e) {
    errores(form, e.campos);
    msg.textContent = e.message;
    msg.classList.add('is-bad');
    return null;
  } finally {
    btn.disabled = false;
  }
}

async function enviarSolicitud(e) {
  e.preventDefault();
  const form = e.target;
  const datos = Object.fromEntries(new FormData(form));
  if (demo) {
    const msg = $('.form__msg', form);
    msg.textContent = 'Esta es una vista previa: las solicitudes se guardan cuando el sitio está subido con su base de datos.';
    msg.className = 'form__msg is-bad';
    return;
  }
  const d = await enviar(form, 'solicitar', datos);
  if (!d) return;
  const nombre = mascotas.find((m) => m.id == datos.mascota_id)?.nombre ?? 'tu mascota';
  $('.ficha__solicitar').innerHTML = `
    <div class="ok-box">
      <p class="tag">Solicitud recibida</p>
      <h3 style="border:0;padding:0;margin:12px 0 0">Guarda tu folio</h3>
      <div class="folio">${esc(d.folio)}</div>
      <p>El refugio revisará tu solicitud para ${esc(nombre)} y te contactará. Con este folio y tu correo consultas el avance.</p>
    </div>`;
  $('#f-folio').value = d.folio;
  $('#f-correo').value = datos.email;
  cargar();
}

// ---------- consulta de folio ----------
const PASOS = ['pendiente', 'en_revision', 'aprobada'];
let consulta = null;

$('#form-estado').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const datos = Object.fromEntries(new FormData(form));
  const err = {};
  if (!datos.folio.trim()) err.folio = 'Escribe tu folio';
  if (!datos.email.trim()) err.email = 'Escribe tu correo';
  if (Object.keys(err).length) return errores(form, err);
  const d = await enviar(form, 'estado', datos);
  if (!d) return;
  consulta = datos;
  mostrarEstado(d);
});

function mostrarEstado(d) {
  const idx = PASOS.indexOf(d.estado);
  const rech = d.estado === 'rechazada';
  const pasos = [['Solicitud recibida', d.creado], ['En revisión por el refugio'], ['Adopción aprobada']];
  $('#estado-out').innerHTML = `
    <div class="result__head">
      <img src="${esc(d.mascota_foto)}" alt="">
      <div><p class="mono">${esc(d.folio)}</p><h3>${esc(d.mascota)}</h3></div>
      <div style="margin-left:auto">${pill(ESTADO_SOL[d.estado])}</div>
    </div>
    <ol class="timeline">
      ${pasos.map(([t, f], i) => `<li class="${rech ? (i === 0 ? 'is-done' : '') : i <= idx ? 'is-done' : ''}">${t}${f ? ` · ${fecha(f)}` : ''}</li>`).join('')}
      ${rech ? `<li class="is-done is-bad">No aprobada · ${fecha(d.actualizado)}. Puedes solicitar otra mascota.</li>` : ''}
    </ol>
    ${d.estado === 'aprobada' ? `
      <h3 style="font-size:22px;margin-top:8px">Reporte de seguimiento</h3>
      <form class="form" id="form-rep" novalidate style="margin-top:14px">
        <fieldset class="field"><legend>¿Cómo está?</legend><div class="radios">
          <label><input type="radio" name="salud" value="bien" checked> Bien</label>
          <label><input type="radio" name="salud" value="regular"> Regular</label>
          <label><input type="radio" name="salud" value="atencion"> Necesita atención</label>
        </div></fieldset>
        <div class="field"><label for="r-com">Cuéntanos</label><textarea id="r-com" name="comentario" placeholder="Come bien, ya duerme en su cama…"></textarea><small class="field__err"></small></div>
        <div class="field"><label for="r-foto">Foto (opcional)</label><input id="r-foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp"><small class="field__err"></small></div>
        <button class="btn btn--full" type="submit">Enviar reporte</button>
        <p class="form__msg" role="status"></p>
      </form>
      ${d.seguimientos.length ? `<ul class="reports">${d.seguimientos.map((s) => `<li><small>${fecha(s.creado)} · ${s.autor === 'refugio' ? 'Refugio' : 'Tú'} · ${SALUD[s.salud]}</small>${esc(s.comentario)}</li>`).join('')}</ul>` : ''}
    ` : ''}`;
  $('#form-rep')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('folio', consulta.folio);
    fd.append('email', consulta.email);
    if (await enviar(e.target, 'reportar', fd)) mostrarEstado(await api('estado', consulta));
  });
}

cargar();
