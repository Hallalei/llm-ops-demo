import os
import requests
from datetime import date, timedelta
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_KEY = os.getenv("OPENROUTER_KEY")


def get_openrouter_yesterday_usage():
    """
    获取 OpenRouter 昨日的用量数据
    返回格式: {'tokens': int, 'requests': int, 'spend': float}
    """
    if not OPENROUTER_KEY:
        print("⚠️ 未配置 OPENROUTER_KEY，跳过 OpenRouter 数据抓取")
        return {"tokens": 0, "requests": 0, "spend": 0.0}

    # 1. 计算昨日日期 (YYYY-MM-DD)
    yesterday = (date.today() - timedelta(days=1)).strftime("%Y-%m-%d")

    url = "https://openrouter.ai/api/v1/activity"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_KEY}"
    }
    params = {
        "date": yesterday
    }

    try:
        response = requests.get(url, headers=headers, params=params, timeout=10)

        if response.status_code != 200:
            print(f"❌ OpenRouter API 错误: {response.status_code} - {response.text}")
            return {"tokens": 0, "requests": 0, "spend": 0.0}

        data = response.json()

        # 2. 聚合数据 (OpenRouter 可能返回多个模型的数据列表)
        total_usage = 0.0  # OpenRouter 的 'usage' 字段其实是金额(Cost)
        total_requests = 0
        total_tokens = 0

        # OpenRouter 返回的数据在 'data' 列表中
        rows = data.get("data", [])
        for item in rows:
            # 累加金额
            total_usage += float(item.get("usage", 0))
            # 累加请求数
            total_requests += int(item.get("requests", 0))
            # 累加 Token (prompt + completion)
            p_tokens = int(item.get("prompt_tokens", 0))
            c_tokens = int(item.get("completion_tokens", 0))
            total_tokens += (p_tokens + c_tokens)

        # 3. 组装成 main.py 需要的字典格式
        # 注意：OpenRouter 的 usage 是钱，对应我们的 spend
        result = {
            "tokens": total_tokens,
            "requests": total_requests,
            "spend": round(total_usage, 2)  # 保留2位小数
        }

        print(f"✅ OpenRouter 昨日数据获取成功: {result}")
        return result

    except Exception as e:
        print(f"❌ OpenRouter 请求异常: {e}")
        return {"tokens": 0, "requests": 0, "spend": 0.0}

def main():
    usage_data = get_openrouter_yesterday_usage()
    print(usage_data)

if __name__ == "__main__":
    main()