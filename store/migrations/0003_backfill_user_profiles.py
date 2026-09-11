from django.db import migrations


def create_missing_profiles(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    UserProfile = apps.get_model('store', 'UserProfile')
    for user in User.objects.filter(profile__isnull=True):
        UserProfile.objects.create(user=user)


def noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0002_loginotp_phoneotp_userprofile'),
    ]

    operations = [
        migrations.RunPython(create_missing_profiles, noop),
    ]
