import { LocationPresence as ILocationPresence } from 'bring-back-shared';

export class LocationPresence implements ILocationPresence {
  id: string;
  userId: string;
  locationId: string;
  checkedInAt: Date;
  checkedOutAt?: Date;
  isActive: boolean;

  constructor(data: Partial<ILocationPresence>) {
    this.id = data.id || '';
    this.userId = data.userId || '';
    this.locationId = data.locationId || '';
    this.checkedInAt = data.checkedInAt || new Date();
    this.checkedOutAt = data.checkedOutAt;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
  }

  /**
   * Check out user from location
   */
  checkOut(): void {
    this.checkedOutAt = new Date();
    this.isActive = false;
  }

  /**
   * Get duration of presence in minutes
   */
  getDurationMinutes(): number | null {
    const endTime = this.checkedOutAt || new Date();
    return Math.floor((endTime.getTime() - this.checkedInAt.getTime()) / (1000 * 60));
  }

  /**
   * Check if presence is currently active
   */
  isCurrentlyActive(): boolean {
    return this.isActive && !this.checkedOutAt;
  }

  /**
   * Check if presence was active within specified minutes
   */
  wasActiveWithin(minutes: number): boolean {
    if (this.isActive) return true;
    
    if (!this.checkedOutAt) return false;
    
    const minutesAgo = new Date(Date.now() - minutes * 60 * 1000);
    return this.checkedOutAt > minutesAgo;
  }

  /**
   * Get formatted duration string
   */
  getFormattedDuration(): string {
    const duration = this.getDurationMinutes();
    if (duration === null) return 'Unknown';
    
    if (duration < 60) {
      return `${duration} minutes`;
    } else {
      const hours = Math.floor(duration / 60);
      const remainingMinutes = duration % 60;
      return `${hours}h ${remainingMinutes}m`;
    }
  }
}