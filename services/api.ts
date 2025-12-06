/**
 * API Service - Connects frontend to backend API
 */

// At runtime this will be replaced by Vite; for type-checking we fall back to window.
const API_BASE_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  (typeof window !== 'undefined' && (window as any).VITE_API_URL) ||
  'http://localhost:5000/api/v1';

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
        throw new Error(error.error || `API Error: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Leads
  async getLeads() {
    const response = await this.request<{ success: boolean; leads: any[] }>('/leads');
    return response.leads || [];
  }

  async updateLead(id: string, updates: any) {
    const response = await this.request<{ success: boolean; lead: any }>(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return response.lead;
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
}

export const api = new ApiService();



