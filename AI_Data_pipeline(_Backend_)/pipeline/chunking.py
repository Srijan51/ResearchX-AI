from langchain.text_splitter import RecursiveCharacterTextSplitter
def chunk_text(text, chunk_size=1000, chunk_overlap=200):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
        length_function=len,
    )
    return splitter.split_text(text)    

if __name__ == "__main__":
    test_text = "This is a test sentence. This is another test sentence."
    print(chunk_text(test_text))
    print("Chunking completed successfully.")    
