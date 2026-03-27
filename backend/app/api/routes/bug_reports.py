from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api import deps
from app import crud, models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.bug_reports.BugReport)
def create_bug_report(
    *,
    db: Session = Depends(deps.get_db),
    bug_in: schemas.bug_reports.BugReportCreate
) -> Any:
    """
    Create new bug report.
    """
    bug_report = models.bug_reports.BugReport(
        description=bug_in.description,
        metadata_json=bug_in.metadata_json,
        screenshot_base64=bug_in.screenshot_base64,
        user_id=bug_in.user_id,
        status=bug_in.status
    )
    db.add(bug_report)
    db.commit()
    db.refresh(bug_report)
    return bug_report

@router.get("/", response_model=List[schemas.bug_reports.BugReport])
def read_bug_reports(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve bug reports.
    """
    # By default, only show open or new bugs unless specified
    bug_reports = db.query(models.bug_reports.BugReport).filter(models.bug_reports.BugReport.status != 'solved').offset(skip).limit(limit).all()
    return bug_reports

@router.patch("/{id}", response_model=schemas.bug_reports.BugReport)
def update_bug_report(
    *,
    db: Session = Depends(deps.get_db),
    id: int,
    bug_in: schemas.bug_reports.BugReportUpdate
) -> Any:
    """
    Update a bug report.
    """
    bug_report = db.query(models.bug_reports.BugReport).filter(models.bug_reports.BugReport.id == id).first()
    if not bug_report:
        raise HTTPException(status_code=404, detail="Bug report not found")
    
    update_data = bug_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bug_report, field, value)
        
    db.add(bug_report)
    db.commit()
    db.refresh(bug_report)
    return bug_report
