import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { calculate } from '../api/calc';

const operatorSymbolToOp = {
  '+': 'add',
  '-': 'sub',
  '×': 'mul',
  '÷': 'div',
};

function formatNumberString(value) {
  if (value === '' || value === '-') return '0';
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return String(n);
}

export default function Calculator() {
  const [displayValue, setDisplayValue] = useState('0');
  const [firstOperand, setFirstOperand] = useState(null); // number | null
  const [operator, setOperator] = useState(null); // '+', '-', '×', '÷' | null
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Калькулятор';
  }, []);

  // Keyboard support
  const handleKeyDown = useCallback((e) => {
    const k = e.key;
    const digitKeys = ['0','1','2','3','4','5','6','7','8','9'];

    if (digitKeys.includes(k)) {
      e.preventDefault();
      handleDigit(k);
      return;
    }

    if (k === '.' || k === ',') {
      e.preventDefault();
      handleDot();
      return;
    }

    if (k === '+' || k === '-') {
      e.preventDefault();
      handleOperator(k);
      return;
    }

    if (k === '*' || k === 'x' || k === 'X') {
      e.preventDefault();
      handleOperator('×');
      return;
    }

    if (k === '/') {
      e.preventDefault();
      handleOperator('÷');
      return;
    }

    if (k === 'Enter' || k === '=') {
      e.preventDefault();
      handleEquals();
      return;
    }

    if (k === 'Backspace') {
      e.preventDefault();
      handleDelete();
      return;
    }

    if (k === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayValue, firstOperand, operator, waitingForSecondOperand, loading]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleDigit = useCallback((digit) => {
    setError('');
    setDisplayValue((prev) => {
      if (waitingForSecondOperand) {
        setWaitingForSecondOperand(false);
        return digit;
      }
      if (prev === '0') return digit;
      return prev + digit;
    });
  }, [waitingForSecondOperand]);

  const handleDot = useCallback(() => {
    setError('');
    setDisplayValue((prev) => {
      if (waitingForSecondOperand) {
        setWaitingForSecondOperand(false);
        return '0.';
      }
      if (prev.includes('.')) return prev;
      return prev + '.';
    });
  }, [waitingForSecondOperand]);

  const handleOperator = useCallback((nextOperator) => {
    setError('');
    const currentValue = Number(displayValue);

    if (firstOperand === null) {
      if (Number.isFinite(currentValue)) {
        setFirstOperand(currentValue);
        setOperator(nextOperator);
        setWaitingForSecondOperand(true);
      }
      return;
    }

    // If operator is chosen again before entering the second operand, just update operator
    if (waitingForSecondOperand) {
      setOperator(nextOperator);
      return;
    }

    // If user changes operator after entering some value but before '=', we only update operator and keep display
    setOperator(nextOperator);
    setWaitingForSecondOperand(true);
  }, [displayValue, firstOperand, waitingForSecondOperand]);

  const handleEquals = useCallback(async () => {
    if (loading) return;
    setError('');

    if (firstOperand === null || !operator) {
      // Nothing to compute
      return;
    }

    const second = Number(displayValue);
    if (!Number.isFinite(second)) {
      setError('Некорректное число');
      return;
    }

    const op = operatorSymbolToOp[operator];
    if (!op) return;

    try {
      setLoading(true);
      const data = await calculate({ a: firstOperand, b: second, op });
      const res = data?.result;
      if (typeof res === 'number' && Number.isFinite(res)) {
        const s = String(res);
        setDisplayValue(s);
        setFirstOperand(res); // allow chaining
        setOperator(null);
        setWaitingForSecondOperand(false);
      } else {
        setError('Ошибка вычисления');
      }
    } catch (e) {
      const apiErr = e?.response?.data;
      let msg = 'Ошибка вычисления';
      if (apiErr) {
        if (typeof apiErr.error === 'string') msg = apiErr.error;
        else if (typeof apiErr.detail === 'string') msg = apiErr.detail;
        else if (typeof apiErr.b === 'string') msg = apiErr.b; // DRF serializer error on b field (e.g., division by zero)
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [displayValue, firstOperand, operator, loading]);

  const handleClear = useCallback(() => {
    setError('');
    setDisplayValue('0');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  }, []);

  const handleDelete = useCallback(() => {
    setError('');
    setDisplayValue((prev) => {
      if (waitingForSecondOperand) {
        setWaitingForSecondOperand(false);
        return '0';
      }
      if (!prev || prev.length <= 1) return '0';
      const sliced = prev.slice(0, prev.length - 1);
      if (sliced === '-' || sliced === '') return '0';
      return sliced;
    });
  }, [waitingForSecondOperand]);

  const press = useCallback((label) => {
    if (label === 'AC') return handleClear();
    if (label === 'DEL') return handleDelete();
    if (label === '=') return handleEquals();
    if (label === '.') return handleDot();
    if (label === '+' || label === '-' || label === '×' || label === '÷') return handleOperator(label);
    // digits
    return handleDigit(String(label));
  }, [handleClear, handleDelete, handleEquals, handleDot, handleOperator, handleDigit]);

  const buttons = useMemo(() => ([
    ['AC', 'DEL', '÷', '×'],
    ['7', '8', '9', '-'],
    ['4', '5', '6', '+'],
    ['1', '2', '3', '='],
    ['0', '.', '=', '='], // we'll make 0 span 2, and single '=' spans 2 to keep grid nice
  ]), []);

  return (
    <section data-easytag="id1-react/src/components/Calculator.jsx" className="w-full max-w-md calculator-wrap rounded-2xl shadow-lg p-5">
      <h1 data-easytag="id2-react/src/components/Calculator.jsx" className="text-white text-2xl font-semibold mb-3">Калькулятор</h1>

      <div data-easytag="id3-react/src/components/Calculator.jsx" className="mb-2 flex items-center justify-between text-sm text-gray-300 min-h-[20px]">
        <div data-easytag="id4-react/src/components/Calculator.jsx" className="opacity-80 select-none">
          {firstOperand !== null && (
            <span data-easytag="id5-react/src/components/Calculator.jsx">{formatNumberString(String(firstOperand))} {operator || ''}</span>
          )}
        </div>
        <div data-easytag="id6-react/src/components/Calculator.jsx" className="text-xs opacity-50 select-none">Серверные вычисления</div>
      </div>

      <div data-easytag="id7-react/src/components/Calculator.jsx" className="mb-2">
        <input
          data-easytag="id8-react/src/components/Calculator.jsx"
          className="display-input w-full text-right text-white placeholder-gray-400 bg-transparent border border-white/10 rounded-xl px-4 py-4 text-3xl focus:outline-none focus:ring-2 focus:ring-indigo-400"
          type="text"
          readOnly
          aria-label="display"
          value={displayValue}
          placeholder="0"
        />
      </div>

      <div data-easytag="id9-react/src/components/Calculator.jsx" aria-live="assertive" className="min-h-[20px] mb-3 text-sm">
        {error ? (
          <p data-easytag="id10-react/src/components/Calculator.jsx" className="text-rose-300">{error}</p>
        ) : (
          <span data-easytag="id11-react/src/components/Calculator.jsx" className="text-transparent">.</span>
        )}
      </div>

      <div data-easytag="id12-react/src/components/Calculator.jsx" className="grid grid-cols-4 gap-2 select-none">
        {buttons.map((row, rIdx) => (
          <React.Fragment key={`row-${rIdx}`}>
            {row.map((label, cIdx) => {
              const key = `btn-${rIdx}-${cIdx}-${label}`;
              const isOp = label === '+' || label === '-' || label === '×' || label === '÷';
              const isAccent = label === '=';
              const isDanger = label === 'AC' || label === 'DEL';
              let extra = '';
              // Layout tweaks
              if (rIdx === 4 && cIdx === 0 && label === '0') extra = 'col-span-2';
              if (rIdx === 4 && (cIdx === 2 || cIdx === 3) && label === '=') extra = '';

              return (
                <button
                  data-easytag={`id13-${key}-react/src/components/Calculator.jsx`}
                  key={key}
                  type="button"
                  disabled={loading && label === '='}
                  onClick={() => press(label)}
                  className={[
                    'btn-ghost rounded-xl px-3 py-4 text-lg font-medium border',
                    'border-white/10 text-white hover:bg-white/10 active:bg-white/20',
                    isOp ? 'bg-slate-700/40' : '',
                    isDanger ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-600 border-rose-500' : '',
                    isAccent ? 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-600 border-indigo-500' : '',
                    (loading && label === '=') ? 'opacity-80 cursor-not-allowed' : '',
                    extra,
                  ].filter(Boolean).join(' ')}
                >
                  {loading && label === '=' ? (
                    <span data-easytag={`id14-${key}-react/src/components/Calculator.jsx`} className="inline-flex items-center gap-2">
                      <span data-easytag={`id15-${key}-react/src/components/Calculator.jsx`} className="spinner-xs" />
                      <span data-easytag={`id16-${key}-react/src/components/Calculator.jsx`}>=</span>
                    </span>
                  ) : (
                    <span data-easytag={`id17-${key}-react/src/components/Calculator.jsx`}>{label}</span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div data-easytag="id18-react/src/components/Calculator.jsx" aria-live="polite" className="sr-only">
        Текущее значение: {displayValue}
      </div>
    </section>
  );
}
