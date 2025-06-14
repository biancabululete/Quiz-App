# schemas/openai_eval.py
from pydantic import BaseModel
from typing import List

class OpenAIEvalRequest(BaseModel):
    prompts: List[str]
