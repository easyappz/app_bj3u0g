import instance from './axios';

export async function fetchStats() {
  const res = await instance.get('/api/calc/stats/');
  return res.data;
}

export async function computeExpression(expression) {
  const res = await instance.post('/api/calc/compute/', { expression });
  return res.data;
}
