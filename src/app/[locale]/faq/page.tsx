'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, Search, Shield, Car, Users, Phone, HelpCircle, Building2 } from 'lucide-react';

const categoryIcons: Record<string, any> = {
  general: HelpCircle,
  employers: Building2,
  employees: Car,
  safety: Shield,
  account: Users,
  support: Phone,
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{question}</span>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-4 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const t = useTranslations('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = ['all', 'general', 'employers', 'employees', 'safety', 'account', 'support'];

  const faqItems: { category: string; question: string; answer: string }[] = [];
  const faqCategories = ['general', 'employers', 'employees', 'safety', 'account', 'support'];

  for (const cat of faqCategories) {
    for (let i = 1; i <= 8; i++) {
      try {
        const q = t(`${cat}.q${i}`);
        const a = t(`${cat}.a${i}`);
        if (q && a && !q.includes(`${cat}.q${i}`) && !a.includes(`${cat}.a${i}`)) {
          faqItems.push({ category: cat, question: q, answer: a });
        }
      } catch {
        break;
      }
    }
  }

  const filtered = faqItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = !searchQuery ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">{t('subtitle')}</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => {
          const Icon = cat === 'all' ? HelpCircle : categoryIcons[cat] || HelpCircle;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t(`categories.${cat}`)}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length > 0 ? (
          filtered.map((item, i) => (
            <FAQItem key={i} question={item.question} answer={item.answer} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>{t('noResults')}</p>
          </div>
        )}
      </div>

      <div className="mt-12 bg-brand-50 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('stillNeedHelp')}</h2>
        <p className="text-gray-600 mb-4">{t('stillNeedHelpDesc')}</p>
        <p className="text-brand-600 font-medium">{t('contactEmail')}</p>
      </div>
    </div>
  );
}
