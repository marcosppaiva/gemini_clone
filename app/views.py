from django.db import IntegrityError
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from vertexai.generative_models import GenerativeModel
from django.contrib.auth.decorators import login_required

from .models import CustomUser, ChatHistory, Conversation
from .prompt_manager import PromptManager


@login_required(login_url='login')
def index(request):

    conversation_id = request.GET.get('conversation_id')
    if conversation_id:
        try:
            conversation = Conversation.objects.get(
                id=conversation_id, user=request.user
            )
            messages = conversation.messages.all().order_by('created_at')
            print(f'Aqui eu recuperei as mesgs {messages}')

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
        model_name = 'gemini-1.5-flash-002'
        question = request.POST.get('question')

        conversation_id = request.POST.get('conversation_id')

        try:
            prompt_manager = PromptManager()

            model = GenerativeModel(model_name=model_name)
            response = model.generate_content(question)

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
                title = model.generate_content(prompt).text

                conversation.title = title

            chat_history = ChatHistory(
                conversation=conversation,
                user=request.user,
                question=question,
                answer=response.text,
                model=model_name,
            )
            chat_history.save()
            conversation.save()

            response_data = {
                'text': response.text,
                'conversation_id': str(conversation.id),
            }

            if not response or not response.text:
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


def start_new_conversation(request):
    """
    View to start a new conversation
    """
    if request.user.is_authenticated:
        conversation = Conversation.objects.create(
            user=request.user, title="New Conversation"
        )
        return redirect('index', conversation_id=conversation.id)

    return redirect('index')


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
