import sys
import os
import torch
import logging

# Fix for OMP: Error #15: Initializing libiomp5md.dll, but found libiomp5md.dll already initialized.
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
from PIL import Image
from transformers import CLIPProcessor, CLIPModel

# Disable transformers logging for clean output
logging.getLogger("transformers").setLevel(logging.ERROR)

# Granular labels for better zero-shot matching
CANDIDATE_LABELS = [
    "a person", "an animal", "a vehicle", "a document", "a screenshot", "a building", "nature"
]

def map_to_category(label):
    # Mapping logic based on user requirements
    if label == "a person": return "People"
    if label == "an animal": return "Animals"
    if label == "a vehicle": return "Vehicles"
    if label in ["a document", "a screenshot"]: return "Documents"
    return "Others" # For "a building" and "nature"

def classify(image_path):
    try:
        if not os.path.exists(image_path):
            return "unknown|Others"

        model_id = "openai/clip-vit-base-patch32"
        model = CLIPModel.from_pretrained(model_id)
        processor = CLIPProcessor.from_pretrained(model_id)

        image = Image.open(image_path).convert("RGB")
        
        # Use simple text labels as prompts for better matching
        inputs = processor(text=CANDIDATE_LABELS, images=image, return_tensors="pt", padding=True)

        with torch.no_grad():
            outputs = model(**inputs)
        
        logits_per_image = outputs.logits_per_image
        probs = logits_per_image.softmax(dim=1).squeeze()
        
        # Log all label scores for debugging/transparency
        print("\n[CLIP] Label Confidence Scores:")
        for i, label in enumerate(CANDIDATE_LABELS):
            confidence = probs[i].item() * 100
            print(f"  - {label}: {confidence:.2f}%")
        
        index = torch.argmax(probs).item()
        raw_label = CANDIDATE_LABELS[index]
        final_category = map_to_category(raw_label)
        
        print(f"[CLIP] Selected Label: \"{raw_label}\"")
        print(f"[CLIP] Final Category: {final_category}\n")
        
        return f"{raw_label}|{final_category}"
    except Exception as e:
        print(f"[CLIP Error] {str(e)}")
        return f"error|Others"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("none|Others")
        sys.exit(0)
    
    # We output the final result so that Electron can capture it
    # We use print for logging and the last line for the return value
    result = classify(sys.argv[1])
    print(result)
