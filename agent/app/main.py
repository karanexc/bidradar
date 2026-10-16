import logging
import secrets

from fastapi import BackgroundTasks, Depends, FastAPI, Header, HTTPException

from app.config import get_settings
from app.pipeline import run_daily, run_user

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

app = FastAPI(title="BidRadar Agent", version="0.1.0")


def require_secret(authorization: str | None = Header(default=None)) -> None:
    expected = f"Bearer {get_settings().cron_secret}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=401, detail="Invalid or missing token")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/jobs/daily", dependencies=[Depends(require_secret)])
def daily(background: BackgroundTasks) -> dict:
    background.add_task(run_daily)
    return {"status": "started"}


@app.post("/jobs/run-user/{user_id}", dependencies=[Depends(require_secret)])
def run_one_user(user_id: str, background: BackgroundTasks) -> dict:
    background.add_task(run_user, user_id)
    return {"status": "started"}
