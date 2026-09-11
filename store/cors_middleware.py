class MobileCorsMiddleware:
    """
    Lightweight middleware to allow mobile clients (Android & iOS apps, Expo, emulators)
    to interact with the Django backend without CORS blocks.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            from django.http import HttpResponse
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Session-Key'
            return response

        response = self.get_response(request)
        if request.path.startswith('/api/'):
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, X-Session-Key'
        return response
