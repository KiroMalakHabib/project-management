export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'Low', color: 'text-gray-500', dot: 'bg-gray-400' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600', dot: 'bg-blue-500' },
  HIGH: { label: 'High', color: 'text-orange-600', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', color: 'text-red-600', dot: 'bg-red-500' },
};
