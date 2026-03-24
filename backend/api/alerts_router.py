from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from db.session import get_db
from db.models import Alert
from core.auth import get_current_user

router = APIRouter(prefix="/alerts", tags=["Alerts"])


class AlertRequest(BaseModel):
    symbol: str
    condition: str    # signal_changes_to | confidence_above | confidence_below
    value: str        # BUY | HOLD | 0.7 etc.


@router.get("")
async def list_alerts(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.user_id == current_user["id"], Alert.active == True)
    )
    alerts = result.scalars().all()
    return {
        "alerts": [
            {
                "id": a.id,
                "symbol": a.symbol,
                "condition": a.condition,
                "value": a.value,
                "active": a.active,
                "last_triggered": a.last_triggered.isoformat() if a.last_triggered else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in alerts
        ]
    }


@router.post("", status_code=201)
async def create_alert(
    body: AlertRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alert = Alert(
        user_id=current_user["id"],
        symbol=body.symbol.upper(),
        condition=body.condition,
        value=body.value,
    )
    db.add(alert)
    await db.flush()
    return {"alert_id": alert.id, "active": True, "symbol": alert.symbol}


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user["id"])
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    await db.delete(alert)
    return {"deleted": True, "alert_id": alert_id}
