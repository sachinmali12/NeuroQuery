import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface QueryHistoryItem {
  id: number;
  user_prompt: string;
  generated_sql: string;
  database_type: string;
  created_at: string;
  execution_time?: number;
  success_status?: boolean;
}

export interface SavedQueryItem {
  id: number;
  title: string;
  query: string;
  created_at: string;
}

export interface TableColumn {
  column_name: string;
  data_type: string;
}

export interface TableSchema {
  table_name: string;
  columns: TableColumn[];
}

export interface SQLResult {
  columns?: string[];
  data?: Record<string, any>[];
  message?: string;
  row_count?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically append JWT bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('novasql_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const apiService = {
  // Authentication System
  async registerUser(username: string, email: string, password: string): Promise<User> {
    const response = await api.post('/auth/register', { username, email, password });
    return response.data;
  },

  async loginUser(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Generate SQL from Natural Language
  async generateSQL(prompt: string): Promise<{ prompt: string; generated_sql: string }> {
    const response = await api.post('/generate-sql', { prompt });
    return response.data;
  },

  // Execute a generated SQL statement
  async executeSQL(sql: string): Promise<SQLResult> {
    const response = await api.post('/execute_query', { sql });
    return response.data;
  },

  // Get full query history list
  async getQueryHistory(): Promise<QueryHistoryItem[]> {
    const response = await api.get('/query-history');
    return response.data;
  },

  // Delete a specific query by ID
  async deleteQuery(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/query-history/${id}`);
    return response.data;
  },

  // Delete all query history
  async deleteAllQueries(): Promise<{ message: string }> {
    const response = await api.delete('/query-history');
    return response.data;
  },

  // Save a custom query manually (Repurposed for Saved Queries template system compatibility)
  async saveQuery(userPrompt: string, generatedSql: string): Promise<QueryHistoryItem> {
    const response = await api.post('/save-query', {
      title: userPrompt || 'Untitled Query',
      query: generatedSql,
    });
    return response.data;
  },

  // Saved Queries System APIs
  async getSavedQueries(): Promise<SavedQueryItem[]> {
    const response = await api.get('/saved-queries');
    return response.data;
  },

  async saveSavedQuery(title: string, query: string): Promise<SavedQueryItem> {
    const response = await api.post('/save-query', { title, query });
    return response.data;
  },

  async deleteSavedQuery(id: number): Promise<{ message: string }> {
    const response = await api.delete(`/saved-query/${id}`);
    return response.data;
  },

  // AI Copilot Helpers
  async explainQuery(sql: string): Promise<{ explanation: string }> {
    const response = await api.post('/explain-query', { sql });
    return response.data;
  },

  async fixQuery(sql: string): Promise<{ fixed_sql: string; explanation: string }> {
    const response = await api.post('/fix-query', { sql });
    return response.data;
  },

  // Fetch the Database Schema dynamically via execution of system catalog query
  async getDatabaseSchema(): Promise<TableSchema[]> {
    const schemaQuery = `
      SELECT 
        t.table_name, 
        c.column_name, 
        c.data_type 
      FROM 
        information_schema.tables t 
      INNER JOIN 
        information_schema.columns c 
      ON 
        t.table_name = c.table_name 
      WHERE 
        t.table_schema = 'public' 
      ORDER BY 
        t.table_name, 
        c.ordinal_position;
    `;
    
    try {
      const results = await this.executeSQL(schemaQuery);
      if (results.data && Array.isArray(results.data)) {
        const schemaMap: Record<string, TableColumn[]> = {};
        
        results.data.forEach((row) => {
          const tableName = row.table_name;
          const columnName = row.column_name;
          const dataType = row.data_type;
          
          if (!schemaMap[tableName]) {
            schemaMap[tableName] = [];
          }
          
          schemaMap[tableName].push({
            column_name: columnName,
            data_type: dataType,
          });
        });
        
        return Object.entries(schemaMap).map(([table_name, columns]) => ({
          table_name,
          columns,
        }));
      }
      return [];
    } catch (error) {
      console.warn("Failed to fetch database schema. It might be empty or unavailable.", error);
      return [];
    }
  }
};
