from app.api.scraper import scrape
from app.pipeline.chunking import chunk_text
from app.pipeline.embedding import generate_embeddings
from app.pipeline.vector_store import create_vector_store

if __name__ == "__main__":
    test_url = "https://www.example.com"
    print(scrape(test_url))
    print("Scraping completed successfully.")
    print(chunk_text(test_url))
    print("Chunking completed successfully.")
    print(generate_embeddings(test_url))
    print("Embeddings generated successfully.")
    print(create_vector_store(test_url))
    print("Vector store created successfully.")
        