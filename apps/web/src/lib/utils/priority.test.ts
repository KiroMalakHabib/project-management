import { describe, it, expect } from 'vitest';
import { priorityConfig, type Priority } from './priority';

describe('priorityConfig', () => {
  const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

  it('should define config for all priority levels', () => {
    priorities.forEach((p) => {
      expect(priorityConfig[p]).toBeDefined();
      expect(priorityConfig[p].label).toBeTruthy();
      expect(priorityConfig[p].color).toBeTruthy();
      expect(priorityConfig[p].dot).toBeTruthy();
    });
  });

  it('should have correct labels', () => {
    expect(priorityConfig.LOW.label).toBe('Low');
    expect(priorityConfig.MEDIUM.label).toBe('Medium');
    expect(priorityConfig.HIGH.label).toBe('High');
    expect(priorityConfig.URGENT.label).toBe('Urgent');
  });

  it('should use red for URGENT', () => {
    expect(priorityConfig.URGENT.color).toContain('red');
    expect(priorityConfig.URGENT.dot).toContain('red');
  });

  it('should use gray for LOW', () => {
    expect(priorityConfig.LOW.color).toContain('gray');
    expect(priorityConfig.LOW.dot).toContain('gray');
  });
});
