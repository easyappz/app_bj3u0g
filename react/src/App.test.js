import { render, screen } from '@testing-library/react';
import App from './App';

test('renders calculator title', () => {
  render(<App />);
  const title = screen.getByText(/Калькулятор/i);
  expect(title).toBeInTheDocument();
});
