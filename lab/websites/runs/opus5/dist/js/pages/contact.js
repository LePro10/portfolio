/* ==========================================================================
   pages/contact.js — client-side form validation

   There is no server. The form validates, shows a success state, and stops —
   nothing is transmitted anywhere, which the page says out loud.
   ========================================================================== */

const MESSAGES = {
  'f-name': 'Tell us who you are.',
  'f-email': 'That email address does not look right.',
  'f-msg': 'A few more words would help — twelve characters minimum.',
};

export function init() {
  const form = document.getElementById('cform');
  if (!form) return;

  const status = document.getElementById('cform-status');
  const submit = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll('input[required], textarea[required]')];

  const errorFor = (el) => form.querySelector(`[data-err-for="${el.id}"]`);

  function validate(el, quiet = false) {
    const ok = el.checkValidity();
    const box = errorFor(el);
    if (box && !quiet) box.textContent = ok ? '' : (MESSAGES[el.id] || 'Please check this field.');
    el.setAttribute('aria-invalid', String(!ok));
    return ok;
  }

  fields.forEach((el) => {
    // Only nag after the first blur, then keep up live.
    el.addEventListener('blur', () => validate(el), { once: false });
    el.addEventListener('input', () => {
      if (el.getAttribute('aria-invalid') === 'true') validate(el);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const results = fields.map((el) => validate(el));
    const firstBad = fields[results.indexOf(false)];

    if (firstBad) {
      status.textContent = 'Some fields still need attention.';
      status.className = 'contact__status is-bad';
      firstBad.focus({ preventScroll: false });
      form.animate(
        [
          { transform: 'translateX(0)' },
          { transform: 'translateX(-6px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-3px)' },
          { transform: 'translateX(0)' },
        ],
        { duration: 320, easing: 'ease-out' }
      );
      return;
    }

    // Fake a send so the interaction has weight, then say plainly what happened.
    submit.classList.add('is-sending');
    submit.querySelector('span').textContent = 'Sending';
    status.textContent = 'Encoding…';
    status.className = 'contact__status';

    const name = form.querySelector('#f-name').value.trim().split(/\s+/)[0] || 'friend';

    setTimeout(() => {
      form.classList.add('is-sent');
      submit.classList.remove('is-sending');
      submit.querySelector('span').textContent = 'Sent';
      status.textContent = `Thank you, ${name} — and nothing was transmitted. There is no server.`;
      status.className = 'contact__status is-ok';

      setTimeout(() => {
        form.classList.remove('is-sent');
        submit.querySelector('span').textContent = 'Send';
      }, 4200);
    }, 900);
  });
}
