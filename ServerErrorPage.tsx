import { useState, type FormEvent } from 'react';
import {
  Mail,
  MessageSquare,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Github,
  Globe,
  MapPin,
} from 'lucide-react';
import Layout from '../components/Layout';
import { logger } from '../lib/logger';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !subject || !message) {
      setError('Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    logger.info('Contact form submitted', { name, email, subject });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    logger.info('Contact form sent successfully');
    setSent(true);
    setSending(false);
    setName('');
    setEmail('');
    setSubject('');
    setMessage('');
  };

  return (
    <Layout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900">Contact Us</h1>
        <p className="text-sm text-gray-500 mt-1">
          Questions, feedback, or need help with the Rising Waters platform? Reach out.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact info */}
        <div className="space-y-4">
          <div className="card p-5 animate-slide-up">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-50 mb-3">
              <Mail className="w-5 h-5 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Email Support</h3>
            <p className="text-sm text-gray-500 mb-2">Get help with your account or predictions</p>
            <a href="mailto:support@risingwaters.ai" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              support@risingwaters.ai
            </a>
          </div>

          <div className="card p-5 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent-50 mb-3">
              <MessageSquare className="w-5 h-5 text-accent-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">General Inquiries</h3>
            <p className="text-sm text-gray-500 mb-2">Partnerships, press, and other questions</p>
            <a href="mailto:hello@risingwaters.ai" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              hello@risingwaters.ai
            </a>
          </div>

          <div className="card p-5 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 mb-3">
              <MapPin className="w-5 h-5 text-success-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
            <p className="text-sm text-gray-500">
              Remote-first<br />
              Available worldwide
            </p>
          </div>

          <div className="card p-5 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <h3 className="font-semibold text-gray-900 mb-3">Connect</h3>
            <div className="flex gap-3">
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Github className="w-4.5 h-4.5" />
              </a>
              <a href="#" className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                <Globe className="w-4.5 h-4.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Contact form */}
        <div className="lg:col-span-2">
          <div className="card p-6 animate-slide-up">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-16">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-success-50 mb-4">
                  <CheckCircle2 className="w-7 h-7 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Message Sent!</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Thank you for reaching out. We'll get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="btn-secondary mt-6"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label" htmlFor="name">Name</label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="label" htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="label" htmlFor="subject">Subject</label>
                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="input"
                    placeholder="What's this about?"
                  />
                </div>

                <div>
                  <label className="label" htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="input resize-none"
                    placeholder="Tell us more..."
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg bg-error-50 border border-error-200 px-3.5 py-3 text-sm text-error-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={sending} className="btn-primary">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
