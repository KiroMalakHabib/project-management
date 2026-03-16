import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('should render the label text', () => {
    render(<Badge label="Active" />);
    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('should apply gray variant by default', () => {
    const { container } = render(<Badge label="Default" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-gray-100');
    expect(span?.className).toContain('text-gray-600');
  });

  it('should apply blue variant', () => {
    const { container } = render(<Badge label="Info" variant="blue" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-blue-100');
    expect(span?.className).toContain('text-blue-700');
  });

  it('should apply red variant', () => {
    const { container } = render(<Badge label="Error" variant="red" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-red-100');
    expect(span?.className).toContain('text-red-700');
  });

  it('should apply green variant', () => {
    const { container } = render(<Badge label="Success" variant="green" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-green-100');
    expect(span?.className).toContain('text-green-700');
  });

  it('should apply yellow variant', () => {
    const { container } = render(<Badge label="Warning" variant="yellow" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('bg-yellow-100');
    expect(span?.className).toContain('text-yellow-700');
  });

  it('should render as a span element', () => {
    render(<Badge label="Test" />);
    const span = screen.getByText('Test');
    expect(span.tagName).toBe('SPAN');
  });
});
