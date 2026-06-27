import os, json, asyncio
from openai import OpenAI

DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
if not DEEPSEEK_API_KEY:
    raise ValueError("Missing DEEPSEEK_API_KEY environment variable")
client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url="https://api.deepseek.com/v1")

TOOLS = [
    {"type": "function", "function": {"name": "execute_python", "description": "Run Python code in sandbox", "parameters": {"type": "object", "properties": {"code": {"type": "string"}}, "required": ["code"]}}},
    {"type": "function", "function": {"name": "search_web", "description": "Web search", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"]}}},
    {"type": "function", "function": {"name": "read_file", "description": "Read file from /workspace", "parameters": {"type": "object", "properties": {"path": {"type": "string"}}, "required": ["path"]}}},
    {"type": "function", "function": {"name": "mcp__agent_cards__list_cards", "description": "List all AgentCard virtual cards", "parameters": {"type": "object", "properties": {}}}},
    {"type": "function", "function": {"name": "mcp__agent_cards__create_card", "description": "Create a new virtual Visa card", "parameters": {"type": "object", "properties": {"amount_cents": {"type": "integer", "description": "Amount in cents (e.g. 5000 for $50.00)"}}, "required": ["amount_cents"]}}},
    {"type": "function", "function": {"name": "mcp__agent_cards__check_balance", "description": "Check live balance of an AgentCard", "parameters": {"type": "object", "properties": {"card_id": {"type": "string", "description": "The ID of the card"}}, "required": ["card_id"]}}},
    {"type": "function", "function": {"name": "mcp__agent_cards__list_transactions", "description": "List transactions for a specific card", "parameters": {"type": "object", "properties": {"card_id": {"type": "string", "description": "The ID of the card"}}, "required": ["card_id"]}}},
    {"type": "function", "function": {"name": "mcp__agent_cards__get_plan", "description": "Show current plan and card limits", "parameters": {"type": "object", "properties": {}}}},
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
        import aiohttp
        args = json.loads(tool_call.function.arguments)
        name = tool_call.function.name
        if name == "execute_python":
            async with aiohttp.ClientSession() as session:
                async with session.post("http://sandbox:8080/run", json={"code": args["code"]}) as resp:
                    data = await resp.json()
                    return data.get("output", "No output")
        elif name == "search_web":
            return f"🔍 Search results for '{args['query']}': [Demo] 1. Example result"
        elif name == "read_file":
            try:
                with open(f"/workspace/{args['path']}", "r") as f:
                    return f.read()
            except Exception as e:
                return f"File read error: {e}"
        elif name == "mcp__agent_cards__list_cards":
            return await self._run_cli(["agent-cards", "cards", "list"])
        elif name == "mcp__agent_cards__create_card":
            return "Error: Card creation via CLI is interactive. Please run 'agent-cards cards create --amount {}' in your terminal.".format(args["amount_cents"]/100)
        elif name == "mcp__agent_cards__check_balance":
            return await self._run_cli(["agent-cards", "balance", args["card_id"]])
        elif name == "mcp__agent_cards__list_transactions":
            return await self._run_cli(["agent-cards", "transactions", args["card_id"]])
        elif name == "mcp__agent_cards__get_plan":
            return await self._run_cli(["agent-cards", "plan"])
        return "Unknown tool"

    async def _run_cli(self, cmd):
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            return f"Error executing {cmd[0]}: {stderr.decode().strip()}"
        return stdout.decode().strip()