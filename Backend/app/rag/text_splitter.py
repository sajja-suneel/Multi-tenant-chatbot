import re
from typing import List, Dict, Any

class RecursiveCharacterTextSplitter:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100, separators: List[str] = None):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", " ", ""]

    def split_text(self, text: str) -> List[str]:
        """Split a single block of text into chunks recursively."""
        if len(text) <= self.chunk_size:
            return [text]

        # Find the best separator
        separator = self.separators[-1]
        for s in self.separators:
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                break

        # Split text based on separator
        if separator != "":
            splits = text.split(separator)
        else:
            splits = list(text)

        chunks = []
        current_chunk = []
        current_length = 0

        for split in splits:
            split_len = len(split)
            # Handle splits larger than chunk size
            if split_len > self.chunk_size:
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                    current_chunk = []
                    current_length = 0
                
                # Recursively split the long segment
                sub_chunks = self.split_text(split)
                chunks.extend(sub_chunks)
                continue

            if current_length + split_len + (len(separator) if current_chunk else 0) <= self.chunk_size:
                current_chunk.append(split)
                current_length += split_len + (len(separator) if current_chunk else 0)
            else:
                if current_chunk:
                    chunks.append(separator.join(current_chunk))
                
                # Apply overlap by tracing back
                overlap_chunk = []
                overlap_len = 0
                for item in reversed(current_chunk):
                    if overlap_len + len(item) + (len(separator) if overlap_chunk else 0) <= self.chunk_overlap:
                        overlap_chunk.insert(0, item)
                        overlap_len += len(item) + (len(separator) if overlap_chunk else 0)
                    else:
                        break
                
                current_chunk = overlap_chunk
                current_chunk.append(split)
                current_length = sum(len(item) for item in current_chunk) + (len(separator) * (len(current_chunk) - 1))

        if current_chunk:
            chunks.append(separator.join(current_chunk))

        return [c.strip() for c in chunks if c.strip()]

    def split_documents(self, documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Split a list of document pages/sections.
        Input: [{"text": str, "page_number": int}]
        Output: [{"text": str, "page_number": int}]
        """
        all_chunks = []
        for doc in documents:
            text = doc["text"]
            page_number = doc["page_number"]
            chunks = self.split_text(text)
            for chunk in chunks:
                all_chunks.append({
                    "text": chunk,
                    "page_number": page_number
                })
        return all_chunks