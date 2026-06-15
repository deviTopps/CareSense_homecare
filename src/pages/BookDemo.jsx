import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BRAND_LOGO_SRC } from '../constants/brandAssets';
import './BookDemo.css';

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  agencyName: '',
  agencySize: '',
  message: '',
};

const AGENCY_SIZES = [
  '1–10 patients',
  '11–50 patients',
  '51–200 patients',
  '200+ patients',
];

export default function BookDemo() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('https://formsubmit.co/ajax/services.caresense@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: `Demo Request from ${form.fullName}`,
          'Full Name': form.fullName,
          Email: form.email,
          Phone: form.phone,
          'Agency Name': form.agencyName,
          'Agency Size': form.agencySize,
          Message: form.message || 'No additional message',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cs-demo">
      <header className="cs-demo__header">
        <Link to="/" className="cs-demo__logo-link">
          <img src={BRAND_LOGO_SRC} alt="CareSense" className="cs-demo__logo" />
        </Link>
      </header>

      <main className="cs-demo__main">
        <div className="cs-demo__grid">
          <div className="cs-demo__info">
            <h1 className="cs-demo__title">See CareSense in action</h1>
            <p className="cs-demo__subtitle">
              Book a personalised walkthrough of the platform. We'll show you how CareSense
              can streamline scheduling, compliance, and care delivery for your agency.
            </p>

            <div className="cs-demo__benefits">
              <div className="cs-demo__benefit">
                <span className="cs-demo__benefit-icon">&#9201;</span>
                <div>
                  <strong>30-minute session</strong>
                  <p>Quick, focused demo tailored to your agency's needs</p>
                </div>
              </div>
              <div className="cs-demo__benefit">
                <span className="cs-demo__benefit-icon">&#9745;</span>
                <div>
                  <strong>No commitment</strong>
                  <p>Explore the platform with zero obligation</p>
                </div>
              </div>
              <div className="cs-demo__benefit">
                <span className="cs-demo__benefit-icon">&#128274;</span>
                <div>
                  <strong>Live Q&A</strong>
                  <p>Get answers from our product team in real time</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cs-demo__form-wrap">
            {submitted ? (
              <div className="cs-demo__success">
                <span className="cs-demo__success-icon">&#10003;</span>
                <h2>Thank you!</h2>
                <p>
                  We've received your demo request. Our team will reach out within 24 hours
                  to schedule your session.
                </p>
                <Link to="/" className="cs-btn cs-btn--primary">
                  Back to Home
                </Link>
              </div>
            ) : (
              <form className="cs-demo__form" onSubmit={handleSubmit}>
                <h2 className="cs-demo__form-title">Book your free demo</h2>

                <div className="cs-demo__field">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    placeholder="e.g. Kwame Asante"
                    value={form.fullName}
                    onChange={handleChange}
                  />
                </div>

                <div className="cs-demo__field">
                  <label htmlFor="email">Work Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@agency.com"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="cs-demo__field">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="+233 XXX XXX XXX"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                <div className="cs-demo__field">
                  <label htmlFor="agencyName">Agency / Organisation Name *</label>
                  <input
                    id="agencyName"
                    name="agencyName"
                    type="text"
                    required
                    placeholder="Your agency name"
                    value={form.agencyName}
                    onChange={handleChange}
                  />
                </div>

                <div className="cs-demo__field">
                  <label htmlFor="agencySize">Agency Size</label>
                  <select
                    id="agencySize"
                    name="agencySize"
                    value={form.agencySize}
                    onChange={handleChange}
                  >
                    <option value="">Select size</option>
                    {AGENCY_SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="cs-demo__field">
                  <label htmlFor="message">Anything you'd like us to cover?</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={3}
                    placeholder="Tell us about your biggest challenges..."
                    value={form.message}
                    onChange={handleChange}
                  />
                </div>

                <button type="submit" className="cs-btn cs-btn--primary cs-demo__submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request a Demo'}
                </button>

                <p className="cs-demo__privacy">
                  By submitting, you agree to our{' '}
                  <Link to="/privacy">Privacy Policy</Link>.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
