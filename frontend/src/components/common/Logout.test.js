import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Logout from './Logout';

describe('Logout component', () => {
  it('renders without errors', () => {
    render(<Logout />);
  });

  it('calls handleLogout when "Logout" link is clicked', () => {
    const mockHandleLogout = jest.fn();
    const { getByText } = render(<Logout handleLogout={mockHandleLogout} />);

    fireEvent.click(getByText('Logout'));

    expect(mockHandleLogout).toHaveBeenCalled();
  });
});
