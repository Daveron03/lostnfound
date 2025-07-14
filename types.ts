/**
 * Shared type definitions for Campus Lost & Found Portal
 */

export interface Item {
  id: string;
  title: string;
  description: string;
  photo?: string;
  status: 'lost' | 'found';
  createdAt: Date;
}
