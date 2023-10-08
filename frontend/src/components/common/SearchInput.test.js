import React from 'react';
import { render } from '@testing-library/react';
import SearchInput from './SearchInput';

describe('SearchInput Component', () => {
  test('renders without crashing', () => {
    const { getByLabelText } = render(<SearchInput />);
    const searchInput = getByLabelText('Search');
    expect(searchInput).toBeInTheDocument();
  });
});
