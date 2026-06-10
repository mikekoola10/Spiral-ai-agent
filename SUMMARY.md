# Spiral AI Agent - Project Context Summary

## Project Overview
Spiral is a Jarvis-like AI agent powered by DeepSeek, designed to execute code safely in a sandbox, search the web, and interact with files.

## Architecture
- **Frontend**: React application (`frontend/`) providing a terminal-like chat interface. Port 3000.
- **Gateway**: Node.js Express server (`backend/gateway/`) that bridges the frontend and the agent. Port 3001.
- **Agent**: Python-based agent logic (`backend/agent/`) using the DeepSeek API (`deepseek-chat`).
- **Sandbox**: Flask-based Python execution environment (`docker/sandbox/`) for safe code execution. Port 8080.

## Tools Available to Agent
1. `execute_python`: Runs Python code in the sandbox.
2. `search_web`: Web search (currently mocked in `agent.py`).
3. `read_file`: Reads files from the `/workspace` directory.

## Deployment Configurations
- **Standard (Current Main)**: Multi-container setup using `docker-compose.yml`. Agent connects to sandbox at `http://sandbox:8080`.
- **Consolidated (Railway/Render branches)**: Single-container setup.
  - Uses `Dockerfile.railway` or standard `Dockerfile` with `start.sh`.
  - Uses `sandbox_module/sandbox.py` for local execution or a local Flask server on `localhost:8080`.
  - Mentions of `railway.json` for Railway-specific deployment.

## Key Files
- `backend/agent/agent.py`: Contains `SpiralAgent` class and tool execution logic.
- `backend/gateway/server.js`: Spawns `agent_cli.py` for each chat request.
- `docker/sandbox/sandbox_server.py`: Simple Flask server that uses `subprocess` to run code.
- `frontend/src/App.jsx`: Main React component for the UI.
