import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

import sys
import torch
import logging
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

CANDIDATE_LABELS = [
    "a person", "a man", "a woman", "people", "portrait", "face",
    "a dog", "a cat", "an animal", "a bird", "a bee", "an insect",
    "a car", "a vehicle", "a bus", "a truck", "an airplane",
    "a document", "a screenshot", "text", "a presentation",
    "a building", "a house", "a police station", "a stadium",
    "nature", "a forest", "mountains", "beach", "a flower", "a tree",
    "food", "furniture", "electronics", "a computer"
]

def classify(image_path):
    try:
        if not os.path.exists(image_path):
            return "error"

        model_id = "openai/clip-vit-base-patch32"
        model = CLIPModel.from_pretrained(model_id)
        processor = CLIPProcessor.from_pretrained(model_id)

        image = Image.open(image_path).convert("RGB")
        inputs = processor(text=CANDIDATE_LABELS, images=image, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)
        
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1).squeeze()
        
        index = torch.argmax(probs).item()
        return CANDIDATE_LABELS[index]
    except Exception:
        return "error"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)
    
    print(classify(sys.argv[1]))
