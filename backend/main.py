from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()
app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API"))

class PostBody(BaseModel):
    post: str
    prompt: str

origins = [
    "http://localhost:3000",  # React default
    "http://127.0.0.1:3000",
    "https://myfrontenddomain.com",
      "chrome-extension://mdopdgfnmofdffmlipbnflfbobefbeam"  # Production frontend
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # or ["*"] to allow all (not recommended in prod)
    allow_credentials=True,
    allow_methods=["*"],         # GET, POST, PUT, DELETE, etc.
    allow_headers=["*"],         # Allow all headers
)
@app.get("/")
async def welcome():
    return {"message":"Welcome to the FASTAPI"}

@app.post("/AIcomments")
def get_ai_comments(body: PostBody):
    post = body.post
    prompt = body.prompt
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates engaging LinkedIn comments."},
                {"role": "user", "content": f"""
                 You are an expert LinkedIn communication assistant skilled in writing short, engaging, human-sounding comments.

TASK:
Analyze the following LinkedIn post and generate a concise, high-value comment.

REQUIREMENTS:
- Length: 2–3 lines.
- Tone: professional, positive, and conversational.
- Style: natural, NOT generic or overly enthusiastic.
- Add specific value by referencing the key point(s) of the post.
- Do NOT use emojis unless the post uses them.
- Avoid clichés like “Great insights!” or “Thanks for sharing!”.
- Tailor the comment to reflect the prompt: "{prompt}"

LINKEDIN POST:
"{post}"

OUTPUT FORMAT:
Write only the final comment with no explanations, no titles, and no quotes."""}
            ],
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )
        comment = response.choices[0].message.content.strip()
        print(post,"",prompt)
        return {"comment": comment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))