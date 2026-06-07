# Same as agent.py but replace the sandbox call with local module
import os, json, asyncio
from openai import OpenAI
import sys
sys.path.append('/app/sandbox_module')
from sandbox import run_python_code

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1")

TOOLS = [
    {"type": "function", "function": {"name": "execute_python", "description": "Run Python code", "parameters": {"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]}}},
    {"type": "function", "function": {"name": "search_web", "description": "Web search", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}},
    {"type": "function", "function": {"name": "read_file", "description": "Read file", "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}}},
]

class SpiralAgent:
    def __init__(self):
        self.conversation_history = []
    async def think_and_act(self, user_input):
        self.conversation_history.append({"role": "user", "content": user_input})
        response = client.chat.completions.create(model="deepseek-chat", messages=self.conversation_history, tools=TOOLS, tool_choice="auto")
        assistant = response.choices[0].message
        self.conversation_history.append(assistant)
        if assistant.tool_calls:
            for tc in assistant.tool_calls:
                result = await self._run_tool(tc)
                self.conversation_history.append({"role": "tool", "tool_call_id": tc.id, "content": result})
            final = client.chat.completions.create(model="deepseek-chat", messages=self.conversation_history)
            answer = final.choices[0].message.content
            self.conversation_history.append({"role": "assistant", "content": answer})
            return answer
        return assistant.content
    async def _run_tool(self, tool_call):
        args = json.loads(tool_call.function.arguments)
        name = tool_call.function.name
        if name == "execute_python":
            return run_python_code(args["code"])
        elif name == "search_web":
            return f"🔍 Search: {args['query']} (demo)"
        elif name == "read_file":
            try:
                with open(f"/workspace/{args['path']}", "r") as f:
                    return f.read()
            except Exception as e:
                return f"Read error: {e}"
        return "Unknown tool"
