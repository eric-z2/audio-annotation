from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('audio_capture', '0003_alter_questionassignment_trial_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='audiostorage',
            name='trial_id',
            field=models.CharField(max_length=100),
        ),
    ]
