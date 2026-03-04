from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import ProjectMembership, Task

@receiver(post_delete, sender=ProjectMembership)
def unassign_member_tasks(sender, instance, **kwargs):
    Task.objects.filter(
        project=instance.project,
        assigned_to=instance.user
    ).update(assigned_to=None)