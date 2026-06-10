import { useId, useState } from 'react';
import { FiChevronDown } from '../../icons/hugeicons-feather';
import { FAQ_CONTENT } from '../../data/landingContent';

export default function LandingFaq() {
  const { heading, items } = FAQ_CONTENT;
  const baseId = useId();
  const [openId, setOpenId] = useState(null);

  const toggleItem = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <section className="cs-faq" id="faq" aria-labelledby="faq-heading">
      <div className="cs-container cs-faq__container">
        <h2 id="faq-heading" className="cs-faq__heading">
          {heading}
        </h2>

        <div className="cs-faq__accordion">
          {items.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `${baseId}-${item.id}`;

            return (
              <div
                key={item.id}
                className={`cs-faq__item${isOpen ? ' cs-faq__item--open' : ''}`}
              >
                <h3 className="cs-faq__question-wrap">
                  <button
                    type="button"
                    id={`${panelId}-trigger`}
                    className="cs-faq__trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                  >
                    <span className="cs-faq__question">{item.question}</span>
                    <FiChevronDown
                      size={20}
                      strokeWidth={2}
                      className="cs-faq__chevron"
                      aria-hidden
                    />
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={`${panelId}-trigger`}
                  className="cs-faq__panel"
                  hidden={!isOpen}
                >
                  <p className="cs-faq__answer">{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
