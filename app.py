import streamlit as st
from dotenv import load_dotenv
from PyPDF2 import PdfReader
import os
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from langchain_google_genai import ChatGoogleGenerativeAI
import google.generativeai as genai

def get_pdf_texts(pdf_docs):
    text = ""
    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def get_text_chunks(text):
    text_splitter = CharacterTextSplitter(separator="\n",chunk_size=1000, chunk_overlap=200,length_function=len)
    chunks = text_splitter.split_text(text)
    return chunks

def get_vectorstore(text_chunks):
    embeddings = HuggingFaceBgeEmbeddings(model_name="hkunlp/instructor-xl")
    vectorstore = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    return vectorstore

def get_conversation_chain(vectorstore):
    # Load API key from environment variables
    google_api_key = os.environ.get("GOOGLE_API_KEY")
    
    # Configure the Google Generative AI library
    genai.configure(api_key=google_api_key)
    
    # Using the correct model name for Gemini
    llm = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.7)
    
    memory = ConversationBufferMemory(memory_key='chat_history', return_messages=True)
    conversation_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        retriever=vectorstore.as_retriever(),
        memory=memory
    )
    return conversation_chain

def apply_custom_css():
    # Custom CSS for a modern dark mode look
    st.markdown("""
    <style>
        .main {
            background-color: #0e1117;
            padding: 2rem;
        }
        .stApp {
            max-width: 100%;
            margin: 0;
        }
        h1, h2, h3 {
            color: #09c3f6;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        p {
            color: #e0e0e0;
        }
        .stButton>button {
            background-color: #09c3f6;
            color: #0e1117;
            border-radius: 8px;
            padding: 0.5rem 1.5rem;
            font-weight: bold;
            border: none;
            transition: all 0.3s ease;
        }
        .stButton>button:hover {
            background-color: #0ab6e5;
            transform: translateY(-2px);
        }
        
        /* Main chat container */
        .chat-interface {
            display: flex;
            flex-direction: column;
            height: 75vh;
            background-color: #191e29;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            margin-top: 20px;
            overflow: hidden;
        }
        
        /* Messages area */
        .messages-container {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
            scroll-behavior: smooth;
        }
        
        /* Message styling */
        .message-row {
            display: flex;
            width: 100%;
        }
        
        .user-message-container {
            display: flex;
            justify-content: flex-end;
            width: 100%;
        }
        
        .bot-message-container {
            display: flex;
            justify-content: flex-start;
            width: 100%;
        }
        
        .user-message {
            background-color: #09c3f6;
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 18px 18px 0 18px;
            margin: 5px 0;
            max-width: 80%;
            word-wrap: break-word;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .bot-message {
            background-color: #2b3245;
            color: #ffffff;
            padding: 12px 18px;
            border-radius: 18px 18px 18px 0;
            margin: 5px 0;
            max-width: 80%;
            word-wrap: break-word;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        /* Input area styling */
        .input-container {
            padding: 15px;
            background-color: #131722;
            border-top: 1px solid #2b3245;
            position: sticky;
            bottom: 0;
        }
        
        /* Form styling */
        .chat-form {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .input-field {
            flex-grow: 1;
        }
        
        .send-button {
            flex-shrink: 0;
        }
        
        /* Style for custom input */
        .custom-input {
            background-color: #2b3245;
            color: white;
            border: 1px solid #40485c;
            border-radius: 20px;
            padding: 12px 20px;
            width: 100%;
            font-size: 16px;
        }
        
        .custom-input:focus {
            outline: none;
            border-color: #09c3f6;
            box-shadow: 0 0 0 2px rgba(9, 195, 246, 0.25);
        }
        
        /* Empty state */
        .empty-chat-message {
            text-align: center;
            color: #6c757d;
            padding: 30px;
            margin: auto;
        }
        
        /* Fix spacing issues */
        .block-container {
            padding-top: 2rem;
            padding-bottom: 1rem;
            max-width: 100%;
        }
        
        /* Hide streamlit elements */
        div.stButton > button[kind="formSubmit"] {
            width: auto;
            background-color: #09c3f6;
            font-weight: bold;
            padding: 0.5rem 1.5rem;
        }
        
        /* Hide default form styling */
        .stForm {
            border: none;
            padding: 0;
            background-color: transparent;
        }
        
        /* Streamlit element hiding */
        #MainMenu, footer, header {
            visibility: hidden;
        }
        
        /* Other existing styles */
        .stSidebar {
            background-color: #191e29;
            padding: 1rem;
            border-right: 1px solid #2b3245;
        }
        
        /* Revised chat container styling - simpler structure */
        .chat-container {
            background-color: #191e29;
            border-radius: 10px;
            padding: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            height: 75vh;
            overflow: hidden;
        }
        .chat-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .chat-input-area {
            background-color: #191e29;
            padding: 15px;
            border-top: 1px solid #2b3245;
            margin-top: auto;
        }
    </style>
    """, unsafe_allow_html=True)

def main():
    # Load environment variables before anything else
    load_dotenv()
    
    # Set page configuration with dark theme
    st.set_page_config(
        page_title="PDF AI Assistant", 
        page_icon="📚",
        layout="wide",
        initial_sidebar_state="expanded",
        menu_items={
            'Get Help': 'https://github.com/yourusername/pdf-ai-assistant',
            'About': "# PDF AI Assistant\nAsk questions about your documents using AI."
        }
    )
    
    # Apply custom CSS for dark mode
    apply_custom_css()
    
    # Initialize session state
    if 'conversation' not in st.session_state:
        st.session_state.conversation = None
    if 'chat_history' not in st.session_state:
        st.session_state.chat_history = []
    if 'documents_processed' not in st.session_state:
        st.session_state.documents_processed = False
    
    # Function to handle sending a message
    def send_message():
        # Get the question from the text input widget value
        user_question = st.session_state.user_input
        
        if user_question and st.session_state.conversation:
            # Add user message to chat history immediately
            st.session_state.chat_history.append({"type": "user", "content": user_question})
            
            # Process with AI and add response
            with st.spinner("Thinking..."):
                response = st.session_state.conversation.invoke({"question": user_question})
                answer = response["answer"]
                st.session_state.chat_history.append({"type": "bot", "content": answer})
    
    # Sidebar for document management
    with st.sidebar:
        st.markdown("<h2 class='sidebar-title'>📄 Document Manager</h2>", unsafe_allow_html=True)
        
        # Use a container div for better spacing
        st.markdown("<div class='sidebar-section'>", unsafe_allow_html=True)
        st.markdown("<h3>Upload PDF Documents</h3>", unsafe_allow_html=True)
        st.markdown("<p>Select one or more PDF files to process</p>", unsafe_allow_html=True)
        
        # Single file uploader for all PDFs
        pdf_docs = st.file_uploader("Upload PDF files", 
                                  accept_multiple_files=True, 
                                  type=['pdf'],
                                  help="Upload your PDF documents here")
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Process button in its own section
        st.markdown("<div class='sidebar-section'>", unsafe_allow_html=True)
        if st.button("Process Documents", key="process_docs"):
            if pdf_docs:
                with st.spinner("Processing your documents..."):
                    # Get PDF text
                    raw_texts = get_pdf_texts(pdf_docs)
                    # Get text chunks
                    text_chunks = get_text_chunks(raw_texts)
                    # Create vector store
                    vectorstore = get_vectorstore(text_chunks)
                    # Create conversation chain
                    st.session_state.conversation = get_conversation_chain(vectorstore)
                    st.session_state.documents_processed = True
                    
                st.success(f"✅ {len(pdf_docs)} document(s) processed successfully!")
            else:
                st.error("⚠️ Please upload at least one PDF document.")
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Document status indicator in its own section
        st.markdown("<div class='sidebar-section'>", unsafe_allow_html=True)
        if st.session_state.documents_processed:
            st.markdown("""
            <div class="document-status" style="background-color: #1e4b3d; color: #78ceb4;">
                <strong>Status:</strong> Documents ready for queries
            </div>
            """, unsafe_allow_html=True)
        else:
            st.markdown("""
            <div class="document-status" style="background-color: #4d242a; color: #ff8b94;">
                <strong>Status:</strong> No documents processed yet
            </div>
            """, unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Additional information in sidebar
        st.markdown("<div class='sidebar-section'>", unsafe_allow_html=True)
        st.markdown("### How To Use")
        st.markdown("""
        1. Upload PDF documents
        2. Click "Process Documents"
        3. Ask questions about the content
        """)
        st.markdown("</div>", unsafe_allow_html=True)
    
    # Main content area with improved structure
    st.markdown("<h1>📚 PDF AI Assistant</h1>", unsafe_allow_html=True)
    st.markdown("<p>Ask questions about your uploaded documents to get instant answers.</p>", unsafe_allow_html=True)
    
    # Improved chat interface container
    # st.markdown('<div class="chat-interface">', unsafe_allow_html=True)
    
    # Scrollable messages container
    st.markdown('<div class="messages-container">', unsafe_allow_html=True)
    if not st.session_state.chat_history:
        st.markdown("<div class='empty-chat-message'>Your conversation will appear here</div>", unsafe_allow_html=True)
    else:
        for message in st.session_state.chat_history:
            if message["type"] == "user":
                st.markdown(f"""
                <div class="user-message-container">
                    <div class="user-message">{message["content"]}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="bot-message-container">
                    <div class="bot-message">{message["content"]}</div>
                </div>
                """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)
    
    # Static input area at the bottom
    st.markdown('<div class="input-container">', unsafe_allow_html=True)
    
    # Use a form to prevent automatic submission on Enter
    with st.form(key="chat_form", clear_on_submit=True):
        col1, col2 = st.columns([5, 1])
        
        with col1:
            question = st.text_input("", placeholder="Type your question here...", key="user_input", label_visibility="collapsed")
        
        with col2:
            submit_button = st.form_submit_button("Send")
            
        if submit_button and question:
            if st.session_state.conversation:
                # Add user message to chat history
                st.session_state.chat_history.append({"type": "user", "content": question})
                
                # Process with AI and add response
                with st.spinner("Thinking..."):
                    response = st.session_state.conversation.invoke({"question": question})
                    answer = response["answer"]
                    st.session_state.chat_history.append({"type": "bot", "content": answer})
                
                # Force refresh
                st.rerun()
            else:
                st.warning("⚠️ Please upload and process documents before asking questions.")
    
    st.markdown('</div>', unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

if __name__ == "__main__":
    main()