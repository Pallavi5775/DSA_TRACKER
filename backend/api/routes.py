from fastapi import APIRouter, Depends, HTTPException, Body, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from backend.db.session import get_db
from backend.crud import question as crud
from backend.schemas.question import QuestionCreate
from backend.core.security import get_current_user_id, require_admin

router = APIRouter()


@router.get("/activity")
async def get_activity(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.get_activity(db, user_id)


@router.get("/questions")
async def get_all(
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.get_questions(db, user_id)


@router.post("/questions")
async def create(
    q: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_admin),
):
    return await crud.create_question(db, q, user_id)


@router.put("/questions/{qid}")
async def update(
    qid: int,
    q: QuestionCreate,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(require_admin),
):
    return await crud.update_question(db, qid, q, user_id)


@router.post("/questions/{qid}/log")
async def add_log(
    qid: int,
    log: dict,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.add_log(db, qid, log, user_id)


@router.put("/questions/{qid}/status")
async def update_status(
    qid: int,
    category: str = Body(...),
    coverage_status: str = Body(...),
    revision_status: str = Body(...),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.update_question_status(db, qid, category, coverage_status, revision_status, user_id)


@router.patch("/questions/{qid}/notes")
async def update_notes(
    qid: int,
    notes: str = Body(""),
    my_gap_analysis: str = Body(""),
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.update_notes(db, qid, notes, my_gap_analysis, user_id)


@router.post("/questions/{qid}/validate")
async def validate(
    qid: int,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return await crud.validate_question(db, qid, user_id)


@router.post("/upload_md")
async def upload_md(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _: int = Depends(require_admin),
):
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only .md files are supported.")
    content = (await file.read()).decode("utf-8")
    added, total = await crud.add_questions_from_md(db, content)
    return {"added": added, "total": total}


@router.post("/sync_questions")
async def sync_questions(
    db: AsyncSession = Depends(get_db),
    _: int = Depends(require_admin),
):
    added = await crud.sync_questions_from_file(db)
    return {"status": f"Synced {added} new questions from DSA_Must_Solve_Problems.md"}
