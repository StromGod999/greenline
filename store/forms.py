from django import forms
from django.contrib.auth.models import User
from .models import Order, Review, Product, ProductSpecification

class CheckoutForm(forms.ModelForm):
    scheduled_date = forms.DateField(
        widget=forms.DateInput(attrs={
            'type': 'date',
            'class': 'form-control green-input',
            'required': 'required'
        })
    )

    class Meta:
        model = Order
        fields = [
            'full_name', 'email', 'phone', 'address', 'city', 'state', 'pincode',
            'scheduled_date', 'delivery_time_slot', 'schedule_notes',
            'order_notes', 'payment_method'
        ]
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'John Doe'}),
            'email': forms.EmailInput(attrs={'class': 'form-control green-input', 'placeholder': 'john@example.com'}),
            'phone': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': '+1 (555) 019-2834'}),
            'address': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': '124 Emerald Avenue, Suite 4B'}),
            'city': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'New York'}),
            'state': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'NY'}),
            'pincode': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': '10001'}),
            'delivery_time_slot': forms.Select(attrs={'class': 'form-select green-input'}),
            'schedule_notes': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'e.g., Leave with doorman / Ring bell twice'}),
            'order_notes': forms.Textarea(attrs={'class': 'form-control green-input', 'rows': 2, 'placeholder': 'Optional delivery notes'}),
            'payment_method': forms.RadioSelect(attrs={'class': 'form-check-input'}),
        }


class ReviewForm(forms.ModelForm):
    class Meta:
        model = Review
        fields = ['author_name', 'rating', 'title', 'comment']
        widgets = {
            'author_name': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'Your Name'}),
            'rating': forms.Select(choices=[(i, f"{i} Stars ({'★'*i})") for i in range(5, 0, -1)], attrs={'class': 'form-select green-input'}),
            'title': forms.TextInput(attrs={'class': 'form-control green-input', 'placeholder': 'Headline for your review'}),
            'comment': forms.Textarea(attrs={'class': 'form-control green-input', 'rows': 3, 'placeholder': 'What did you like or dislike about this phone?'}),
        }


class ProductAdminForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control green-input'}),
            'slug': forms.TextInput(attrs={'class': 'form-control green-input'}),
            'brand': forms.Select(attrs={'class': 'form-select green-input'}),
            'category': forms.Select(attrs={'class': 'form-select green-input'}),
            'price': forms.NumberInput(attrs={'class': 'form-control green-input'}),
            'discount_price': forms.NumberInput(attrs={'class': 'form-control green-input'}),
            'stock': forms.NumberInput(attrs={'class': 'form-control green-input'}),
            'image_url': forms.URLInput(attrs={'class': 'form-control green-input'}),
            'short_description': forms.TextInput(attrs={'class': 'form-control green-input'}),
            'description': forms.Textarea(attrs={'class': 'form-control green-input', 'rows': 4}),
        }


