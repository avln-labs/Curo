import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    id: '1',
    question: 'How does prescription generation work?',
    answer: 'Prescriptions are securely generated in PDF format within 20 seconds of completing a consultation. Our AI pre-fills the common medications, and the final PDF is ready to be sent directly to your patient\'s WhatsApp or email.'
  },
  {
    id: '2',
    question: 'Is Curo compliant with health data regulations?',
    answer: 'Absolutely. We follow stringent data privacy practices. All patient health records are encrypted at rest and in transit. Your clinical data remains your property, securely vaulted.'
  },
  {
    id: '3',
    question: 'Can I integrate my existing clinic schedule?',
    answer: 'Yes! Curo allows you to define your own working hours, block time-offs, and seamlessly maps to your daily availability so patients only book when you are truly free.'
  },
  {
    id: '4',
    question: 'What is the pricing model for independent doctors?',
    answer: 'We believe in a frictionless experience. Our core operating system is completely free for independent practitioners. We only charge a minimal flat processing fee on online payments processed directly through the platform.'
  }
];

export function AnimatedFAQ() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section style={{ width: '100%', padding: '40px 24px 100px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ 
            fontFamily: 'var(--font-serif)', 
            fontSize: 'clamp(2rem, 4vw, 3rem)', 
            marginBottom: '48px',
            textAlign: 'center',
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}
        >
          Frequently Asked Questions
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {FAQS.map((faq, index) => {
            const isOpen = openId === faq.id;
            const isHovered = hoveredId === faq.id;

            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                onMouseEnter={() => setHoveredId(faq.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setOpenId(isOpen ? null : faq.id)}
                style={{
                  border: '1px solid',
                  borderColor: isHovered || isOpen ? 'var(--primary)' : 'var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  background: isHovered || isOpen ? 'rgba(255, 255, 255, 0.7)' : 'var(--surface)',
                  backdropFilter: isHovered || isOpen ? 'blur(20px) saturate(180%)' : 'none',
                  WebkitBackdropFilter: isHovered || isOpen ? 'blur(20px) saturate(180%)' : 'none',
                  boxShadow: isHovered || isOpen ? '0 12px 40px rgba(0,0,0,0.04)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
                }}
                layout
              >
                <motion.div layout style={{ padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <motion.h3 layout style={{ margin: 0, fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {faq.question}
                  </motion.h3>
                  
                  <motion.div 
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    style={{ 
                      width: 32, height: 32, 
                      borderRadius: '50%', 
                      background: isOpen ? 'var(--primary)' : 'var(--surface-raised)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isOpen ? 'white' : 'var(--text-secondary)',
                      flexShrink: 0,
                      marginLeft: 16
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={isOpen ? "M5 12h14" : "M12 5v14M5 12h14"} />
                    </svg>
                  </motion.div>
                </motion.div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 25, mass: 1 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 32px 32px 32px', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
