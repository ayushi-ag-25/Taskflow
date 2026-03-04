from django.db import models
from django.conf import settings

class Project(models.Model):
    name=models.CharField(max_length=200)
    description=models.TextField()

    owner=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_projects'
        )
    
    members=models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProjectMembership',
        related_name='projects',
        blank=True
    )

    created_at=models.DateTimeField(auto_now_add=True)

class ProjectMembership(models.Model):
    status_choices=[
        ('invited', 'Invited'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]

    user=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )

    project=models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='memberships'
    )

    status=models.CharField(
        choices=status_choices,
        max_length=10,
        default='accepted'
    )

    invited_at = models.DateTimeField(auto_now_add=True)
    accepted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'project')  # no duplicate invitations!

    def __str__(self):
        return f"{self.user.username} → {self.project.name} ({self.status})"


class Task(models.Model):

    status_choices=[
        ('completed','Completed'),
        ('pending','Pending')
    ]

    title=models.CharField(max_length=200)
    description=models.TextField()

    project=models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='tasks',
    )

    assigned_to=models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tasks'
    )

    status=models.CharField(
        max_length=20,
        choices=status_choices,
        default='pending'
    )

    due_date=models.DateField(null=True,blank=True)
    created_at=models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


