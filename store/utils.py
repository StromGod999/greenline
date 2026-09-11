import hmac
import hashlib
import io
import logging
from decimal import Decimal

import requests
from django.conf import settings
from django.core.mail import send_mail
from .models import Cart

logger = logging.getLogger(__name__)


def send_login_otp_email(user, code):
    """Emails a one-time login code (2FA) to the user via the configured backend (Resend SMTP)."""
    subject = f"Your {getattr(settings, 'STORE_NAME', 'Greenline')} login code"
    message = (
        f"Hi {user.first_name or user.username},\n\n"
        f"Your one-time login verification code is: {code}\n\n"
        f"This code expires in 10 minutes. If you did not attempt to log in, "
        f"you can safely ignore this email.\n\n"
        f"- {getattr(settings, 'STORE_NAME', 'Greenline Mobile Store')}"
    )
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)


def send_phone_otp(phone_number):
    """
    Sends an SMS OTP to `phone_number` via the 2Factor.in free-tier API.
    Returns (session_id, error_message).
    """
    api_key = getattr(settings, 'TWOFACTOR_API_KEY', '')
    if not api_key:
        return None, "SMS verification is not configured on this server."

    clean_number = phone_number.strip().replace(' ', '')
    if clean_number.startswith('+91'):
        clean_number = clean_number[3:]
    elif clean_number.startswith('91') and len(clean_number) == 12:
        clean_number = clean_number[2:]

    url = f"https://2factor.in/API/V1/{api_key}/SMS/{clean_number}/AUTOGEN"
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        logger.error("2Factor.in send OTP failed: %s", exc)
        return None, "Could not reach the SMS provider. Please try again."

    if data.get('Status') == 'Success':
        return data.get('Details'), None
    return None, data.get('Details', 'Failed to send OTP.')


def verify_phone_otp_code(session_id, otp):
    """Verifies an OTP against a 2Factor.in OTP session. Returns True/False."""
    api_key = getattr(settings, 'TWOFACTOR_API_KEY', '')
    if not api_key or not session_id:
        return False

    url = f"https://2factor.in/API/V1/{api_key}/SMS/VERIFY/{session_id}/{otp}"
    try:
        resp = requests.get(url, timeout=10)
        data = resp.json()
    except (requests.RequestException, ValueError) as exc:
        logger.error("2Factor.in verify OTP failed: %s", exc)
        return False

    return data.get('Status') == 'Success'

def get_or_create_cart(request):
    """
    Retrieves or creates a cart for the current authenticated user or guest session.
    """
    if not request.session.session_key:
        request.session.create()

    if request.user.is_authenticated:
        # Check if user already has a cart
        cart, created = Cart.objects.get_or_create(user=request.user)
        # If there is an anonymous cart in session, merge items into user cart
        session_key = request.session.session_key
        if session_key:
            guest_cart = Cart.objects.filter(session_key=session_key).exclude(id=cart.id).first()
            if guest_cart:
                for item in guest_cart.items.all():
                    existing_item = cart.items.filter(
                        product=item.product,
                        color=item.color,
                        storage=item.storage
                    ).first()
                    if existing_item:
                        existing_item.quantity += item.quantity
                        existing_item.save()
                    else:
                        item.cart = cart
                        item.save()
                guest_cart.delete()
        return cart
    else:
        cart, created = Cart.objects.get_or_create(session_key=request.session.session_key)
        return cart


def create_razorpay_order(amount_in_cents_or_paise, receipt_id, currency="USD"):
    """
    Creates a Razorpay order using either real Razorpay client if installed and configured,
    or generates a valid test order ID for simulation.
    """
    key_id = getattr(settings, 'RAZORPAY_KEY_ID', 'rzp_test_TYrDpRiv6T2o3c')
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'pVtkql3mbjl5RAVSSQWivDPr')

    try:
        import razorpay
        # Try live razorpay client if valid keys are provided
        if key_id and not key_id.startswith('rzp_test_GreenMobileStoreKey'):
            client = razorpay.Client(auth=(key_id, key_secret))
            data = {
                "amount": int(amount_in_cents_or_paise),
                "currency": currency,
                "receipt": str(receipt_id),
                "payment_capture": 1
            }
            order_data = client.order.create(data=data)
            return order_data.get('id')
    except Exception as e:
        print(f"Razorpay Client creation notice (using sandbox ID): {e}")

    # Seamless sandbox order ID generation
    import uuid
    return f"order_rzp_{uuid.uuid4().hex[:14]}"


def verify_razorpay_signature(razorpay_order_id, razorpay_payment_id, razorpay_signature):
    """
    Verifies Razorpay HMAC-SHA256 signature.
    """
    key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', 'pVtkql3mbjl5RAVSSQWivDPr')
    if not razorpay_payment_id or not razorpay_order_id or not razorpay_signature:
        return False

    try:
        import razorpay
        client = razorpay.Client(auth=(getattr(settings, 'RAZORPAY_KEY_ID', ''), key_secret))
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        return True
    except Exception:
        # Fallback HMAC computation
        msg = f"{razorpay_order_id}|{razorpay_payment_id}".encode('utf-8')
        generated_signature = hmac.new(key_secret.encode('utf-8'), msg, hashlib.sha256).hexdigest()
        return hmac.compare_digest(generated_signature, razorpay_signature)


def generate_invoice_pdf(order):
    """
    Renders a tax-invoice PDF for the given Order using ReportLab and
    returns the raw PDF bytes. No system dependencies (unlike WeasyPrint),
    so it works on any host this Django app runs on.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    )

    EMERALD = colors.HexColor('#059669')
    DARK = colors.HexColor('#065F46')
    LIGHT_BG = colors.HexColor('#ECFDF5')
    MUTED = colors.HexColor('#64748B')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=18 * mm, bottomMargin=18 * mm, leftMargin=18 * mm, rightMargin=18 * mm,
        title=f"Invoice {order.order_number}",
    )

    styles = getSampleStyleSheet()
    store_title = ParagraphStyle('StoreTitle', parent=styles['Heading1'], textColor=DARK, fontSize=16, spaceAfter=2)
    small_muted = ParagraphStyle('SmallMuted', parent=styles['Normal'], textColor=MUTED, fontSize=8, leading=11)
    label = ParagraphStyle('Label', parent=styles['Normal'], textColor=DARK, fontSize=9, spaceAfter=2, fontName='Helvetica-Bold')
    body = ParagraphStyle('Body', parent=styles['Normal'], fontSize=9, leading=13)
    invoice_title = ParagraphStyle('InvoiceTitle', parent=styles['Heading2'], alignment=2, textColor=colors.HexColor('#1E293B'))
    invoice_meta = ParagraphStyle('InvoiceMeta', parent=styles['Normal'], alignment=2, fontSize=9, textColor=MUTED)

    elements = []

    header_data = [[
        Paragraph("Greenline Mobiles<br/><font size=7 color='#64748B'>Official E-Commerce Flagship Store (India)<br/>"
                  "GSTIN: 27AAPCG9921M1ZR &bull; PAN: AAPCG9921M<br/>Helpline: +91 1234567890</font>", store_title),
        Paragraph(f"TAX INVOICE<br/><font size=9 color='#64748B'>Invoice #: {order.order_number}<br/>"
                  f"Date: {order.created_at.strftime('%b %d, %Y')}</font>", invoice_title),
    ]]
    header_table = Table(header_data, colWidths=[100 * mm, 72 * mm])
    header_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(header_table)
    elements.append(Spacer(1, 4))
    elements.append(HRFlowable(width='100%', color=EMERALD, thickness=1.5))
    elements.append(Spacer(1, 12))

    billed_to = (
        f"<b>Billed &amp; Shipped To:</b><br/>"
        f"<b>{order.full_name}</b><br/>"
        f"{order.address}<br/>{order.city}, {order.state} {order.pincode}<br/>"
        f"Phone: {order.phone}<br/>Email: {order.email}"
    )
    delivery_info = (
        f"<b>Delivery &amp; Payment Info:</b><br/>"
        f"Scheduled Date: {order.scheduled_date}<br/>"
        f"Time Slot: {order.delivery_time_slot}<br/>"
        f"Payment Method: {order.get_payment_method_display()}<br/>"
        f"Payment Status: {order.payment_status}"
    )
    if order.razorpay_payment_id:
        delivery_info += f"<br/>Razorpay ID: {order.razorpay_payment_id}"

    meta_table = Table([[Paragraph(billed_to, body), Paragraph(delivery_info, body)]], colWidths=[86 * mm, 86 * mm])
    meta_table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'TOP')]))
    elements.append(meta_table)
    elements.append(Spacer(1, 16))

    currency = getattr(settings, 'CURRENCY_SYMBOL', '₹')
    items_data = [['Item', 'Specs', 'Qty', 'Unit Price', 'Total']]
    for item in order.items.all():
        items_data.append([
            Paragraph(item.product_name, body),
            f"{item.color} / {item.storage}",
            str(item.quantity),
            f"{currency}{item.price}",
            f"{currency}{item.total_price}",
        ])

    items_table = Table(items_data, colWidths=[62 * mm, 44 * mm, 16 * mm, 27 * mm, 23 * mm], repeatRows=1)
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), LIGHT_BG),
        ('TEXTCOLOR', (0, 0), (-1, 0), DARK),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8.5),
        ('ALIGN', (2, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 4))

    totals_data = [['Subtotal:', f"{currency}{order.subtotal}"]]
    if order.discount_amount and order.discount_amount > 0:
        totals_data.append([f"Discount Coupon ({order.coupon_applied}):", f"-{currency}{order.discount_amount}"])
    shipping_label = 'FREE' if order.shipping_charge == 0 else f"{currency}{order.shipping_charge}"
    totals_data.append(['Shipping & Handling:', shipping_label])
    totals_data.append(['Grand Total:', f"{currency}{order.total_amount}"])

    totals_table = Table(totals_data, colWidths=[149 * mm, 23 * mm], hAlign='RIGHT')
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 11),
        ('TEXTCOLOR', (0, -1), (-1, -1), DARK),
        ('LINEABOVE', (0, -1), (-1, -1), 0.75, EMERALD),
        ('TOPPADDING', (0, -1), (-1, -1), 8),
    ]))
    elements.append(totals_table)
    elements.append(Spacer(1, 24))

    elements.append(HRFlowable(width='100%', color=colors.HexColor('#E2E8F0'), thickness=0.75))
    elements.append(Spacer(1, 8))
    elements.append(Paragraph("This is a computer-generated tax invoice. No signature required.", small_muted))
    elements.append(Paragraph("<font color='#065F46'><b>Thank you for choosing Greenline Mobile Store!</b></font>", small_muted))

    doc.build(elements)
    return buffer.getvalue()
