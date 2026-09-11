/**
 * Razorpay Payment Checkout Flow
 * Handles opening Razorpay Standard Checkout or interactive Sandbox Simulation.
 */

function launchRazorpayCheckout(config) {
  // If Razorpay JS library is loaded and a valid key is present
  if (window.Razorpay && !config.key.startsWith('rzp_test_GreenMobileStoreKey')) {
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
    };

    if (config.order_id && config.order_id.trim() !== '') {
      options.order_id = config.order_id;
    }

    options.handler = function (response) {
        // Send payment details to backend callback
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = config.callback_url;

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrfmiddlewaretoken';
        csrfInput.value = config.csrf_token;
        form.appendChild(csrfInput);

        const orderIdInput = document.createElement('input');
        orderIdInput.type = 'hidden';
        orderIdInput.name = 'razorpay_order_id';
        orderIdInput.value = response.razorpay_order_id;
        form.appendChild(orderIdInput);

        const paymentIdInput = document.createElement('input');
        paymentIdInput.type = 'hidden';
        paymentIdInput.name = 'razorpay_payment_id';
        paymentIdInput.value = response.razorpay_payment_id;
        form.appendChild(paymentIdInput);

        const signatureInput = document.createElement('input');
        signatureInput.type = 'hidden';
        signatureInput.name = 'razorpay_signature';
        signatureInput.value = response.razorpay_signature;
        form.appendChild(signatureInput);

        const orderNumInput = document.createElement('input');
        orderNumInput.type = 'hidden';
        orderNumInput.name = 'order_number';
        orderNumInput.value = config.order_number;
        form.appendChild(orderNumInput);

        document.body.appendChild(form);
        form.submit();
      },
      prefill: {
        name: config.customer_name,
        email: config.customer_email,
        contact: config.customer_phone
      },
      theme: {
        color: "#10B981"
      }
    };

    const rzp1 = new Razorpay(options);
    rzp1.on('payment.failed', function (response) {
      console.error("Razorpay Error Details:", response.error);
      const desc = response.error ? (response.error.description || response.error.reason || response.error.code) : "Payment Failed";
      // Open test gateway modal if API rejected (e.g. order not created in live account or test mode)
      const modalEl = document.getElementById('razorpaySandboxModal');
      if (modalEl) {
        alert("Razorpay Live API Notice: " + desc + "\n\nOpening test simulator for you to complete the test payment.");
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
      } else {
        alert("Payment Failed: " + desc);
      }
    });
    rzp1.open();
  } else {
    // Show Sandbox Simulator Modal
    const modalEl = document.getElementById('razorpaySandboxModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  }
}
