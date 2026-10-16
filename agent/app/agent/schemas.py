from typing import Literal

from pydantic import BaseModel, Field


class FitAssessment(BaseModel):
    """How well one tender fits one business."""

    score: int = Field(ge=0, le=100, description="0-100. 80+ strong fit, 65-79 possible, below 65 not worth bidding.")
    verdict: Literal["strong", "possible", "skip"]
    reasons: list[str] = Field(default_factory=list, description="Up to 3 short reasons it fits, in plain English.")
    risks: list[str] = Field(default_factory=list, description="Up to 3 short risks or gaps the business should check.")


class TenderBrief(BaseModel):
    """What the buyer wants, in plain English."""

    summary: str = Field(description="2-3 sentences: what the buyer is buying and why.")
    requirements: list[str] = Field(description="The key requirements, certifications and conditions, max 8 items.")


class DraftResponse(BaseModel):
    draft: str = Field(description="A first-draft bid response in plain paragraphs, 250-400 words.")


class DraftReview(BaseModel):
    approved: bool = Field(description="True if the draft addresses every key requirement without inventing facts.")
    missing: list[str] = Field(default_factory=list, description="Requirements the draft fails to address, or invented claims to remove.")
