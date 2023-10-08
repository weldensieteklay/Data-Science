import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<App />);
    const appTitle = getByText('My App');
    expect(appTitle).toBeInTheDocument();
  });
});
