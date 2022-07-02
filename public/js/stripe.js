/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const bookTour = async (tourId) => {
  try {
    const stripe = Stripe(
      'pk_test_51LGiHyH74NzQGspBRMEGCunL6HFy5vqChgZCyenXBlNG6XajQTUap1Y4fSN3JCKkiO56r0fhlMHgiK8Hnq7IHViO00VrwIkZJ0'
    );
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
