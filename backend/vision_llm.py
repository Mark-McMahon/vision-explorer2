async def call_vision_llm(crop_base64: str, yolo_label: str) -> dict:
    """Stub — returns hardcoded dict. Replaced in Phase 9."""
    return {
        "identification": {
            "name": yolo_label,
            "brand": None,
            "model": None,
            "color": "unknown",
            "category": yolo_label,
            "description": f"A {yolo_label}",
        },
        "enrichment": {
            "summary": f"This is a {yolo_label}.",
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
