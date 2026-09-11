/**
 * Razorpay Payment Checkout Flow
 * Opens Razorpay's official Standard Checkout for the given order.
 */

function launchRazorpayCheckout(config) {
  if (!window.Razorpay) {
    alert('Could not load the Razorpay payment gateway. Please check your connection and try again.');
    return;
  }

  const options = {
    key: config.key,
    amount: config.amount,
    currency: config.currency,
    name: config.name,
    description: config.description,
    image: config.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100",
    notes: {
      order_number: config.order_number
    },
    prefill: {
      name: config.customer_name,
      email: config.customer_email,
      contact: config.customer_phone
    },
    theme: {
      color: "#10B981"
    },
    handler: function (response) {
      // Send payment details to backend callback for signature verification
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = config.callback_url;

      const fields = {
        csrfmiddlewaretoken: config.csrf_token,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
        order_number: config.order_number
      };

      for (const [name, value] of Object.entries(fields)) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    }
  };

  if (config.order_id && config.order_id.trim() !== '') {
    options.order_id = config.order_id;
  }

  const rzp1 = new Razorpay(options);
  rzp1.on('payment.failed', function (response) {
    console.error("Razorpay Error Details:", response.error);
    const desc = response.error ? (response.error.description || response.error.reason || response.error.code) : "Payment Failed";
    alert("Payment Failed: " + desc + "\n\nPlease try again, or choose Cash on Delivery at checkout.");
  });
  rzp1.open();
}
