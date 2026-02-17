import React from 'react';
import { Link } from 'react-router-dom';
import PageScaffold from './PageScaffold';

export default function NotFoundPage() {
  return (
    <PageScaffold title="404" description="Страница не найдена.">
      <Link className="inline-flex rounded-full bg-[#0088FF] px-5 py-2 font-semibold" to="/">
        На главную
      </Link>
    </PageScaffold>
  );
}
