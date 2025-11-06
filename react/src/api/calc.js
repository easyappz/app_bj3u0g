import instance from './axios';

// Keep existing helpers (not used by the new UI), in case other parts rely on them
export async function fetchStats() {
  const res = await instance.get('/api/calc/stats/');
  return res.data;
}

export async function computeExpression(expression) {
  const res = await instance.post('/api/calc/compute/', { expression });
  return res.data;
}

export async function computeBasic({ a, b, op }) {
  const res = await instance.post('/api/calc/', { a, b, op });
  return res.data;
}

// New canonical function for this app
export async function calculate({ a, b, op }) {
  const res = await instance.post('/api/calc/', { a, b, op });
  return res.data;
}
