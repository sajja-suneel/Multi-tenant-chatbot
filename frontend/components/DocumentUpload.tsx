"use client";

import React, { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Document } from "../types";
import api from "../services/api";

export default function DocumentUpload() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchDocuments = async () => {
        try {
            setLoadingDocs(true);
            const docs = await api.getDocuments();
            setDocuments(docs);
        } catch (err: any) {
            setError(err.message || "Failed to load documents.");
        } finally {
            setLoadingDocs(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        setError("");
        setSuccess("");

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processUpload(e.dataTransfer.files);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setSuccess("");
        if (e.target.files && e.target.files.length > 0) {
            await processUpload(e.target.files);
        }
    };

    const processUpload = async (files: FileList | File[]) => {
        setUploading(true);
        try {
            const response = await api.uploadDocument(files);
            let msg = "";
            if (response.total_uploaded !== undefined) {
                msg = `Successfully indexed ${response.total_uploaded} document(s) into RAG memory (${response.chunks_count} total chunks created).`;
                if (response.total_failed > 0) {
                    msg += ` Skipped ${response.total_failed} duplicate file(s).`;
                }
                setSuccess(msg);
            } else if (response.document_name) {
                setSuccess(`Successfully indexed "${response.document_name}" into RAG memory (${response.chunks_count} chunks created).`);
            } else {
                setSuccess("Successfully uploaded and indexed document(s).");
            }
            fetchDocuments();
        } catch (err: any) {
            setError(err.message || "Failed to upload and index document(s).");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentId: string) => {
        setError("");
        setSuccess("");
        try {
            await api.deleteDocument(documentId);
            setSuccess("Document and matching vectors deleted successfully.");
            // Pull fresh data from MongoDB Atlas to ensure perfect UI sync
            await fetchDocuments();
        } catch (err: any) {
            setError(err.message || "Failed to delete document.");
        }
    };

    const formatBytes = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    return (
        <div className="space-y-6">
            {/* Upload Drag Target */}
            <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all duration-200 ${dragActive
                        ? "border-indigo-500 bg-indigo-500/5"
                        : "border-gray-800 bg-gray-900/20 hover:border-gray-700"
                    }`}
            >
                <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.tiff,.bmp"
                    multiple
                    className="hidden"
                    disabled={uploading}
                />

                {uploading ? (
                    <div className="flex flex-col items-center py-4 space-y-3">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-sm font-semibold text-white">Extracting text & generating embeddings...</p>
                        <p className="text-xs text-gray-400">This may take a moment depending on file size.</p>
                    </div>
                ) : (
                    <label
                        htmlFor="file-upload"
                        className="flex flex-col items-center cursor-pointer py-4 space-y-3 text-center"
                    >
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-750 text-gray-400">
                            <Upload className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-white">
                                Drag and drop your company policies here, or <span className="text-indigo-400 hover:text-indigo-300">browse</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Supports PDF, DOCX, TXT, MD up to 10MB</p>
                        </div>
                    </label>
                )}
            </div>

            {/* Operation Feedback */}
            {error && (
                <div className="flex items-center space-x-3 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}
            {success && (
                <div className="flex items-center space-x-3 p-4 bg-emerald-950/20 border border-emerald-900/40 rounded-xl text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

            {/* Uploaded Documents List */}
            <div className="bg-gray-900/50 border border-gray-850 rounded-2xl overflow-hidden shadow-xl">
                <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/80 flex justify-between items-center">
                    <h3 className="font-bold text-white text-sm">Company Document Memory</h3>
                    <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full font-semibold">
                        {documents.length} Files
                    </span>
                </div>

                {loadingDocs ? (
                    <div className="flex justify-center items-center py-10">
                        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center py-12 text-center space-y-2">
                        <FileText className="w-10 h-10 text-gray-600" />
                        <p className="text-sm font-semibold text-gray-400">No policy documents uploaded yet.</p>
                        <p className="text-xs text-gray-500">Upload policies above to train the chatbot.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse text-gray-300">
                            <thead>
                                <tr className="bg-gray-950/25 border-b border-gray-850 text-gray-400 text-xs font-semibold tracking-wider">
                                    <th className="px-6 py-3.5">Filename</th>
                                    <th className="px-6 py-3.5">File Size</th>
                                    <th className="px-6 py-3.5">Uploaded At</th>
                                    <th className="px-6 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-850">
                                {documents.map(doc => (
                                    <tr key={doc.document_id || doc.document_name} className="hover:bg-gray-900/20 transition-colors">
                                        <td className="px-6 py-4 flex items-center space-x-3">
                                            <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                                            <span className="font-medium text-white truncate max-w-[220px]" title={doc.document_name}>
                                                {doc.document_name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {formatBytes(doc.file_size || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-400">
                                            {doc.uploaded_at ? (
                                                <>
                                                    {new Date(doc.uploaded_at).toLocaleDateString()}{" "}
                                                    {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </>
                                            ) : (
                                                "Unknown"
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(doc.document_id || "")}
                                                className="p-2 hover:bg-red-950/30 text-gray-500 hover:text-red-400 rounded-lg transition-colors inline-flex"
                                                title="Delete Document & Vectors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}