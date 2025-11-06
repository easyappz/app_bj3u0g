import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

jest.mock('./api/calc', () => ({
  fetchStats: jest.fn(() => Promise.resolve({ date: '2025-01-01', today_count: 5 })),
  computeExpression: jest.fn((expression) => Promise.resolve({ expression, result: 3 }))
}));

import { fetchStats, computeExpression } from './api/calc';

test('renders calculator title and stats', async () => {
  render(<App />);
  expect(screen.getByText('Калькулятор')).toBeInTheDocument();
  await waitFor(() => expect(fetchStats).toHaveBeenCalled());
  expect(await screen.findByText(/Сегодня вычислений: 5/)).toBeInTheDocument();
});

test('inputs digits and computes result on =', async () => {
  render(<App />);
  const one = screen.getByRole('button', { name: '1' });
  const plus = screen.getByRole('button', { name: '+' });
  const two = screen.getByRole('button', { name: '2' });
  const equal = screen.getByRole('button', { name: '=' });

  await userEvent.click(one);
  await userEvent.click(plus);
  await userEvent.click(two);

  const display = screen.getByLabelText('display');
  expect(display).toHaveValue('1+2');

  await userEvent.click(equal);
  await waitFor(() => expect(computeExpression).toHaveBeenCalledWith('1+2'));
  await waitFor(() => expect(display).toHaveValue('3'));
});
