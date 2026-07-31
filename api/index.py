import sys
import os

# Include backend directory in Python search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app.main import app

# Required for Vercel serverless entrypoint
app = app
