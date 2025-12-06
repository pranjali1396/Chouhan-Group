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
    // If deployed (not localhost), use Render staging backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
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



