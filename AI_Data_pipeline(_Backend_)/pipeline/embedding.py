from sentence_transformers import SentenceTransformer

def generate_embeddings(text):
    model = SentenceTransformer('all-MiniLM-L6-v2')
    return model.encode(text)

if __name__ == "__main__":
    test_text = ["This is a test sentence.", "This is another test sentence."]
    print(generate_embeddings(test_text))
    print("Embeddings generated successfully.")
