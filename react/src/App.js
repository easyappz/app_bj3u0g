import React from 'react';
import ErrorBoundary from './ErrorBoundary';
import './App.css';
import Calculator from './components/Calculator';

function App() {
  return (
    <ErrorBoundary>
      <div data-easytag="id1-react/src/App.js" className="min-h-screen w-full flex items-center justify-center px-4">
        <main data-easytag="id2-react/src/App.js" role="application" aria-label="Приложение калькулятор" className="w-full flex items-center justify-center">
          <Calculator />
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
