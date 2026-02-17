import React from 'react';

type PageScaffoldProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export default function PageScaffold({ title, description, children }: PageScaffoldProps) {
  return (
    <main className="mx-auto w-full max-w-5xl text-white">
      <section className="rounded-3xl border border-white/10 bg-[#1A1A20] p-6 sm:p-8">
        <h1 className="mb-3 text-3xl font-bold">{title}</h1>
        {description ? <p className="mb-6 text-white/70">{description}</p> : null}
        {children}
      </section>
    </main>
  );
}
