/**
 * API Service - Connects frontend to backend API
 */

// At runtime this will be replaced by Vite; for type-checking we fall back to window.
// Priority: 1. Environment variable, 2. Window variable, 3. Auto-detect production, 4. Default localhost
const getApiBaseUrl = () => {
  // Check environment variable first (set in .env or Vercel)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) {
    return (import.meta as any).env.VITE_API_URL;
  }

  // Check window variable (for runtime override)
  if (typeof window !== 'undefined' && (window as any).VITE_API_URL) {
    return (window as any).VITE_API_URL;
  }

  // Auto-detect production: if not localhost, use staging backend
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    // If running in Capacitor (mobile app), or explicitly deployed, use production backend
    if (protocol === 'capacitor:' || hostname !== 'localhost' && hostname !== '127.0.0.1' || (window as any).Capacitor) {
      return 'https://chouhan-crm-backend-staging.onrender.com/api/v1';
    }
  }

  // Default to localhost for local development
  return 'http://localhost:5000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        // Extract error message from response
        const errorMessage = error.message || error.error || `API Error: ${response.statusText}`;
        const apiError: any = new Error(errorMessage);
        apiError.status = response.status;
        apiError.response = error;
        throw apiError;
      }

      return response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Leads
  async getLeads() {
    try {
      const response = await this.request<{ success: boolean; leads: any[] }>('/leads');
      return response.leads || [];
    } catch (error) {
      console.error('❌ Error fetching leads:', error);
      throw error;
    }
  }

  async updateLead(id: string, updates: any) {
    const response = await this.request<{ success: boolean; lead: any }>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    // Return the full response so frontend can check success and get the lead
    return response;
  }

  // (updateLead removed as we reverted to local DB updates for now)

  async getWebhookLeads() {
    const response = await this.request<{ success: boolean; leads: any[] }>('/webhooks/leads');
    return response.leads || [];
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; message: string }>('/health');
  }

  // Notifications
  async getNotifications(userId: string, role: string, lastChecked?: string) {
    const params = new URLSearchParams({
      userId,
      role,
      ...(lastChecked && { lastChecked })
    });
    const response = await this.request<{ success: boolean; notifications: any[]; count: number }>(`/notifications?${params}`);
    return response.notifications || [];
  }

  async markNotificationRead(notificationId: string) {
    return this.request<{ success: boolean; notification: any }>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  }

  async deleteNotification(notificationId: string) {
    return this.request<{ success: boolean; message: string }>(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  }

  async deleteLead(leadId: string, role: string) {
    return this.request<{ success: boolean; message: string }>(`/leads/${leadId}?role=${role}`, {
      method: 'DELETE',
    });
  }

  // Users
  async getUsers() {
    try {
      const response = await this.request<{ success: boolean; users: any[] }>('/users');
      return response.users || [];
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  }

  async syncUsers(users: any[]) {
    const response = await this.request<{ success: boolean; synced: number; users: any[] }>('/users/sync', {
      method: 'POST',
      body: JSON.stringify({ users }),
    });
    return response;
  }
}

export const api = new ApiService();



