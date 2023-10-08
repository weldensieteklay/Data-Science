import React from 'react';
import { render } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage Component', () => {
  test('renders without crashing', () => {
    const { getByText } = render(<HomePage />);
    const welcomeText = getByText('Welcome to Our Website');
    expect(welcomeText).toBeInTheDocument();
  });
});
