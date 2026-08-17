export interface User {
  id?: string;
  user_id?: string;
  email: string;
  role: "admin" | "employee";
  company?: string;
  tenant_id?: string;
  created_at?: string;
}

export interface Source {
  document_name?: string;
  text?: string;
  score?: number;
  page_number?: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  timestamp: Date | string;
}

export interface Document {
  id?: string;
  document_id?: string;
  filename?: string;
  document_name?: string;
  status?: "processed" | "processing" | "failed" | string;
  created_at?: string;
  uploaded_at?: string;
  size_bytes?: number;
  file_size?: number;
}
