import os
from openai import OpenAI

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=os.getenv("NVIDIA_API_KEY")
)


def generate_recommendation_reason(customer_name: str, product_name: str, category: str) -> str:
    """Llama 3.1 via NVIDIA explains why this product is recommended."""
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{
                "role": "system",
                "content": "You are a friendly shopping assistant for OmniCart, a Pakistani e-commerce platform. Keep responses under 2 sentences."
            }, {
                "role": "user",
                "content": (
                    f"In 1-2 sentences, explain why '{product_name}' (category: {category}) "
                    f"is a great recommendation for {customer_name}."
                )
            }],
            temperature=0.7,
            max_tokens=80,
            stream=False
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        import traceback
        traceback.print_exc()
        return "Recommended based on your shopping preferences and browsing history."


def generate_product_description(product_name: str, category: str, price: float, brand: str = "") -> str:
    """Llama 3.1 via NVIDIA generates a product description."""
    try:
        response = client.chat.completions.create(
            model="meta/llama-3.1-8b-instruct",
            messages=[{
                "role": "system",
                "content": "You are an e-commerce copywriter. Write a compelling product description in 2 sentences max."
            }, {
                "role": "user",
                "content": (
                    f"Write a product description for: '{product_name}', "
                    f"Brand: {brand or 'Generic'}, Category: {category}, Price: Rs.{price:,.0f}."
                )
            }],
            temperature=0.7,
            max_tokens=120,
            stream=False
        )
        return response.choices[0].message.content.strip()

    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"High quality {product_name} by {brand}. Great value at Rs.{price:,.0f}."