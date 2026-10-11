/** The text format the CMS accepts, in one line. See `src/server/markup.ts`. */
export function MarkupHelp() {
  return (
    <span dir="rtl">
      قالب‌بندی: <code dir="ltr">## تیتر</code>، <code dir="ltr">- فهرست</code>، <code dir="ltr">**پررنگ**</code>،{' '}
      <code dir="ltr">[متن پیوند](https://…)</code>؛ یک خط خالی پاراگراف تازه می‌سازد.
    </span>
  );
}
