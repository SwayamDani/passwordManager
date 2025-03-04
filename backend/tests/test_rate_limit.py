import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Any
from app.utils.rate_limiter import LoginRateLimiter

class RateLimitTester:
    def __init__(self):
        self.url = "http://localhost:8000/api/login"
        self.test_data = {"username": "test", "password": "wrong"}
        self.attempts = 7
        self.delay = 1

    async def make_request(self, session: aiohttp.ClientSession, attempt: int) -> Dict[str, Any]:
        try:
            async with session.post(self.url, json=self.test_data) as response:
                result = await response.json()
                return {
                    "attempt": attempt,
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "status": response.status,
                    "response": result
                }
        except aiohttp.ClientError as e:
            return {
                "attempt": attempt,
                "time": datetime.now().strftime("%H:%M:%S"),
                "status": "ERROR",
                "response": str(e)
            }

    def print_result(self, result: Dict[str, Any]) -> None:
        print(f"\nAttempt {result['attempt']} at {result['time']}")
        print("-" * 40)
        print(f"Status: {result['status']}")
        print(f"Response: {json.dumps(result['response'], indent=2)}")

        if result['status'] == 429:
            retry_after = result['response']['detail']['retry_after']
            print(f"🔒 Locked out for {retry_after} seconds ({retry_after / 60:.1f} minutes)")

    async def run_test(self):
        print("\n🔒 Rate Limiter Test")
        print("=" * 50)
        print(f"Testing {self.attempts} login attempts (limit is 5)")

        async with aiohttp.ClientSession() as session:
            for i in range(self.attempts):
                result = await self.make_request(session, i + 1)
                self.print_result(result)
                
                if result['status'] == 429:
                    print("\n✅ Rate limiter working as expected!")
                    break
                    
                await asyncio.sleep(self.delay)

def main():
    try:
        tester = RateLimitTester()
        asyncio.run(tester.run_test())
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test failed: {str(e)}")

if __name__ == "__main__":
    main()