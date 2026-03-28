import { UploadCloud, File, Loader2 } from "lucide-react";
import React, { useState, useRef } from "react";

interface UploadZoneProps {
  onUploadComplete: (data: any) => void;
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Server returned non-JSON response:", text);
        throw new Error(`Server returned invalid response (Status: ${response.status})`);
      }

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }
      
      onUploadComplete({ ...data, filename: file.name });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      if (error.name === "AbortError") {
        alert("Analyzing took too long (exceeded 30 seconds). Please try again with a smaller document or when the AI is less busy.");
      } else {
        alert(`Failed to upload and analyze file: ${error.message || "Unknown error"}`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Analyze Documents with AI</h2>
        <p className="text-gray-500">Upload your PDF, DOCX, TXT, or PPT files to get instant insights.</p>
      </div>

      <div
        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer ${
          isDragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 bg-white"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,.txt,.ppt,.pptx"
          onChange={handleFileSelect}
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-lg font-medium text-gray-900">Analyzing document...</p>
            <p className="text-sm text-gray-500 mt-1">Extracting insights and generating summary</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <UploadCloud className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mb-1">Click to upload or drag and drop</p>
            <p className="text-sm text-gray-500">PDF, DOCX, TXT, PPT (max. 10MB)</p>
          </div>
        )}
      </div>
    </div>
  );
}
