// const API_URL = 'https://siggo.municayma.gob.pe/planificacion/api/';
const API_URL = 'https://demo.iuvade.com/siggo/api/';

async function apiGet(tgs, params = {}) {
  const url = new URL(API_URL + tgs + '/');
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.append(key, value);
  }
  const res = await fetch(url);
  return await res.json();
}

async function apiPost(tgs, params = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  const res = await fetch(API_URL + tgs + '/', {
    method: 'POST',
    body: formData,
  });
  const text = await res.text();
  // El backend PHP puede devolver debug output (var_dump) antes del JSON
  const jsonMatch = text.match(/\{[\s\S]*\}$/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  return JSON.parse(text);
}

export async function pais() {
  const json = await apiGet('maraton_paises');
  return json.data;
}

export async function constancia(codigo) {
  return await apiGet('maraton_constancia', { codigo });
}

export async function buscarDocumento(doc) {
  return await apiGet('maraton_buscardocumento', { doc });
}

export async function departamento() {
  const json = await apiGet('maraton_departamento');
  return json.data;
}

export async function provincia(dep) {
  const json = await apiGet('maraton_provincia', { d: dep });
  return json.data;
}

export async function distrito(dep, prov) {
  const json = await apiGet('maraton_distrito', { d: dep, p: prov });
  return json.data;
}

export async function categoria(sex, ano) {
  return await apiGet('maraton_categoria', { sex, ano: String(ano) });
}

export async function categoriaDisponible() {
  const json = await apiGet('maraton_categoriadisponible');
  return json.data;
}

export async function registrarOnline(values) {
  return await apiPost('maraton_registraronline', {
    values: JSON.stringify(values),
  });
}

export async function registrarEfectivo(codigo, values) {
  return await apiPost('maraton_registrarefectivo', {
    codigo,
    values: JSON.stringify(values),
  });
}

export async function confirmarRegistro(params = {}) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value);
  }
  const res = await fetch(API_URL + 'maraton_confirmarregistro/', {
    method: 'POST',
    body: formData,
  });
  return await res.text();
}
