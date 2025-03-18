from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from django.db.models import Q, Sum
from django.shortcuts import render, redirect, get_object_or_404
from django.core.paginator import EmptyPage, Paginator, PageNotAnInteger
from django.contrib.auth.decorators import login_required

from app.models import FileAttachment


def format_file_size(size_bytes):
    """
    Format bytes to human-readable size
    """
    if size_bytes < 1024:
        return f"{size_bytes} bytes"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.1f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"


@login_required(login_url='login')
def file_manager(request):
    search_query = request.GET.get('search', '')

    sort_by = request.GET.get('sort', 'newest')

    files_query = FileAttachment.objects.filter(user=request.user)

    if search_query:
        files_query = files_query.filter(
            Q(original_filename__contains=search_query)
            | Q(file_type__icontains=search_query)
        )

    if sort_by == 'oldest':
        files_query = files_query.order_by('uploaded_at')
    elif sort_by == 'name':
        files_query = files_query.order_by('original_filename')
    elif sort_by == 'size':
        files_query = files_query.order_by('-file_size')
    else:
        files_query = files_query.order_by('-uploaded_at')

    total_files = files_query.count()
    total_size = files_query.aggregate(Sum('file_size'))['file_size__sum'] or 0
    total_size_formatted = format_file_size(total_size)

    recent_date = timezone.now() - timedelta(days=7)
    recent_uploads = files_query.filter(uploaded_at__gte=recent_date).count()

    paginator = Paginator(files_query, 12)
    page = request.GET.get('page')

    try:
        files = paginator.page(page)
    except PageNotAnInteger:
        files = paginator.page(1)
    except EmptyPage:
        files = paginator.page(paginator.num_pages)

    context = {
        'files': files,
        'total_files': total_files,
        'total_size_formatted': total_size_formatted,
        'recent_uploads': recent_uploads,
        'search_query': search_query,
        'sort_by': sort_by,
        'current_view': 'files',
        'is_paginated': paginator.num_pages > 1,
        'page_obj': files,
    }

    return render(request, 'file_manager.html', context)
