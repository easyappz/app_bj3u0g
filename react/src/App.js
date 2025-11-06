import React, { useEffect, useMemo, useState, useCallback } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { fetchStats, computeExpression } from './api/calc';
import './App.css';

function App() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [statsCount, setStatsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Калькулятор';
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchStats()
      .then((d) => {
        if (mounted && typeof d?.today_count === 'number') setStatsCount(d.today_count);
      })
      .catch(() => {})
      .finally(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (typeof window.handleRoutes === 'function') {
      try { window.handleRoutes(['/']); } catch (e) { /* noop */ }
    }
  }, []);

  const buttons = useMemo(() => [
    ['7','8','9','/'],
    ['4','5','6','*'],
    ['1','2','3','-'],
    ['0','.', 'C', '='],
  ], []);

  const append = useCallback((val) => {
    setError(null);
    if (val === 'C') {
      setExpression('');
      setResult(null);
      return;
    }
    if (val === '⌫') {
      setExpression((prev) => prev.slice(0, prev.length - 1));
      return;
    }
    if (val === '=') {
      if (!expression) return;
      setLoading(true);
      computeExpression(expression)
        .then((data) => {
          setError(null);
          setResult(data?.result);
          setExpression(String(data?.result));
          return fetchStats();
        })
        .then((d) => {
          if (d && typeof d.today_count === 'number') setStatsCount(d.today_count);
        })
        .catch((e) => {
          const msg = e?.response?.data?.error || 'Ошибка вычисления';
          setError(msg);
        })
        .finally(() => setLoading(false));
      return;
    }
    setExpression((prev) => (prev || '') + String(val));
  }, [expression]);

  const onKey = useCallback((e) => {
    const k = e.key;
    const digits = ['0','1','2','3','4','5','6','7','8','9'];
    const ops = ['+','-','*','/'];

    if (digits.includes(k) || k === '.') {
      append(k);
      return;
    }
    if (ops.includes(k)) {
      append(k);
      return;
    }
    if (k === 'Enter') {
      append('=');
      return;
    }
    if (k === 'Backspace') {
      append('⌫');
      return;
    }
    if (k === 'Escape') {
      append('C');
    }
  }, [append]);

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  return (
    <ErrorBoundary>
      <div data-easytag="id1-react/src/App.js" className="min-h-screen w-full flex items-center justify-center px-4">
        <main data-easytag="id2-react/src/App.js" className="calculator-wrap max-w-md w-full rounded-2xl shadow-soft p-6">
          <h1 data-easytag="id3-react/src/App.js" className="text-center text-2xl font-semibold mb-4 text-white">Калькулятор</h1>

          <div data-easytag="id4-react/src/App.js" className="mb-2">
            <input
              data-easytag="id5-react/src/App.js"
              className="display-input w-full text-right text-white placeholder-gray-400 bg-transparent border border-white/10 rounded-lg px-4 py-4 text-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
              type="text"
              readOnly
              aria-label="display"
              value={expression}
              placeholder="0"
            />
          </div>

          {error ? (
            <div data-easytag="id6-react/src/App.js" className="text-sm text-red-300 mb-3">{error}</div>
          ) : (
            <div data-easytag="id7-react/src/App.js" className="text-sm text-gray-300 mb-3 h-5">
              {result !== null ? `Ответ: ${result}` : ''}
            </div>
          )}

          <div data-easytag="id8-react/src/App.js" className="grid grid-cols-4 gap-2 select-none">
            {buttons.flat().map((val, idx) => {
              const isAccent = val === '=';
              const isDanger = val === 'C';
              return (
                <button
                  data-easytag={`id9-${idx}-react/src/App.js`}
                  key={`${val}-${idx}`}
                  type="button"
                  disabled={loading && val === '='}
                  onClick={() => append(val)}
                  className={[
                    'btn-ghost rounded-xl px-3 py-3 text-lg font-medium',
                    'border border-white/10 text-white',
                    'hover:bg-white/10 active:bg-white/20',
                    isAccent ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 border-indigo-500' : '',
                    isDanger ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-600 border-rose-500' : '',
                    (loading && val === '=') ? 'opacity-80 cursor-not-allowed' : ''
                  ].filter(Boolean).join(' ')}
                >
                  {loading && val === '=' ? (
                    <span data-easytag={`id10-${idx}-react/src/App.js`} className="inline-flex items-center gap-2">
                      <span data-easytag={`id11-${idx}-react/src/App.js`} className="spinner-xs"></span>
                      <span data-easytag={`id12-${idx}-react/src/App.js`}>=</span>
                    </span>
                  ) : (
                    <span data-easytag={`id13-${idx}-react/src/App.js`}>{val}</span>
                  )}
                </button>
              );
            })}

            <button
              data-easytag="id14-react/src/App.js"
              type="button"
              onClick={() => append('⌫')}
              className="btn-ghost rounded-xl px-3 py-3 text-lg font-medium border border-white/10 text-white hover:bg-white/10 active:bg-white/20 col-span-4"
            >
              ⌫
            </button>
          </div>

          <div data-easytag="id15-react/src/App.js" className="mt-4 text-center text-sm text-gray-300">
            Сегодня вычислений: {statsCount}
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
