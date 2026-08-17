import { User, Document, Source } from "../types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
}

export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorText = await response.text();
      const errorData = errorText ? JSON.parse(errorText) : null;
      errorMessage = errorData?.detail || errorData?.message || errorMessage;
    } catch (err) { // Corrected catch parameters here
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  // Safely parse JSON only if response body is not empty
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const api = {
  getAuthToken,
  setAuthToken,
  logout: () => {
    removeAuthToken();
  },

  login: async (credentialsOrEmail: { email: string; password: string } | string, passwordParam?: string) => {
    let email = "";
    let password = "";
    if (typeof credentialsOrEmail === "object") {
      email = credentialsOrEmail.email;
      password = credentialsOrEmail.password;
    } else {
      email = credentialsOrEmail;
      password = passwordParam || "";
    }

    const data = await request<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      setAuthToken(data.access_token);
    }
    return data;
  },

  registerCompany: async (
    dataOrName: { company_name: string; admin_name?: string; email: string; password: string } | string,
    adminEmailParam?: string,
    passwordParam?: string
  ) => {
    let body = {};
    if (typeof dataOrName === "object") {
      body = dataOrName;
    } else {
      body = {
        company_name: dataOrName,
        admin_email: adminEmailParam,
        password: passwordParam,
      };
    }
    return request("/auth/register-company", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  getMe: async (): Promise<User> => {
    return request<User>("/auth/me");
  },

  getUsers: async (): Promise<User[]> => {
    return request<User[]>("/users");
  },

  createUser: async (
    dataOrEmail: { email: string; password: string; role: "employee" | "admin" } | string,
    passwordParam?: string,
    roleParam?: "employee" | "admin"
  ): Promise<User> => {
    let body = {};
    if (typeof dataOrEmail === "object") {
      body = dataOrEmail;
    } else {
      body = { email: dataOrEmail, password: passwordParam, role: roleParam };
    }
    return request<User>("/auth/register-user", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  registerUser: async (
    dataOrEmail: { email: string; password: string; role: "employee" | "admin" } | string,
    passwordParam?: string,
    roleParam?: "employee" | "admin"
  ): Promise<User> => {
    let body = {};
    if (typeof dataOrEmail === "object") {
      body = dataOrEmail;
    } else {
      body = { email: dataOrEmail, password: passwordParam, role: roleParam };
    }
    return request<User>("/auth/register-user", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  deleteUser: async (userId: string): Promise<void> => {
    return request<void>(`/users/${userId}`, {
      method: "DELETE",
    });
  },

  uploadDocument: async (filesInput: File | File[] | FileList): Promise<any> => {
    const formData = new FormData();
    if (typeof window !== "undefined" && filesInput instanceof FileList) {
      Array.from(filesInput).forEach((f) => formData.append("files", f));
    } else if (Array.isArray(filesInput)) {
      filesInput.forEach((f) => formData.append("files", f));
    } else {
      formData.append("files", filesInput as File);
    }
    return request("/documents/upload", {
      method: "POST",
      body: formData,
    });
  },

  getDocuments: async (): Promise<Document[]> => {
    return request<Document[]>("/documents");
  },

  deleteDocument: async (docId: string): Promise<void> => {
    return request<void>(`/documents/${docId}`, {
      method: "DELETE",
    });
  },

  chat: async (question: string, sessionId?: string): Promise<{ answer: string; sources?: Source[] }> => {
    try {
      return await request<{ answer: string; sources?: Source[] }>("/chat/query", {
        method: "POST",
        body: JSON.stringify({ question, session_id: sessionId }),
      });
    } catch {
      return await request<{ answer: string; sources?: Source[] }>("/chat", {
        method: "POST",
        body: JSON.stringify({ question, session_id: sessionId }),
      });
    }
  },

  getChatHistory: async (): Promise<any[]> => {
    return request<any[]>("/chat/history");
  },

  clearChatHistory: async (): Promise<void> => {
    return request<void>("/chat/history", {
      method: "DELETE",
    });
  },

  deleteChatSession: async (sessionId: string): Promise<void> => {
    return request<void>(`/chat/history/session/${sessionId}`, {
      method: "DELETE",
    });
  },
};

export default api;