from django.db import IntegrityError
from django.http import HttpResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from vertexai.generative_models import GenerativeModel
from django.contrib.auth.decorators import login_required

from .models import CustomUser


@login_required(login_url='login')
def index(request):
    if request.method == 'POST':
        question = request.POST.get('question')

        try:
            model = GenerativeModel(model_name='gemini-1.5-flash-002')

            response_text = model.generate_content(question)

            if not response_text or not response_text.text:
                return HttpResponse(
                    "I'm sorry, I couldn't generate a response. Please try again."
                )

            return HttpResponse(response_text.text)
        except Exception as err:
            return HttpResponse(
                f"Sorry, there was an error processing your request: {str(err)}"
            )

    return render(request, 'index.html')


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
