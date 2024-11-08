from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import AzureOpenAI
from dotenv import load_dotenv
import os
import logging
from fastapi.middleware.cors import CORSMiddleware

# Initialize logging
logging.basicConfig(level=logging.INFO)
 
# Initialize FastAPI app
app = FastAPI()

# Load environment variables
load_dotenv()

# Check if the environment variable for OPENAI_API_KEY is set
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logging.critical("OPENAI_API_KEY environment variable not set.")
    raise Exception("OPENAI_API_KEY environment variable not set.")

# CORS middleware setup
origins = [
    "http://localhost:3000",
    "localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Define request model
class FlowchartRequest(BaseModel):
    prompt: str

# Function to initialize OpenAI client
def initialize_openai_client():
    try:
        azure_endpoint = "enter azure endpoint"
        api_version = "version"

        client = AzureOpenAI(
            azure_endpoint=azure_endpoint, 
            api_key=api_key,  
            api_version=api_version
        )
        logging.info("Azure OpenAI client initialized successfully.")
        return client
    except Exception as e:
        logging.error(f"Failed to initialize Azure OpenAI client: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize OpenAI client")

# Initialize OpenAI client
client = initialize_openai_client()

# Function to generate flowchart response
def flowchart_generation_response(client, prompt, model):
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "ONLY Generate a PlantUML diagram and no other text or comments."},
                {"role": "user", "content": prompt}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        logging.error(f"Error during model completion: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the flowchart generator API"}

# Flowchart generation endpoint
@app.post("/generate-flowchart")
async def generate_flowchart(request: FlowchartRequest):
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
    try:
        result = flowchart_generation_response(client, prompt=request.prompt, model="yokogawagpt4o")
        return {"result": result}
    except HTTPException as e:
        logging.error(f"HTTP exception occurred: {e.detail}")
        raise e
    except Exception as e:
        logging.critical(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred. Please try again later.")

# Running the app
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=int(os.getenv("PORT", 8000)))
