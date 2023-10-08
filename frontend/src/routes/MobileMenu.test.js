import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MobileMenu from './MobileMenu';

describe('MobileMenu component', () => {
  it('renders without errors', () => {
    render(<MobileMenu open={true} onClose={() => {}} />);
  });

  it('calls onClose when a menu item is clicked', () => {
    const mockOnClose = jest.fn();
    const { getByText } = render(<MobileMenu open={true} onClose={mockOnClose} />);

    fireEvent.click(getByText('Home'));

    expect(mockOnClose).toHaveBeenCalled();
  });
});
