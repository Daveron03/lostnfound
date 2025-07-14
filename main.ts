/**
 * Campus Lost & Found Portal
 * Firebase Firestore implementation with modal-based found items view
 */

import { onItems, addItem, markFound } from './data';
import { Item } from './types';

class CampusLostFoundPortal {
  private items: Item[] = [];
  private foundItems: Item[] = [];
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the application and set up event handlers
   */
  private initialize(): void {
    this.setupRealTimeSync();
    this.setupEventListeners();
  }

  /**
   * Set up real-time synchronization with Firebase
   */
  private setupRealTimeSync(): void {
    console.log('🚀 Initializing Firestore real-time listener...');
    this.unsubscribe = onItems((items: Item[]) => {
      console.log('🔄 Items update received:', items.length, 'total items');
      this.items = items;
      this.foundItems = items.filter(item => item.status === 'found');
      console.log('📋 Lost items:', items.filter(item => item.status === 'lost').length);
      console.log('🎯 Found items:', this.foundItems.length);
      this.renderLostItems();
      this.updateFoundBadge();
    });
  }

  /**
   * Set up form submission and modal event listeners
   */
  private setupEventListeners(): void {
    const reportForm = document.getElementById('item-report-form') as HTMLFormElement;
    if (reportForm) {
      reportForm.addEventListener('submit', this.handleFormSubmission.bind(this));
    }

    const foundToggle = document.getElementById('found-toggle');
    if (foundToggle) {
      foundToggle.addEventListener('click', this.openFoundModal.bind(this));
    }

    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
      modalClose.addEventListener('click', this.closeFoundModal.bind(this));
    }

    const modalOverlay = document.getElementById('found-modal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.closeFoundModal();
        }
      });
    }

    // Keyboard accessibility
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeFoundModal();
      }
    });

    // Clean up Firebase listener when page unloads
    window.addEventListener('beforeunload', () => {
      if (this.unsubscribe) {
        this.unsubscribe();
      }
    });
  }

  /**
   * Handle new item form submission
   */
  private async handleFormSubmission(event: Event): Promise<void> {
    event.preventDefault();
    
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const photo = formData.get('photo') as string;

    if (!title?.trim() || !description?.trim()) {
      return;
    }

    try {
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      const originalText = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';

      await addItem({
        title: title.trim(),
        description: description.trim(),
        photo: photo?.trim() || undefined
      });

      form.reset();
      
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    } catch (error) {
      console.error('Error submitting item:', error);
      alert('Failed to submit item. Please try again.');
      
      const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
      submitButton.disabled = false;
      submitButton.textContent = 'Submit Lost Item';
    }
  }

  /**
   * Mark a lost item as found
   */
  private async markItemAsFound(itemId: string): Promise<void> {
    try {
      const button = document.querySelector(`[onclick*="${itemId}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = true;
        button.textContent = 'Marking...';
      }

      await markFound(itemId);
    } catch (error) {
      console.error('Error marking item as found:', error);
      alert('Failed to mark item as found. Please try again.');
      
      const button = document.querySelector(`[onclick*="${itemId}"]`) as HTMLButtonElement;
      if (button) {
        button.disabled = false;
        button.textContent = 'Mark as Found';
      }
    }
  }

  /**
   * Open the found items modal
   */
  private openFoundModal(): void {
    const modal = document.getElementById('found-modal');
    if (modal) {
      modal.classList.add('open');
      this.renderFoundItems();
      
      // Focus management for accessibility
      const closeButton = document.getElementById('modal-close');
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  /**
   * Close the found items modal
   */
  private closeFoundModal(): void {
    const modal = document.getElementById('found-modal');
    if (modal) {
      modal.classList.remove('open');
      
      // Return focus to the bag button
      const foundToggle = document.getElementById('found-toggle');
      if (foundToggle) {
        foundToggle.focus();
      }
    }
  }

  /**
   * Update the found items count badge
   */
  private updateFoundBadge(): void {
    const badge = document.getElementById('found-count-badge');
    if (badge) {
      const count = this.foundItems.length;
      badge.textContent = count > 0 ? count.toString() : '';
    }
  }

  /**
   * Generate placeholder SVG for missing images
   */
  private generateImagePlaceholder(): string {
    return `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm16 2H4v8l4-4 3 3 4-4 5 5V6zM8 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
      </svg>
    `;
  }

  /**
   * Format timestamp for display
   */
  private formatTimestamp(date: Date): string {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Sanitize text content to prevent XSS
   */
  private sanitizeText(text: string): string {
    const tempElement = document.createElement('div');
    tempElement.textContent = text;
    return tempElement.innerHTML;
  }

  /**
   * Generate HTML for a single item card
   */
  private generateItemCardHTML(item: Item, showFoundButton: boolean = true): string {
    const imageContent = item.photo 
      ? `<img src="${item.photo}" alt="${item.title}" class="item-image" 
              onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
      : '';
    
    const placeholderContent = !item.photo 
      ? `<div class="image-placeholder">${this.generateImagePlaceholder()}</div>`
      : `<div class="image-placeholder" style="display: none;">${this.generateImagePlaceholder()}</div>`;

    const actionButton = (item.status === 'lost' && showFoundButton)
      ? `<button class="action-btn" onclick="portalApp.markAsFound('${item.id}')">Mark as Found</button>`
      : '';

    return `
      <div class="item-card">
        <div class="item-header">
          <h3 class="item-title">${this.sanitizeText(item.title)}</h3>
          <span class="item-timestamp">${this.formatTimestamp(item.createdAt)}</span>
        </div>
        
        <p class="item-description">${this.sanitizeText(item.description)}</p>
        
        ${imageContent}
        ${placeholderContent}
        
        <div class="item-actions">
          ${actionButton}
        </div>
      </div>
    `;
  }

  /**
   * Render lost items in the main container
   */
  private renderLostItems(): void {
    console.log('🎨 Rendering lost items...');
    const lostItems = this.items.filter(item => item.status === 'lost');
    const lostContainer = document.getElementById('lost-items-container');

    if (!lostContainer) {
      console.error('❌ Lost items container not found!');
      return;
    }

    console.log('📝 Rendering', lostItems.length, 'lost items to DOM');
    
    if (lostItems.length === 0) {
      lostContainer.innerHTML = '<div class="empty-message">No missing items reported yet</div>';
    } else {
      lostContainer.innerHTML = lostItems
        .map(item => this.generateItemCardHTML(item, true))
        .join('');
    }
  }

  /**
   * Render found items in the modal
   */
  private renderFoundItems(): void {
    const foundContainer = document.getElementById('found-items-container');

    if (foundContainer) {
      if (this.foundItems.length === 0) {
        foundContainer.innerHTML = '<div class="empty-message">No items have been recovered yet</div>';
      } else {
        foundContainer.innerHTML = this.foundItems
          .map(item => this.generateItemCardHTML(item, false))
          .join('');
      }
    }
  }

  /**
   * Public method to mark item as found (called from onclick handlers)
   */
  public markAsFound(itemId: string): void {
    this.markItemAsFound(itemId);
  }

  // TODO: Implement search and filtering functionality
  // public filterItems(searchQuery: string): Item[] {
  //   const query = searchQuery.toLowerCase().trim();
  //   return this.items.filter(item => 
  //     item.title.toLowerCase().includes(query) ||
  //     item.description.toLowerCase().includes(query)
  //   );
  // }

  // TODO: Initialize interactive map with Leaflet
  // private setupInteractiveMap(): void {
  //   // Import Leaflet and create map instance
  //   // Add markers for items with location data
  //   // Handle marker click events
  // }

  // TODO: Request browser notification permissions
  // private setupNotificationPermissions(): void {
  //   if ('Notification' in window && Notification.permission === 'default') {
  //     Notification.requestPermission();
  //   }
  // }

  // TODO: Persist modal open state in sessionStorage
  // private persistModalState(): void {
  //   const modal = document.getElementById('found-modal');
  //   if (modal?.classList.contains('open')) {
  //     sessionStorage.setItem('foundModalOpen', 'true');
  //   } else {
  //     sessionStorage.removeItem('foundModalOpen');
  //   }
  // }

  // TODO: Add keyboard accessibility for modal focus trapping
  // private setupFocusTrap(): void {
  //   // Implement focus trap within modal when open
  //   // Handle Tab and Shift+Tab navigation
  // }
}

// Initialize the application
const portalApp = new CampusLostFoundPortal();

// Expose app instance globally for onclick handlers
(window as any).portalApp = portalApp;
