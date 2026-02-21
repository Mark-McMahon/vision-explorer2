import json
import re

import anthropic

client = anthropic.AsyncAnthropic()

FALLBACK_RESPONSE = lambda yolo_label: {
    "identification": {
        "name": yolo_label,
        "brand": None,
        "model": None,
        "color": "unknown",
        "category": yolo_label,
        "description": yolo_label,
    },
    "enrichment": {
        "summary": "",
        "price_estimate": {
            "range_low": "",
            "range_high": "",
            "currency": "USD",
            "note": "",
        },
        "specs": {},
        "search_query": yolo_label,
    },
}

PROMPT = """YOLO detected this as: "{label}".

Identify the specific item in this image and provide enrichment data. Return ONLY a JSON object with this exact structure:

{{
  "identification": {{
    "name": "Full product/item name (be as specific as possible)",
    "brand": "Brand name if identifiable, else null",
    "model": "Model name/number if identifiable, else null",
    "color": "Primary color",
    "category": "General category (e.g. drinkware, electronics, furniture, clothing)",
    "description": "One-sentence description"
  }},
  "enrichment": {{
    "summary": "2-3 sentence informative summary about this item or product line. Include what it's known for, key features, or interesting context.",
    "price_estimate": {{
      "range_low": "$XX",
      "range_high": "$XX",
      "currency": "USD",
      "note": "Brief note on pricing (e.g. 'retail price' or 'varies by size')"
    }},
    "specs": {{
      "key1": "value1",
      "key2": "value2"
    }},
    "search_query": "Best search query to find this product online"
  }}
}}

For the "specs" field, include 3-5 key specifications relevant to the item category. Examples:
- Drinkware: material, capacity, insulation_type, dishwasher_safe
- Electronics: processor, ram, storage, display_size, battery_life
- Furniture: material, dimensions, weight_capacity
- Books: author, genre, page_count, year_published
- Clothing: material, fit_type, care_instructions

If you cannot identify the specific product, provide your best guess based on what you see. For price estimates, give a reasonable range for this type of item.

Return raw JSON only, no markdown fences."""


def _strip_fences(text: str) -> str:
    """Strip markdown code fences if present."""
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


async def _call_once(crop_base64: str, yolo_label: str) -> dict:
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=600,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": crop_base64,
                        },
                    },
                    {
                        "type": "text",
                        "text": PROMPT.format(label=yolo_label),
                    },
                ],
            }
        ],
    )
    raw = response.content[0].text
    return json.loads(_strip_fences(raw))


async def call_vision_llm(crop_base64: str, yolo_label: str) -> dict:
    """Call Claude Vision LLM and return identification + enrichment as a dict.

    Retries once on JSON parse failure, then falls back to a minimal dict.
    """
    try:
        return await _call_once(crop_base64, yolo_label)
    except (json.JSONDecodeError, ValueError, KeyError):
        pass

    # Retry once
    try:
        return await _call_once(crop_base64, yolo_label)
    except (json.JSONDecodeError, ValueError, KeyError):
        pass

    return FALLBACK_RESPONSE(yolo_label)
