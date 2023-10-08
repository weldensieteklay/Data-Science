import React from 'react';
import { render } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary component', () => {
  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <div>Child component content</div>
      </ErrorBoundary>
    );

    expect(getByText('Child component content')).toBeInTheDocument();
  });

  it('renders an error message when an error occurs', () => {
    const errorMock = new Error('Test error');
    const ThrowErrorComponent = () => {
      throw errorMock;
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowErrorComponent />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong!')).toBeInTheDocument();
  });
});
