from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
from pathlib import Path

import chromadb
from google import genai
from google.genai import errors, types


CHROMA_PATH = "chroma_db"
COLLECTION_NAME = "rag_documents"
EMBEDDING_MODEL = "gemini-embedding-001"
CHAT_MODEL = "gemini-2.5-flash-lite"
SUPPORTED_EXTENSIONS = {".txt", ".md", ".csv", ".py", ".json", ".html", ".css", ".js"}
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def get_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Missing API key. Set GEMINI_API_KEY or GOOGLE_API_KEY.", file=sys.stderr)
        sys.exit(1)
    return api_key


def read_documents(docs_dir: Path) -> list[tuple[str, str]]:
    if not docs_dir.exists():
        print(f"Docs folder not found: {docs_dir}", file=sys.stderr)
        sys.exit(1)

    documents: list[tuple[str, str]] = []
    for path in sorted(docs_dir.rglob("*")):
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = path.read_text(encoding="latin-1")

            text = text.strip()
            if text:
                documents.append((str(path), text))

    return documents


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    if chunk_size <= overlap:
        raise ValueError("chunk_size must be greater than overlap")

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap

    return chunks


def make_chunk_id(source: str, chunk: str, index: int) -> str:
    digest = hashlib.sha256(f"{source}:{index}:{chunk}".encode("utf-8")).hexdigest()
    return digest[:24]


def gemini_call(description: str, call, attempts: int = 3):
    delay = 2
    for attempt in range(1, attempts + 1):
        try:
            return call()
        except errors.APIError as exc:
            status_code = getattr(exc, "status_code", None)
            if status_code not in RETRYABLE_STATUS_CODES or attempt == attempts:
                raise

            print(
                f"{description} failed with {status_code}. Retrying in {delay} seconds...",
                file=sys.stderr,
            )
            time.sleep(delay)
            delay *= 2

    raise RuntimeError(f"{description} failed after {attempts} attempts.")


def format_gemini_error(exc: errors.APIError, chat_model: str) -> str:
    status_code = getattr(exc, "status_code", "unknown")
    message = getattr(exc, "message", str(exc))

    if status_code == 503:
        return (
            "Gemini is temporarily overloaded right now, so I could not generate the answer. "
            "Your Chroma index is fine. Wait a minute and ask again, or try a different model "
            "with: python3.12 rag_chatbot.py --no-index --chat-model gemini-2.0-flash-lite"
        )

    if status_code == 429:
        return (
            "Your free-tier Gemini rate limit was reached. Wait a bit and ask again, "
            "or restart with --no-index so it does not spend requests rebuilding embeddings."
        )

    return f"Gemini API error ({status_code}): {message}"


def embed_texts(client: genai.Client, texts: list[str], task_type: str) -> list[list[float]]:
    embeddings: list[list[float]] = []

    for text in texts:
        result = gemini_call(
            "Embedding request",
            lambda: client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text,
                config=types.EmbedContentConfig(task_type=task_type),
            ),
        )
        embeddings.append(result.embeddings[0].values)

    return embeddings


def get_collection():
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    return chroma_client.get_or_create_collection(name=COLLECTION_NAME)


def build_index(client: genai.Client, docs_dir: Path, reset: bool) -> None:
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)

    if reset:
        try:
            chroma_client.delete_collection(name=COLLECTION_NAME)
        except Exception:
            pass

    collection = chroma_client.get_or_create_collection(name=COLLECTION_NAME)
    docs = read_documents(docs_dir)

    if not docs:
        print(f"No supported text files found in {docs_dir}")
        return

    ids: list[str] = []
    chunks: list[str] = []
    metadatas: list[dict[str, str | int]] = []

    for source, text in docs:
        for index, chunk in enumerate(chunk_text(text)):
            ids.append(make_chunk_id(source, chunk, index))
            chunks.append(chunk)
            metadatas.append({"source": source, "chunk": index})

    existing = set(collection.get(ids=ids).get("ids", []))
    new_items = [
        (chunk_id, chunk, metadata)
        for chunk_id, chunk, metadata in zip(ids, chunks, metadatas)
        if chunk_id not in existing
    ]

    if not new_items:
        print(f"Index is already up to date. Chunks in collection: {collection.count()}")
        return

    new_ids, new_chunks, new_metadatas = zip(*new_items)
    embeddings = embed_texts(client, list(new_chunks), task_type="RETRIEVAL_DOCUMENT")

    collection.add(
        ids=list(new_ids),
        documents=list(new_chunks),
        metadatas=list(new_metadatas),
        embeddings=embeddings,
    )

    print(f"Indexed {len(new_items)} new chunks. Total chunks: {collection.count()}")


def retrieve_context(client: genai.Client, question: str, top_k: int) -> tuple[str, list[str]]:
    collection = get_collection()
    if collection.count() == 0:
        return "", []

    query_embedding = embed_texts(client, [question], task_type="RETRIEVAL_QUERY")[0]
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"],
    )

    documents = results.get("documents", [[]])[0]
    metadatas = results.get("metadatas", [[]])[0]

    context_blocks = []
    sources = []
    for i, (document, metadata) in enumerate(zip(documents, metadatas), start=1):
        source = str(metadata.get("source", "unknown"))
        chunk = metadata.get("chunk", "?")
        sources.append(f"{source}#chunk-{chunk}")
        context_blocks.append(f"[{i}] Source: {source}\n{document}")

    return "\n\n".join(context_blocks), sources


def answer_question(client: genai.Client, question: str, top_k: int, chat_model: str) -> str:
    context, sources = retrieve_context(client, question, top_k)

    if not context:
        return "I do not have any indexed documents yet. Add files to your docs folder and rerun with --docs."

    prompt = f"""
You are a helpful RAG chatbot. Answer the question using only the context below.
If the answer is not in the context, say you do not know based on the provided documents.

Context:
{context}

Question:
{question}

Answer clearly and briefly. Include source numbers when useful.
""".strip()

    response = gemini_call(
        "Answer generation",
        lambda: client.models.generate_content(model=chat_model, contents=prompt),
    )
    answer = response.text or "No response generated."

    if sources:
        answer += "\n\nSources:\n" + "\n".join(f"- {source}" for source in sources)

    return answer


def chat_loop(client: genai.Client, top_k: int, chat_model: str) -> None:
    print("\nRAG chatbot ready. Ask a question, or type 'exit' to quit.\n")

    while True:
        question = input("You: ").strip()
        if question.lower() in {"exit", "quit", "q"}:
            print("Bye.")
            break
        if not question:
            continue

        print("\nBot:")
        try:
            print(answer_question(client, question, top_k, chat_model))
        except errors.APIError as exc:
            print(format_gemini_error(exc, chat_model))
        print()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Simple Gemini + ChromaDB RAG chatbot")
    parser.add_argument("--docs", default="docs", help="Folder containing source documents")
    parser.add_argument("--top-k", type=int, default=4, help="Number of chunks to retrieve")
    parser.add_argument(
        "--chat-model",
        default=os.getenv("GEMINI_CHAT_MODEL", CHAT_MODEL),
        help="Gemini model to use for answering questions",
    )
    parser.add_argument("--reset", action="store_true", help="Rebuild the Chroma collection from scratch")
    parser.add_argument("--no-index", action="store_true", help="Skip indexing and only chat with existing DB")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    client = genai.Client(api_key=get_api_key())

    if not args.no_index:
        build_index(client, Path(args.docs), reset=args.reset)

    chat_loop(client, top_k=args.top_k, chat_model=args.chat_model)


if __name__ == "__main__":
    main()
