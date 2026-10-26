'use client';

import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeMermaid from 'rehype-mermaid';
import { Mermaid } from './mermaid';

function extractText(children: unknown): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }
  if (
    children &&
    typeof children === 'object' &&
    'props' in (children as Record<string, unknown>)
  ) {
    return extractText((children as { props?: { children?: unknown } }).props?.children);
  }
  return '';
}

export function RichText({ content }: { content: string | null | undefined }) {
  if (!content) return null;

  return (
    <div className='rich text-[13px] leading-relaxed text-ink-muted'>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeMermaid, { strategy: 'pre-mermaid' }]]}
        components={{
          pre({ className, children, ...props }) {
            const classStr = Array.isArray(className)
              ? className.join(' ')
              : String(className ?? '');
            const isMermaid = /mermaid/.test(classStr);

            if (isMermaid) {
              const code = extractText(children);
              return <Mermaid code={code.trim()} />;
            }

            const firstChild = Array.isArray(children) ? children[0] : children;

            // Jika anak pre sudah berupa komponen Mermaid, kembalikan langsung tanpa tag <pre>
            if (
              firstChild &&
              typeof firstChild === 'object' &&
              'type' in firstChild &&
              (firstChild.type === Mermaid ||
                (typeof firstChild.type === 'function' && firstChild.type.name === 'Mermaid'))
            ) {
              return <>{children}</>;
            }

            // Juga deteksi jika anak pre memiliki class mermaid
            if (firstChild && typeof firstChild === 'object' && 'props' in firstChild) {
              const childClass = String(
                (firstChild as { props?: { className?: unknown } }).props?.className ?? '',
              );
              if (/mermaid/.test(childClass)) {
                const code = extractText(
                  (firstChild as { props?: { children?: unknown } }).props?.children,
                );
                return <Mermaid code={code.trim()} />;
              }
            }

            return (
              <pre
                className='my-3 overflow-x-auto rounded-lg border border-hairline bg-surface-1 p-3 text-[12px]'
                {...props}
              >
                {children}
              </pre>
            );
          },
          code({ className, children, ...props }) {
            const classStr = Array.isArray(className)
              ? className.join(' ')
              : String(className ?? '');
            const isMermaid = /mermaid/.test(classStr);

            if (isMermaid) {
              const code = extractText(children);
              return <Mermaid code={code.trim()} />;
            }

            return (
              <code
                className='rounded bg-surface-3 px-1.5 py-0.5 font-mono text-[12px] text-ink'
                {...props}
              >
                {children}
              </code>
            );
          },
          h1({ children }) {
            return (
              <h1 className='mt-6 mb-3 text-[18px] font-bold text-ink border-b border-hairline pb-2 tracking-tight'>
                {children}
              </h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className='mt-5 mb-2 text-[15px] font-semibold text-ink tracking-tight'>
                {children}
              </h2>
            );
          },
          h3({ children }) {
            return <h3 className='mt-4 mb-1.5 text-[13px] font-semibold text-ink'>{children}</h3>;
          },
          ul({ children }) {
            return <ul className='my-2 list-disc pl-5 space-y-1'>{children}</ul>;
          },
          ol({ children }) {
            return <ol className='my-2 list-decimal pl-5 space-y-1'>{children}</ol>;
          },
          li({ children, className }) {
            return <li className={className || 'leading-relaxed'}>{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className='my-3 border-l-2 border-st-done/60 bg-surface-2/40 px-3 py-2 italic text-ink-muted rounded-r'>
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className='my-3 overflow-x-auto rounded-lg border border-hairline'>
                <table className='w-full border-collapse text-left text-[12px]'>{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead className='border-b border-hairline bg-surface-2 text-[11px] uppercase tracking-wider text-ink-subtle'>
                {children}
              </thead>
            );
          },
          th({ children }) {
            return <th className='px-3 py-2 font-semibold'>{children}</th>;
          },
          td({ children }) {
            return (
              <td className='border-b border-hairline-soft px-3 py-2 text-ink-muted'>{children}</td>
            );
          },
          hr() {
            return <hr className='my-4 border-hairline' />;
          },
          input({ type, checked, ...props }) {
            if (type === 'checkbox') {
              return (
                <input
                  type='checkbox'
                  checked={checked}
                  readOnly
                  className='mr-2 h-3.5 w-3.5 rounded border-hairline bg-surface-2 accent-st-done align-middle'
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
