import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import models
from app.db.session import get_db
from app.services import auth_service
from app.services.chat_service import generate_simple_reply
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter(tags=["chat"])


# Request & Response Schemas
class SimpleChatRequest(BaseModel):
    prompt: str = Field(min_length=1)


class SimpleChatResponse(BaseModel):
    answer: str
    latency_ms: int


class FolderCreate(BaseModel):
    id: str
    name: str


class FolderResponse(BaseModel):
    id: str
    name: str
    chatIds: list[str] = Field(default_factory=list, alias="chatIds")

    class Config:
        populate_by_name = True


class ChatCreate(BaseModel):
    id: str
    title: str
    folder_id: str | None = Field(default=None, alias="folderId")

    class Config:
        populate_by_name = True


class ChatUpdate(BaseModel):
    title: str | None = Field(default=None)
    folder_id: str | None = Field(default=None, alias="folderId")

    class Config:
        populate_by_name = True



class ChatResponse(BaseModel):
    id: str
    title: str
    updatedAt: str = Field(..., alias="updatedAt")
    folderId: str | None = Field(default=None, alias="folderId")

    class Config:
        populate_by_name = True


class CitationSchema(BaseModel):
    article_ref: str | None = None
    doc_title: str | None = None
    content: str | None = None
    score: float = 0.0


class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    createdAt: str = Field(..., alias="createdAt")
    citations: list[CitationSchema] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class DocumentResponse(BaseModel):
    fileName: str = Field(..., alias="fileName")
    filePages: int | None = Field(..., alias="filePages")
    fileUrl: str = Field(..., alias="fileUrl")
    previewImageUrl: str | None = Field(..., alias="previewImageUrl")
    summary: str | None = Field(..., alias="summary")

    class Config:
        populate_by_name = True


class WorkspaceDataResponse(BaseModel):
    workspaceName: str
    documentTitle: str
    folders: list[FolderResponse]
    chats: list[ChatResponse]
    messagesByChat: dict[str, list[MessageResponse]]
    documentsByChat: dict[str, DocumentResponse] = Field(default_factory=dict, alias="documentsByChat")
    quickPrompts: list[str]
    domainOptions: list[str]

    class Config:
        populate_by_name = True


# Endpoints
@router.post("/chat/simple", response_model=SimpleChatResponse)
async def simple_chat(payload: SimpleChatRequest) -> SimpleChatResponse:
    import time
    t0 = time.perf_counter()
    try:
        answer = await generate_simple_reply(payload.prompt)
    except Exception as exc:
        logger.error("simple_chat_failed", error=str(exc))
        raise HTTPException(status_code=502, detail=f"Simple chat provider unavailable: {str(exc)}") from exc

    latency_ms = int((time.perf_counter() - t0) * 1000)
    return SimpleChatResponse(answer=answer, latency_ms=latency_ms)


@router.get("/workspace", response_model=WorkspaceDataResponse)
def get_workspace(
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> WorkspaceDataResponse:
    # 1. Fetch Folders
    db_folders = db.query(models.ChatFolder).filter(models.ChatFolder.user_id == current_user.id).all()
    
    # 2. Fetch Chats
    db_chats = db.query(models.Chat).filter(models.Chat.user_id == current_user.id).order_by(models.Chat.updated_at.desc()).all()

    # Organize chat IDs into folders
    folder_chats_map: dict[str, list[str]] = {folder.id: [] for folder in db_folders}
    for chat in db_chats:
        if chat.folder_id in folder_chats_map:
            folder_chats_map[chat.folder_id].append(chat.id)

    folders_response = [
        FolderResponse(id=folder.id, name=folder.name, chatIds=folder_chats_map[folder.id])
        for folder in db_folders
    ]

    chats_response = [
        ChatResponse(
            id=chat.id,
            title=chat.title,
            updatedAt=chat.updated_at.strftime("%H:%M"),
            folderId=chat.folder_id
        )
        for chat in db_chats
    ]

    # 3. Bulk-fetch latest document per chat (1 query instead of N)
    chat_ids = [c.id for c in db_chats]
    documents_by_chat: dict[str, DocumentResponse] = {}
    latest_document_title = "Municipal Bylaw No. 2024-15"

    if chat_ids:
        all_docs = (
            db.query(models.Document)
            .filter(models.Document.chat_id.in_(chat_ids))
            .order_by(models.Document.created_at.desc())
            .all()
        )
        seen: set[str] = set()
        for doc in all_docs:
            if doc.chat_id and doc.chat_id not in seen:
                seen.add(doc.chat_id)
                latest_document_title = doc.filename
                documents_by_chat[doc.chat_id] = DocumentResponse(
                    fileName=doc.filename,
                    filePages=doc.pages,
                    fileUrl=doc.file_url,
                    previewImageUrl=doc.preview_image_url,
                    summary=doc.summary,
                )

    # 4. Seed default folders + welcome chat for brand-new users
    if not db_folders and not db_chats:
        default_folders = [
            (f"labor-{current_user.id}", "Labor Law"),
            (f"civil-{current_user.id}", "Civil Law"),
            (f"criminal-{current_user.id}", "Criminal Law"),
            (f"contracts-{current_user.id}", "Contracts"),
        ]
        for fid, fname in default_folders:
            db.add(models.ChatFolder(id=fid, name=fname, user_id=current_user.id))

        default_chat_id = f"c-welcome-{current_user.id}"
        db.add(models.Chat(id=default_chat_id, title="Welcome Conversation", folder_id=f"contracts-{current_user.id}", user_id=current_user.id))
        db.add(models.Message(
            id=f"m-welcome-{current_user.id}",
            chat_id=default_chat_id,
            role="assistant",
            content="Welcome to GovDoc Intellisense! Upload a PDF document and ask your legal questions.",
            created_at=datetime.utcnow(),
        ))
        db.commit()
        return get_workspace(current_user=current_user, db=db)

    quick_prompts = [
        "Summarize obligations in this document",
        "List key legal risks",
        "Extract relevant labor law references",
    ]
    domain_options = ["All", "lao_dong", "dan_su", "hinh_su", "hanh_chinh"]

    # Messages are lazy-loaded per chat by the client via GET /chats/{chat_id}/messages
    return WorkspaceDataResponse(
        workspaceName=f"{current_user.username}'s Workspace",
        documentTitle=latest_document_title,
        folders=folders_response,
        chats=chats_response,
        messagesByChat={},
        documentsByChat=documents_by_chat,
        quickPrompts=quick_prompts,
        domainOptions=domain_options,
    )


@router.post("/folders", response_model=FolderResponse)
def create_folder(
    payload: FolderCreate,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> FolderResponse:
    folder = models.ChatFolder(id=payload.id, name=payload.name, user_id=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderResponse(id=folder.id, name=folder.name, chatIds=[])


@router.delete("/folders/{folder_id}")
def delete_folder(
    folder_id: str,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    folder = db.query(models.ChatFolder).filter(
        models.ChatFolder.id == folder_id,
        models.ChatFolder.user_id == current_user.id
    ).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    # Nullify chat folder associations
    chats = db.query(models.Chat).filter(models.Chat.folder_id == folder_id).all()
    for chat in chats:
        chat.folder_id = None
        
    db.delete(folder)
    db.commit()
    return {"status": "success"}


@router.post("/chats", response_model=ChatResponse)
def create_chat(
    payload: ChatCreate,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> ChatResponse:
    # Verify folder belongs to user if provided
    if payload.folder_id:
        folder = db.query(models.ChatFolder).filter(
            models.ChatFolder.id == payload.folder_id,
            models.ChatFolder.user_id == current_user.id
        ).first()
        if not folder:
            raise HTTPException(status_code=400, detail="Invalid folder_id")

    chat = models.Chat(
        id=payload.id,
        title=payload.title,
        folder_id=payload.folder_id,
        user_id=current_user.id
    )
    db.add(chat)

    # Add default assistant starting message
    welcome_msg = models.Message(
        id=f"m-start-{payload.id}",
        chat_id=payload.id,
        role="assistant",
        content="Conversation started. Upload a PDF and ask your question.",
        created_at=datetime.utcnow()
    )
    db.add(welcome_msg)
    
    db.commit()
    db.refresh(chat)

    return ChatResponse(
        id=chat.id,
        title=chat.title,
        updatedAt=chat.updated_at.strftime("%H:%M"),
        folderId=chat.folder_id
    )


@router.delete("/chats/{chat_id}")
def delete_chat(
    chat_id: str,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    db.delete(chat)
    db.commit()
    return {"status": "success"}


@router.patch("/chats/{chat_id}", response_model=ChatResponse)
def update_chat(
    chat_id: str,
    payload: ChatUpdate,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
) -> ChatResponse:
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    if payload.title is not None:
        chat.title = payload.title
    if payload.folder_id is not None:
        if payload.folder_id != "":
            folder = db.query(models.ChatFolder).filter(
                models.ChatFolder.id == payload.folder_id,
                models.ChatFolder.user_id == current_user.id
            ).first()
            if not folder:
                raise HTTPException(status_code=400, detail="Invalid folder_id")
            chat.folder_id = payload.folder_id
        else:
            chat.folder_id = None

    db.commit()
    db.refresh(chat)
    return ChatResponse(
        id=chat.id,
        title=chat.title,
        updatedAt=chat.updated_at.strftime("%H:%M"),
        folderId=chat.folder_id
    )



@router.get("/chats/{chat_id}/messages", response_model=list[MessageResponse])
def get_chat_messages(
    chat_id: str,
    current_user: models.User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db),
) -> list[MessageResponse]:
    """Lazy-load messages for a specific chat (called when user switches to that chat)."""
    chat = db.query(models.Chat).filter(
        models.Chat.id == chat_id,
        models.Chat.user_id == current_user.id,
    ).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")

    db_msgs = (
        db.query(models.Message)
        .filter(models.Message.chat_id == chat_id)
        .order_by(models.Message.created_at.asc())
        .all()
    )

    result: list[MessageResponse] = []
    for m in db_msgs:
        citations_list: list = []
        if m.citations:
            try:
                citations_list = json.loads(m.citations)
            except Exception:
                pass
        result.append(
            MessageResponse(
                id=m.id,
                role=m.role,
                content=m.content,
                createdAt=m.created_at.strftime("%H:%M"),
                citations=citations_list,
            )
        )
    return result
