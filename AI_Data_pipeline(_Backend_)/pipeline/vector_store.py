from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings

def create_vector_store(docs):
    embeddings = OpenAIEmbeddings()
    return Chroma.from_documents(docs, embeddings)

if __name__ == "__main__":
    test_docs = ["This is a test document.", "This is another test document."]
    print(create_vector_store(test_docs))
    print("Vector store created successfully.")
    