from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.auth.models import AbstractUser

from .managers import CustomUsermanager


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(_('email address'), unique=True, null=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUsermanager()

    def __str__(self):
        return self.email
