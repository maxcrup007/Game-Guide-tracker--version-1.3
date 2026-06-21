const BASE = '';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (res.status === 401 && !url.includes('/admin/login')) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }
  return res;
}

export async function get(url) {
  const res = await request(url);
  return res.json();
}

export async function post(url, data) {
  const res = await request(url, { method: 'POST', body: JSON.stringify(data) });
  return res.json();
}

export async function put(url, data) {
  const res = await request(url, { method: 'PUT', body: JSON.stringify(data) });
  return res.json();
}

export async function del(url) {
  const res = await request(url, { method: 'DELETE' });
  return res.json();
}

export async function uploadFile(url, formData) {
  const res = await fetch(`${BASE}${url}`, { method: 'POST', body: formData });
  return res.json();
}
