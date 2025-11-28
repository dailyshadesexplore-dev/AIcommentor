from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from openai import OpenAI
from pydantic import BaseModel

load_dotenv()
app = FastAPI()
client = OpenAI(api_key=os.getenv("OPENAI_API"))

class CommentsBody(BaseModel):
    post: str
    prompt: str

class PostBody(BaseModel):
    userReq: str
    # prompt: str
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
def get_ai_comments(body: CommentsBody):
    post = body.post
    prompt = body.prompt
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates engaging LinkedIn comments."},
                {"role": "user", "content": f"""
                 You are an expert LinkedIn communication assistant who writes concise, human-sounding comments.

TASK:
Analyze the LinkedIn post and create a comment that follows the specific instruction provided in {prompt}
—for example: ask a clarifying question, add an insight, challenge an idea respectfully, etc.

REQUIREMENTS:

2–3 lines only

Professional, positive, conversational tone

Natural writing — sound like you are curious, humble.not generic, not overly enthusiastic

if asking question, start the comment with appreciation.

Reference relevant point(s) from {post}

No emojis unless the post contains them

Avoid clichés like “Great post!” or “Thanks for sharing”

The comment must directly reflect the action requested in {prompt}

INPUT:

{post} = the LinkedIn post

{prompt} = the specific instruction for the style or intent of the comment

OUTPUT:
Write only the final comment (no explanations, no titles, no quotes)."""}
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


# API to create content for LinkedIn posts

@app.post("/AIposts")
def get_ai_postsContent(body: PostBody):
    userReq = body.userReq
    # prompt = body.prompt
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates engaging LinkedIn Posts."},
                {"role": "user", "content": f"""
                 You are a LinkedIn content-creation assistant. Your task is to take a user-provided input following
                 {userReq} and produce:
                1. A polished, professional LinkedIn post description tailored to business-minded readers.
                2. A list of specific, relevant image suggestions suitable for LinkedIn posts.

                Guidelines:
                - Maintain a professional, insightful, value-driven tone.
                - Rewrite and elevate the userReq into a clear, structured LinkedIn post; avoid repeating the userReq verbatim.
                - Emphasize clarity, thought leadership, and actionable insight.
                - Keep paragraphs short and skimmable.
                - Do NOT use hashtags unless userReq explicitly requests them.
                - Do NOT use emojis unless userReq explicitly requests them.
                - Image suggestions should be realistic, professional, and helpful for designers or AI-image tools.

                Output format (must be followed exactly):

                POST DESCRIPTION:
                [Your polished LinkedIn post here]

                IMAGE SUGGESTIONS:
                - [Image idea 1]
                - [Image idea 2]
                - [Image idea 3]
                """}
            ],
            max_tokens=100,
            n=1,
            stop=None,
            temperature=0.7,
        )
        posts = response.choices[0].message.content.strip()
        return {"comment": posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import os
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))