import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

const faqs = [
  { q: 'How do I add a new game guide?', a: 'Click the "+ Add Item" button on the main collection page. Fill in the title, category, and notes. You can also upload a .md file.' },
  { q: 'Can I request a guide for a specific game?', a: 'Yes! Visit the Request page and submit your request. Our team will review it.' },
  { q: 'How do I use Markdown in notes?', a: 'Notes support full Markdown syntax including headings, bold, italic, lists, code blocks, tables, and images.' },
  { q: 'Is there an admin panel?', a: 'Yes, administrators can access the admin panel at /admin to manage categories, tags, platforms, and more.' },
  { q: 'Can I export my guides?', a: 'Yes! Open any guide and use the "Download .md" button to export it as a Markdown file.' },
];

export default function ContactPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [openFaq, setOpenFaq] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('general');
  const [message, setMessage] = useState('');

  const inputClass = `w-full px-3 py-2.5 rounded-lg border text-sm outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand-glow ${isDark ? 'bg-dark-surface2 border-dark-border2 text-dark-text' : 'bg-light-surface2 border-light-border2 text-light-text'}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    toast.success('Message sent! We\'ll get back to you soon.');
    setName(''); setEmail(''); setSubject('general'); setMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="w-10 h-0.5 bg-brand rounded-full mb-3" />
        <h1 className={`font-heading text-2xl font-bold ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Contact & Support</h1>
        <p className={`text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Get help or reach out to us</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { icon: '📧', label: 'Email', value: 'hello@gameguide.dev' },
              { icon: '💬', label: 'Discord', value: 'Join our server' },
              { icon: '🕐', label: 'Support Hours', value: 'Mon-Fri 9am-6pm ICT' },
              { icon: '🐛', label: 'Bug Reports', value: 'Use contact form' },
            ].map((card, i) => (
              <div key={i} className={`rounded-lg border p-3 ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
                <div className="text-xl mb-1">{card.icon}</div>
                <div className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>{card.label}</div>
                <div className={`text-xs ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{card.value}</div>
              </div>
            ))}
          </div>

          <h2 className={`font-heading font-bold text-lg mb-3 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className={`rounded-lg border overflow-hidden ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className={`w-full text-left px-4 py-3 text-sm font-medium flex justify-between items-center ${isDark ? 'text-dark-text hover:bg-dark-surface2' : 'text-light-text hover:bg-light-surface2'}`}>
                  {faq.q}
                  <span className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className={`px-4 pb-3 text-sm ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-xl border p-6 h-fit ${isDark ? 'bg-dark-surface border-dark-border' : 'bg-light-surface border-light-border'}`}>
          <h2 className={`font-heading font-bold text-lg mb-4 ${isDark ? 'text-dark-text' : 'text-light-text'}`}>Send a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className={inputClass} />
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className={inputClass}>
                <option value="general">General Inquiry</option>
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-dark-muted' : 'text-light-muted'}`}>Message</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help?" rows={4} className={`${inputClass} resize-y`} />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-dim transition-colors">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
}
