import redis
import argparse

def reset_rate_limits():
    try:
        # Connect to Memurai
        r = redis.Redis(host='localhost', port=6379, decode_responses=True)
        
        # Get all rate limit keys
        rate_keys = r.keys('rate:*')
        
        if not rate_keys:
            print("✨ No rate limits found")
            return
        
        # Delete all rate limit keys
        r.delete(*rate_keys)
        print(f"🔓 Successfully reset {len(rate_keys)} rate limit(s)")
        
    except redis.ConnectionError:
        print("❌ Could not connect to Memurai")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    reset_rate_limits()