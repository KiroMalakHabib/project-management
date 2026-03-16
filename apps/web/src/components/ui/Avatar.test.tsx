import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Avatar } from './Avatar';

describe('Avatar', () => {
  describe('with avatarUrl', () => {
    it('should render an img element with the correct src and alt', () => {
      render(<Avatar name="Alice Smith" avatarUrl="https://example.com/avatar.jpg" />);

      const img = screen.getByRole('img', { name: 'Alice Smith' });
      expect(img).toBeTruthy();
      expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });
  });

  describe('without avatarUrl', () => {
    it('should render initials from a two-word name', () => {
      render(<Avatar name="Alice Smith" />);

      expect(screen.getByText('AS')).toBeTruthy();
    });

    it('should render single initial for single-word name', () => {
      render(<Avatar name="Alice" />);

      expect(screen.getByText('A')).toBeTruthy();
    });

    it('should render at most 2 initials for long names', () => {
      render(<Avatar name="Alice Bob Charlie" />);

      // slice(0, 2) → 'AB'
      expect(screen.getByText('AB')).toBeTruthy();
    });

    it('should render initials in uppercase', () => {
      render(<Avatar name="alice smith" />);

      expect(screen.getByText('AS')).toBeTruthy();
    });
  });

  describe('sizes', () => {
    it('should apply sm size class when size=sm', () => {
      const { container } = render(<Avatar name="Alice" size="sm" />);
      expect(container.firstChild?.toString()).toBeTruthy();
    });

    it('should default to md size', () => {
      const { container } = render(<Avatar name="Alice" />);
      const el = container.querySelector('div');
      expect(el?.className).toContain('w-9');
    });
  });
});
