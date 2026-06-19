from fastapi import APIRouter, File, Form, HTTPException, UploadFile, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.services import auth_service
from app.services.import_service import import_document_to_graph
from app.utils.logger import get_logger
from app.utils.validators import validate_doc_type

logger = get_logger(__name__)
router = APIRouter(tags=["documents"])


class ImportResponse(BaseModel):
    doc_id: str
    chunks_created: int
    status: str
    summary: str | None = None
    raw_text: str | None = Field(default=None, alias="rawText")
    extracted_title: str | None = Field(default=None, alias="extractedTitle")
    extracted_document_number: str | None = Field(default=None, alias="extractedDocumentNumber")
    extracted_issued_date: str | None = Field(default=None, alias="extractedIssuedDate")
    extracted_effective_date: str | None = Field(default=None, alias="extractedEffectiveDate")

    class Config:
        populate_by_name = True


class DocumentItemResponse(BaseModel):
    id: str
    fileName: str = Field(..., alias="fileName")
    filePages: int | None = Field(..., alias="filePages")
    fileUrl: str = Field(..., alias="fileUrl")
    previewImageUrl: str | None = Field(..., alias="previewImageUrl")
    summary: str | None = Field(..., alias="summary")
    chatId: str | None = Field(..., alias="chatId")
    createdAt: str = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True


@router.post("/import", response_model=ImportResponse)
async def import_document(
    file: UploadFile = File(...),
    doc_type: str = Form("luat"),
    legal_domain: str | None = Form(default=None),
    client_id: str | None = Form(default=None, alias="clientId"),
) -> ImportResponse:
    if not validate_doc_type(doc_type):
        raise HTTPException(status_code=400, detail="Invalid doc_type")

    file_bytes = await file.read()
    result = await import_document_to_graph(
        file_bytes=file_bytes,
        filename=file.filename or "document.pdf",
        doc_type=doc_type,
        legal_domain=legal_domain,
        client_id=client_id,
    )

    if result.get("error"):
        logger.warning("import_store_warning", warning=result["error"])

    logger.info("import_completed", doc_id=result.get("doc_id"), chunks=result.get("chunks_created"))
    return ImportResponse(
        doc_id=result.get("doc_id", "unknown"),
        chunks_created=int(result.get("chunks_created", 0)),
        status=result.get("status", "success"),
        summary=result.get("summary"),
        rawText=result.get("raw_text"),
        extractedTitle=result.get("extracted_title"),
        extractedDocumentNumber=result.get("extracted_document_number"),
        extractedIssuedDate=result.get("extracted_issued_date"),
        extractedEffectiveDate=result.get("extracted_effective_date"),
    )


@router.get("/documents", response_model=list[DocumentItemResponse])
def get_user_documents(
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> list[DocumentItemResponse]:
    """Fetch all documents belonging to the authenticated user."""
    db_docs = (
        db.query(models.Document)
        .filter(models.Document.user_id == current_user.id)
        .order_by(models.Document.created_at.desc())
        .all()
    )
    
    return [
        DocumentItemResponse(
            id=doc.id,
            fileName=doc.filename,
            filePages=doc.pages,
            fileUrl=doc.file_url,
            previewImageUrl=doc.preview_image_url,
            summary=doc.summary,
            chatId=doc.chat_id,
            createdAt=doc.created_at.strftime("%Y-%m-%d %H:%M"),
        )
        for doc in db_docs
    ]


@router.delete("/documents/{doc_id}")
def delete_user_document(
    doc_id: str,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document record from database."""
    doc = (
        db.query(models.Document)
        .filter(models.Document.id == doc_id, models.Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    db.delete(doc)
    db.commit()
    return {"status": "success"}


@router.put("/documents/{doc_id}/link")
def link_document_to_chat(
    doc_id: str,
    chat_id: str | None = None,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Link an uploaded document to a specific chat session."""
    doc = (
        db.query(models.Document)
        .filter(models.Document.id == doc_id, models.Document.user_id == current_user.id)
        .first()
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if chat_id:
        chat = db.query(models.Chat).filter(
            models.Chat.id == chat_id,
            models.Chat.user_id == current_user.id
        ).first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        doc.chat_id = chat_id
    else:
        doc.chat_id = None
        
    db.commit()
    return {"status": "success"}


