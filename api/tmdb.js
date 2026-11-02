const BASE = 'https://api.themoviedb.org/3';
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ error: 'TMDB_ACCESS_TOKEN is missing in Vercel project Environment Variables.' });
  const path = String(req.query.path || '');
  const allowed = /^(movie\/(popular|top_rated|now_playing|upcoming|\d+)|discover\/movie|search\/movie|genre\/movie\/list|trending\/movie\/(day|week))$/;
  if (!allowed.test(path)) return res.status(400).json({ error: 'Unsupported catalogue request.' });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(req.query)) if (key !== 'path' && typeof value === 'string') params.set(key, value.slice(0, 200));
  params.set('language', params.get('language') || 'en-US');
  try {
    const response = await fetch(`${BASE}/${path}?${params}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.status_message || 'TMDB request failed.' });
    return res.status(200).json(data);
  } catch (err) {
    console.error('TMDB proxy error:', err);
    return res.status(502).json({ error: 'Could not reach TMDB. Please try again.' });
  }
};