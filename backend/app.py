import os
import re
import json
from typing import List, Optional, Any, Literal
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load .env from project root
env_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="MedTrace AI Document Processing API",
    description="Extracts clinical data from medical documents using Google Gemini and Supabase",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DocumentType = Literal[
    'LAB_REPORT',
    'PRESCRIPTION',
    'IMAGING_REPORT',
    'DISCHARGE_SUMMARY',
    'CONSULTATION',
    'MEDICAL_CERTIFICATE',
    'OTHER'
]

class LabResultItem(BaseModel):
    testName: str
    value: str
    unit: str
    referenceRange: str
    status: str

class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str
    duration: str
    instructions: str

class AIProcessingResponse(BaseModel):
    documentType: DocumentType
    hospital: Optional[str] = None
    doctor: Optional[str] = None
    department: Optional[str] = None
    date: Optional[str] = None  # Format: YYYY-MM-DD
    patientName: Optional[str] = None
    summary: str
    labResults: List[LabResultItem] = Field(default_factory=list)
    medications: List[MedicationItem] = Field(default_factory=list)
    findings: List[Any] = Field(default_factory=list)

class ProcessDocumentRequest(BaseModel):
    recordId: str
    filePath: str

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "MedTrace AI Processing API (FastAPI)",
        "model": os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
        "geminiConfigured": bool(os.getenv("GEMINI_API_KEY")),
        "supabaseConfigured": bool(os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")),
    }

@app.post("/process-document", response_model=AIProcessingResponse)
async def process_document(request: ProcessDocumentRequest):
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    if not gemini_api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not set. Please add it to your .env file."
        )

    # 1. Download file from Supabase Storage
    try:
        from supabase import create_client
        supabase = create_client(supabase_url, supabase_key)
        response = supabase.storage.from_("medical-records").download(request.filePath)
        file_bytes = response
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Failed to download document '{request.filePath}' from Supabase Storage: {str(e)}"
        )

    # Determine MIME type
    ext = Path(request.filePath).suffix.lower()
    mime_map = {
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
    }
    mime_type = mime_map.get(ext, "application/pdf")

    # 2. Extract with Google Gemini
    try:
        import google.generativeai as genai
        genai.configure(api_key=gemini_api_key)
        model_name = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
        model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={"response_mime_type": "application/json", "temperature": 0.1}
        )

        prompt = """You are a clinical document AI specialist for "MedTrace", a patient medical record tracking system.
Extract key medical data from this document strictly adhering to the specified schema.

CRITICAL INSTRUCTIONS:
1. documentType must be strictly one of: 'LAB_REPORT', 'PRESCRIPTION', 'IMAGING_REPORT', 'DISCHARGE_SUMMARY', 'CONSULTATION', 'MEDICAL_CERTIFICATE', 'OTHER'.
2. Null Safety: If a field is not present (hospital, doctor, department, date, patientName), return JSON null. NEVER return "N/A", "Unknown", or "Not found".
3. Date: Must be strictly "YYYY-MM-DD" or null.
4. Summary: Write a clear, empathetic, patient-friendly explanation. If lab report, explain out-of-range metrics in simple terms.
5. labResults: [{ "testName": "...", "value": "...", "unit": "...", "referenceRange": "...", "status": "..." }]
6. medications: [{ "name": "...", "dosage": "...", "frequency": "...", "duration": "...", "instructions": "..." }]
7. findings: list of clinical findings.

Return ONLY a valid JSON object matching the schema."""

        doc_part = {"mime_type": mime_type, "data": file_bytes}
        result = model.generate_content([doc_part, prompt])
        data = json.loads(result.text)

        # Sanitize nulls & dates
        for field in ["hospital", "doctor", "department", "patientName"]:
            val = data.get(field)
            if val and str(val).lower() in ["n/a", "na", "none", "unknown", "not found", "not specified"]:
                data[field] = None

        if data.get("date"):
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", str(data["date"])):
                data["date"] = None

        return AIProcessingResponse(**data)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI extraction failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
