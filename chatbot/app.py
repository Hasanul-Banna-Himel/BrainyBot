from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for development

# Configure the Gemini API with your API key from .env
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("No GEMINI_API_KEY found in .env file")

genai.configure(api_key=GEMINI_API_KEY)


MODEL_NAME = "gemini-1.5-flash"

@app.route('/ask', methods=['POST'])
def ask_gemini():
    # Get data from request
    data = request.json
    
    if not data or 'prompt' not in data:
        return jsonify({"error": "Prompt is required"}), 400
    
    user_prompt = data['prompt']
    
    try:
        # Load the newer Gemini model
        model = genai.GenerativeModel(MODEL_NAME)
        
        # Add context to make responses educational and helpful for students
        context = """
        You are a helpful study assistant for students. Provide educational, accurate, 
        and helpful information. Explain concepts clearly and encourage understanding 
        rather than just providing answers. If you're unsure about something, acknowledge it.
        """
        
        full_prompt = f"{context}\n\nStudent question: {user_prompt}"
        
        # Generate response from Gemini
        response = model.generate_content(full_prompt)
        
        # Return the response
        return jsonify({
            "response": response.text,
            "model_used": MODEL_NAME,
            "status": "success"
        })
    
    except Exception as e:
        return jsonify({
            "error": str(e),
            "status": "error"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)