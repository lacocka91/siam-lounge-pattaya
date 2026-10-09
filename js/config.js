/* Enter only owner-confirmed contact details. Empty strings keep actions unavailable.
   WhatsApp: international digits, including country code, without + or spaces.
   Change these four values to enable request hand-off; nothing is sent automatically. */
(() => {
  const centralWhatsApp = '';
  const pratumnakWhatsApp = '';
  const centralEmail = '';
  const pratumnakEmail = '';

  window.SIAM_CONFIG = {
    // Leave empty until the ORIGINAL logo is provided. No missing-file request is made.
    logo: '', // e.g. 'assets/images/logo-siam-lounge.svg'
    locations: {
      central: {
        name: 'Siam Lounge Central', phone: '', whatsapp: centralWhatsApp,
        email: centralEmail, maps: '', line: '',
        facebook: 'https://www.facebook.com/siamloungepattaya',
        address: { en: '', de: '', th: '' }, hours: { en: '', de: '', th: '' }
      },
      pratumnak: {
        name: 'Siam Lounge Pratumnak', phone: '', whatsapp: pratumnakWhatsApp,
        email: pratumnakEmail, maps: '', line: '',
        facebook: 'https://www.facebook.com/SiamLoungePratumnak',
        address: { en: '', de: '', th: '' }, hours: { en: '', de: '', th: '' }
      }
    },
    stay: {
      booking: 'https://www.booking.com/hotel/th/siam-lounge-pratumnak.de.html',
      agoda: ''
    }
  };
})();
