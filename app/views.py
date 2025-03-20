import os
from pathlib import Path

from django.db import IntegrityError
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.core.files.storage import FileSystemStorage
from django.contrib.auth.decorators import login_required

from llm.embedding import EmbeddingFactory
from llm.llm_factory import LLMFactory
from document_processor.pdf_processor import PDFProcessor

from .models import Message, CustomUser, Conversation, FileEmbedding, FileAttachment
from .prompt_manager import PromptManager


def process_files(file_path: Path):
    processor = PDFProcessor()

    documents = processor.process(file_path)
    docs_content = [doc.page_content for doc in documents]

    return docs_content


@login_required(login_url='login')
def index(request):
    conversation_id = request.GET.get('conversation_id')
    if conversation_id:
        try:
            conversation = Conversation.objects.get(
                id=conversation_id, user=request.user
            )
            messages = conversation.messages.all().order_by('created_at')

            context = {
                'conversation': conversation,
                'messages': messages,
                'conversations': Conversation.objects.filter(
                    user=request.user
                ).order_by('-updated_at'),
            }
        except Conversation.DoesNotExist:
            return redirect('index')
    else:
        context = {
            'conversations': Conversation.objects.filter(user=request.user).order_by(
                '-updated_at'
            )
        }

    if request.method == 'POST':

        provider = request.POST.get("model")
        model = LLMFactory.get_provider(provider)

        question = request.POST.get('question')

        conversation_id = request.POST.get('conversation_id')

        uploaded_files = request.FILES.getlist('files')

        prompt_manager = PromptManager()

        response = model.generate_text(question)
        if conversation_id:
            try:
                conversation = Conversation.objects.get(
                    id=conversation_id, user=request.user
                )
            except Conversation.DoesNotExist:
                conversation = Conversation.objects.create(user=request.user)
        else:
            conversation = Conversation.objects.create(user=request.user)
            prompt = prompt_manager.get_prompt(
                'request_title', **{'question': question}
            )
            title = model.generate_text(prompt)

            conversation.title = title
        conversation.save()

        message = Message.objects.create(
            conversation=conversation,
            user=request.user,
            question=question,
            answer=response,
            model=provider,
        )

        try:
            if uploaded_files:
                file_attachments = []

                upload_dir = os.path.join(
                    settings.MEDIA_ROOT, 'uploads', str(conversation.user.id)
                )
                os.makedirs(upload_dir, exist_ok=True)

                fs = FileSystemStorage(location=upload_dir)

                for uploaded_file in uploaded_files:
                    file_path = os.path.join(
                        upload_dir,
                        fs.get_valid_name(uploaded_file.name),
                    )
                    filename = fs.save(uploaded_file.name, uploaded_file)
                    file_url = fs.url(filename)

                    if Path(file_path).suffix == '.pdf':
                        # documents = process_files(Path(file_path))
                        processor = PDFProcessor()
                        documents = processor.process(Path(file_path))

                        embedding_model = EmbeddingFactory.get_provider('gemini')
                        embeddings = embedding_model.get_embedding(
                            [doc.page_content for doc in documents]
                        )

                        file_attachment = FileAttachment.objects.create(
                            user=request.user,
                            file=file_url,
                            original_filename=uploaded_file.name,
                            file_type=uploaded_file.content_type,
                            file_size=uploaded_file.size,
                        )

                        file_attachments.append(file_attachment)

                        for idx, doc in enumerate(documents):
                            FileEmbedding.objects.create(
                                file_attachment=file_attachment,
                                content=doc.page_content,
                                embedding=embeddings[idx].values,
                                metadata=doc.metadata,
                            )

            if uploaded_files:
                message.attachments.set(file_attachments)

            response_data = {
                'text': response,
                'conversation_id': str(conversation.id),
            }

            if not response:
                return HttpResponse(
                    "I'm sorry, I couldn't generate a response. Please try again."
                )

            return JsonResponse(response_data)
        except Exception as err:
            return HttpResponse(
                f"Sorry, there was an error processing your request: {str(err)}"
            )

    return render(request, 'index.html', context)


def login_view(request):

    if request.user.is_authenticated:
        return redirect('index')

    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')
        user = authenticate(request, email=email, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')  # Redirect to your chat interface
        else:
            return render(
                request,
                'login.html',
                {'error_message': 'Invalid username or password.'},
            )

    return render(request, 'login.html')


def logout_view(request):
    logout(request)

    return redirect('login')


def password_reset_view(request): ...


@login_required(login_url='login')
def start_new_conversation(request):
    """
    View to start a new conversation
    """
    # conversation = Conversation.objects.create(
    #     user=request.user, title="New Conversation"
    # )
    return redirect('index')

    # return redirect('index')


def delete_conversation(request, conversation_id):
    """
    View to delete a conversation
    """
    if request.user.is_authenticated:
        try:
            conversation = Conversation.objects.get(
                id=conversation_id, user=request.user
            )
            conversation.delete()
        except Conversation.DoesNotExist:
            pass

    return redirect('index')


def register_view(request):
    if request.method == 'POST':

        email = request.POST.get('email')
        password = request.POST.get('password')
        error_message = None

        if len(password) < 8:
            error_message = 'Password must be at least 8 characteres long.'

        if not error_message:
            try:

                user = CustomUser.objects.create_user(email=email, password=password)
                if user:
                    login(request, user)
                    return redirect('index')
            except IntegrityError:
                error_message = "An account with this email already exists."

        return render(request, 'register.html', {'error_message': error_message})

    return render(request, 'register.html')
