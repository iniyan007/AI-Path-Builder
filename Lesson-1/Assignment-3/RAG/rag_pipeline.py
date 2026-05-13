"""
RAG Ingestion Pipeline for C# / .NET Core Documentation
========================================================
Sources:
  1. Local PDF files
  2. Local Markdown files
  3. Live scraping from learn.microsoft.com/dotnet

Stack:
  - Embeddings : nomic-embed-text  via Ollama
  - LLM        : deepseek-r1:7b    via Ollama
  - Vector DB  : ChromaDB (local, persistent)
  - Scraping   : httpx + BeautifulSoup4
  - PDF        : pdfplumber
  - Chunking   : LangChain RecursiveCharacterTextSplitter

Install:
  pip install langchain langchain-community langchain-ollama \
              chromadb pdfplumber httpx beautifulsoup4 \
              markdownify tqdm lxml
"""

import os
import re
import time
import hashlib
from pathlib import Path
from typing import Any, List, Dict

import httpx
import pdfplumber
from bs4 import BeautifulSoup
from tqdm import tqdm

from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings, OllamaLLM
from langchain_chroma import Chroma
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_core.prompts import PromptTemplate


# ─────────────────────────────────────────────
# CONFIGURATION  — edit these to suit your setup
# ─────────────────────────────────────────────

PDF_DIR       = "./docs/pdf"          # folder with your .pdf files
MARKDOWN_DIR  = "./docs/markdown"     # folder with your .md files
CHROMA_DIR    = "./chroma_db"         # where ChromaDB persists on disk
COLLECTION    = "dotnet_docs"         # ChromaDB collection name

OLLAMA_BASE   = "http://localhost:11434"
EMBED_MODEL   = "nomic-embed-text"
LLM_MODEL     = "deepseek-r1:7b"

CHUNK_SIZE    = 600                   # tokens per chunk
CHUNK_OVERLAP = 80                    # overlap between chunks
TOP_K         = 5                     # docs retrieved per query

# Microsoft .NET docs pages to scrape
# Add or remove URLs as needed
DOTNET_URLS: List[str] = [
    "https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/object-oriented/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/interfaces/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/",
    "https://learn.microsoft.com/en-us/dotnet/csharp/linq/",
    "https://learn.microsoft.com/en-us/dotnet/core/introduction",
    "https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-9/overview",
    "https://learn.microsoft.com/en-us/aspnet/core/introduction-to-aspnet-core",
    "https://learn.microsoft.com/en-us/aspnet/core/fundamentals/",
    "https://learn.microsoft.com/en-us/dotnet/core/dependency-injection",
    "https://learn.microsoft.com/en-us/ef/core/",
    "https://learn.microsoft.com/en-us/dotnet/core/testing/",
]

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def make_doc_id(source: str, chunk_index: int) -> str:
    """Stable unique id so re-runs don't duplicate chunks."""
    raw = f"{source}::{chunk_index}"
    return hashlib.md5(raw.encode()).hexdigest()


def clean_text(text: str) -> str:
    """Remove excessive whitespace."""
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r" {2,}", " ", text)
    return text.strip()


# ─────────────────────────────────────────────
# LOADERS
# ─────────────────────────────────────────────

def load_pdfs(pdf_dir: str) -> List[Document]:
    """Extract text from every PDF in pdf_dir."""
    docs: List[Document] = []
    pdf_path = Path(pdf_dir)
    if not pdf_path.exists():
        print(f"  [PDF] Directory not found: {pdf_dir}  — skipping.")
        return docs

    pdf_files = list(pdf_path.rglob("*.pdf"))
    print(f"\n📄 Loading {len(pdf_files)} PDF(s) from {pdf_dir}")

    for pdf_file in tqdm(pdf_files, desc="PDFs"):
        try:
            with pdfplumber.open(pdf_file) as pdf:
                full_text = ""
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    full_text += page_text + "\n"
            full_text = clean_text(full_text)
            if full_text:
                docs.append(Document(
                    page_content=full_text,
                    metadata={
                        "source": str(pdf_file),
                        "type": "pdf",
                        "filename": pdf_file.name,
                    }
                ))
        except Exception as e:
            print(f"  ⚠  Could not read {pdf_file.name}: {e}")

    print(f"  ✓ Loaded {len(docs)} PDF document(s)")
    return docs


def load_markdown(md_dir: str) -> List[Document]:
    """Read every .md / .mdx file in md_dir."""
    docs: List[Document] = []
    md_path = Path(md_dir)
    if not md_path.exists():
        print(f"  [MD] Directory not found: {md_dir}  — skipping.")
        return docs

    md_files = list(md_path.rglob("*.md")) + list(md_path.rglob("*.mdx"))
    print(f"\n📝 Loading {len(md_files)} Markdown file(s) from {md_dir}")

    for md_file in tqdm(md_files, desc="Markdown"):
        try:
            text = md_file.read_text(encoding="utf-8", errors="ignore")
            text = clean_text(text)
            if text:
                docs.append(Document(
                    page_content=text,
                    metadata={
                        "source": str(md_file),
                        "type": "markdown",
                        "filename": md_file.name,
                    }
                ))
        except Exception as e:
            print(f"  ⚠  Could not read {md_file.name}: {e}")

    print(f"  ✓ Loaded {len(docs)} Markdown file(s)")
    return docs


def scrape_dotnet_page(url: str, client: httpx.Client) -> Document | None:
    """
    Fetch a single learn.microsoft.com page and return a Document
    containing only the main article content (strips nav/ads/footer).
    """
    try:
        response = client.get(url, timeout=20)
        response.raise_for_status()
    except Exception as e:
        print(f"  ⚠  Failed to fetch {url}: {e}")
        return None

    soup = BeautifulSoup(response.text, "lxml")

    # Microsoft docs: main content is in <main> or <article>
    main = (
        soup.find("main")
        or soup.find("article")
        or soup.find("div", {"id": "main-content"})
        or soup.find("div", {"class": "content"})
    )
    if not main:
        main = soup.body

    # Remove boilerplate sections
    for tag in main.select(
        "nav, header, footer, aside, .feedback-section, "
        ".action-container, .breadcrumb, script, style, "
        "[data-bi-area='LeftNav'], .toc, .docsNav"
    ):
        tag.decompose()

    # Extract title
    title_tag = soup.find("h1")
    title = title_tag.get_text(strip=True) if title_tag else url

    # Get clean text
    text = main.get_text(separator="\n")
    text = clean_text(text)

    if len(text) < 100:          # skip near-empty pages
        return None

    return Document(
        page_content=text,
        metadata={
            "source": url,
            "type": "web",
            "title": title,
        }
    )


def scrape_dotnet_docs(urls: List[str]) -> List[Document]:
    """Scrape all Microsoft .NET documentation URLs."""
    docs: List[Document] = []
    print(f"\n🌐 Scraping {len(urls)} Microsoft .NET docs page(s)...")

    headers = {
        "User-Agent": (
            "Mozilla/5.0 (compatible; DotnetRAGBot/1.0; "
            "+https://github.com/your-repo)"
        )
    }

    with httpx.Client(headers=headers, follow_redirects=True) as client:
        for url in tqdm(urls, desc="Scraping"):
            doc = scrape_dotnet_page(url, client)
            if doc:
                docs.append(doc)
            time.sleep(0.5)        # polite delay — don't hammer the server

    print(f"  ✓ Scraped {len(docs)} page(s) successfully")
    return docs


# ─────────────────────────────────────────────
# CHUNKING
# ─────────────────────────────────────────────

def chunk_documents(docs: List[Document]) -> List[Document]:
    """Split documents into overlapping chunks."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    print(f"\n✂  Split into {len(chunks)} chunk(s) "
          f"(size={CHUNK_SIZE}, overlap={CHUNK_OVERLAP})")
    return chunks


# ─────────────────────────────────────────────
# VECTOR STORE
# ─────────────────────────────────────────────

def build_vector_store(chunks: List[Document]) -> Chroma:
    """Embed chunks and persist them in ChromaDB."""
    print(f"\n🔢 Embedding with '{EMBED_MODEL}' via Ollama...")
    print("   (This may take a few minutes for large corpora)")

    embeddings = OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url=OLLAMA_BASE,
    )

    # Assign stable IDs to avoid duplicate entries on re-runs
    ids = [
        make_doc_id(c.metadata.get("source", "unknown"), i)
        for i, c in enumerate(chunks)
    ]

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION,
        ids=ids,
    )

    print(f"  ✓ Vector store saved to '{CHROMA_DIR}'  "
          f"({len(chunks)} vectors, collection='{COLLECTION}')")
    return vectorstore


def load_vector_store() -> Chroma:
    """Load an existing ChromaDB vector store from disk."""
    embeddings = OllamaEmbeddings(
        model=EMBED_MODEL,
        base_url=OLLAMA_BASE,
    )
    return Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION,
        embedding_function=embeddings,
    )


# ─────────────────────────────────────────────
# RAG CHAIN
# ─────────────────────────────────────────────
PROMPT_TEMPLATE = """You are a helpful C# and .NET Core expert assistant.
Use ONLY the context below to answer the question.
If the answer is not in the context, say "I don't have enough information."

Context:
{context}

Question: {input}

Answer:"""


def build_rag_chain(vectorstore: Chroma):
    llm = OllamaLLM(
        model=LLM_MODEL,
        base_url=OLLAMA_BASE,
        temperature=0.1,
    )
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": TOP_K},
    )
    prompt = PromptTemplate(
        input_variables=["context", "input"],
        template=PROMPT_TEMPLATE,
    )
    combine_docs_chain = create_stuff_documents_chain(llm, prompt)
    chain = create_retrieval_chain(retriever, combine_docs_chain)
    return chain

# ─────────────────────────────────────────────
# INTERACTIVE Q&A  LOOP
# ─────────────────────────────────────────────

def interactive_qa(chain: Any) -> None:
    print("\n" + "═" * 60)
    print("  .NET RAG Assistant  (type 'exit' to quit)")
    print("═" * 60)

    while True:
        try:
            question = input("\n❓ Your question: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nBye!")
            break

        if not question:
            continue
        if question.lower() in {"exit", "quit", "q"}:
            print("Goodbye!")
            break

        print("\n⏳ Thinking...")
        result = chain.invoke({"input": question})

        print(f"\n💬 Answer:\n{result['answer']}")

        # Show sources
        sources = result.get("context", [])

        if sources:
            seen: set = set()
            print("\n📚 Sources:")
            for doc in sources:
                src = doc.metadata.get("source", "unknown")
                title = doc.metadata.get("title", "")
                label = title if title else Path(src).name if not src.startswith("http") else src
                if label not in seen:
                    seen.add(label)
                    doc_type = doc.metadata.get("type", "")
                    icon = {"pdf": "📄", "markdown": "📝", "web": "🌐"}.get(doc_type, "•")
                    print(f"  {icon} {label}")


# ─────────────────────────────────────────────
# STATS HELPER
# ─────────────────────────────────────────────

def print_stats(all_docs: List[Document], chunks: List[Document]) -> None:
    by_type: Dict[str, int] = {}
    for d in all_docs:
        t = d.metadata.get("type", "unknown")
        by_type[t] = by_type.get(t, 0) + 1

    print("\n" + "─" * 50)
    print("  Ingestion summary")
    print("─" * 50)
    for t, count in by_type.items():
        icon = {"pdf": "📄", "markdown": "📝", "web": "🌐"}.get(t, "•")
        print(f"  {icon} {t:<12} {count:>4} document(s)")
    print(f"  {'chunks':<12} {len(chunks):>4} total")
    print("─" * 50)


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  .NET RAG Pipeline — Ingest + Query")
    print("=" * 60)

    # ── DECIDE: rebuild or load existing store ──────────────────
    chroma_exists = (
        Path(CHROMA_DIR).exists()
        and any(Path(CHROMA_DIR).iterdir())
    )

    if chroma_exists:
        choice = input(
            "\nExisting vector store found.\n"
            "  [1] Skip ingestion — go straight to Q&A\n"
            "  [2] Re-ingest everything (overwrites existing)\n"
            "Choice [1/2]: "
        ).strip()
        rebuild = (choice == "2")
    else:
        rebuild = True

    # ── INGEST ──────────────────────────────────────────────────
    if rebuild:
        # 1. Load all sources
        pdf_docs  = load_pdfs(PDF_DIR)
        md_docs   = load_markdown(MARKDOWN_DIR)
        web_docs  = scrape_dotnet_docs(DOTNET_URLS)

        all_docs  = pdf_docs + md_docs + web_docs

        if not all_docs:
            print("\n⚠  No documents loaded. Check your PDF_DIR, MARKDOWN_DIR "
                  "and internet connection, then re-run.")
            return

        # 2. Chunk
        chunks = chunk_documents(all_docs)
        print_stats(all_docs, chunks)

        # 3. Embed + persist
        vectorstore = build_vector_store(chunks)
    else:
        print("\n📂 Loading existing vector store...")
        vectorstore = load_vector_store()
        print("  ✓ Ready")

    # ── QUERY ───────────────────────────────────────────────────
    chain = build_rag_chain(vectorstore)
    interactive_qa(chain)


if __name__ == "__main__":
    main()
