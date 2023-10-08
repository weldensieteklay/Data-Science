import React from 'react';
import { render } from '@testing-library/react';
import Profile from './Profile';

describe('Profile Component', () => {
  test('renders without crashing', () => {
    const { getByAltText } = render(<Profile />);
    const profileImage = getByAltText('Your Name');
    expect(profileImage).toBeInTheDocument();
  });
});
