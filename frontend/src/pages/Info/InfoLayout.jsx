import { useEffect } from 'react';

// Shared shell for About, Help, Terms, Privacy and similar pages
const InfoLayout = ({ eyebrow, title, intro, updated, children }) => {
  useEffect(() => {
    document.title = `${title} · RealEstate`;
    return () => {
      document.title = 'RealEstate Marketplace';
    };
  }, [title]);

  return (
    <div className="bg-white">
      <header className="border-b border-gray-100 bg-gradient-to-b from-brand-50/60 to-white">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">{eyebrow}</p>}
          <h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{intro}</p>}
          {updated && <p className="mt-4 text-sm text-gray-400">Last updated {updated}</p>}
        </div>
      </header>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">{children}</div>
    </div>
  );
};

export const Prose = ({ children }) => (
  <div className="space-y-8 text-gray-600 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1.5">
    {children}
  </div>
);

export default InfoLayout;
