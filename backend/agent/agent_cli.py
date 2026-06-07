import asyncio, sys
from agent import SpiralAgent
async def main():
    agent = SpiralAgent()
    inp = sys.argv[1] if len(sys.argv) > 1 else "Hello"
    res = await agent.think_and_act(inp)
    print(res)
asyncio.run(main())