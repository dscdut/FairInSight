/**
 * Triggers the browser print dialog for the current document preview iframe,
 * or opens a new window containing the fallback A4 template sheet content if iframe is not available.
 * 
 * @param title The document title
 * @param fallbackElementId The DOM element ID to extract the backup HTML content from
 */
export const printDocument = (title: string, fallbackElementId: string = 'a4-fallback-sheet') => {
  const iframe = document.querySelector('iframe')
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.print()
  } else {
    const element = document.getElementById(fallbackElementId)
    if (element) {
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body {
                  font-family: Georgia, serif;
                  padding: 40px;
                  background: white;
                  color: black;
                  font-size: 14px;
                  line-height: 1.6;
                }
                .text-center { text-align: center; }
                .font-bold { font-weight: bold; }
                .border-b { border-bottom: 1px solid #ddd; }
                .pb-2 { padding-bottom: 0.5rem; }
                .w-fit { width: fit-content; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .mt-12 { margin-top: 3rem; }
                .italic { font-style: italic; }
                .text-justify { text-align: justify; }
                .pl-4 { padding-left: 1rem; }
                .space-y-4 > * + * { margin-top: 1rem; }
                .space-y-1.5 > * + * { margin-top: 0.375rem; }
                .uppercase { text-transform: uppercase; }
                .indent-6 { text-indent: 1.5rem; }
                .text-right { text-align: right; }
                .pt-10 { padding-top: 2.5rem; }
                .pr-6 { padding-right: 1.5rem; }
                .gap-1 { gap: 0.25rem; }
                .gap-12 { gap: 3rem; }
              </style>
            </head>
            <body>
              ${element.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `)
        printWindow.document.close()
      }
    }
  }
}
