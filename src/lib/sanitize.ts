import sanitizeHtml from "sanitize-html";

// Sanitasi HTML konten kaya dari admin (materi, artikel, soal) sebelum dirender (P.1.3).
const options: sanitizeHtml.IOptions = {
  allowedTags: ["p", "br", "strong", "em", "u", "s", "ul", "ol", "li", "h2", "h3", "h4", "blockquote", "a", "code", "pre", "sup", "sub", "table", "thead", "tbody", "tr", "th", "td", "img"],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "width", "height"],
    th: ["scope"],
  },
  allowedSchemes: ["https", "mailto"],
  allowedSchemesByTag: { img: ["https"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

export function sanitizeRichText(html: string) {
  return sanitizeHtml(html, options);
}
