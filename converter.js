/**
 * Converts HTML to Markdown format
 * @param {string} html - The HTML string to convert
 * @returns {string} - The converted Markdown string
 */
function convertHtmlToMd(html) {
    if (!html || typeof html !== 'string') {
        return '';
    }

    let markdown = html;

    // Remove everything before the last occurrence of "⚒ – Alles über Jobs" (start of main content)
    const startMarker = '⚒ – Alles über Jobs';
    const lastStartIndex = markdown.lastIndexOf(startMarker);
    if (lastStartIndex !== -1) {
        // Find the closing tag after this marker to skip the entire navigation item
        const closingTagAfterMarker = markdown.indexOf('</li>', lastStartIndex);
        if (closingTagAfterMarker !== -1) {
            markdown = markdown.substring(closingTagAfterMarker + 5); // +5 to skip '</li>'
        }
    }

    // Remove everything after the "Über Work and Travel Guide" toggle (end of main content)
    const toggleIndex = markdown.indexOf('Über Work and Travel Guide');
    if (toggleIndex !== -1) {
        // Find the start of the <a> tag containing this text
        const startTag = markdown.lastIndexOf('<a', toggleIndex);
        if (startTag !== -1) {
            markdown = markdown.substring(0, startTag);
        }
    }

    // Remove "Share:" text that appears after author name
    markdown = markdown.replace(/Share:\s*/gi, '');

    // Remove button elements completely (including content)
    markdown = markdown.replace(/<button[^>]*>.*?<\/button>/gis, '');

    // Remove anchor tags that are buttons (Elementor button classes)
    markdown = markdown.replace(/<a[^>]*class="[^"]*elementor-button[^"]*"[^>]*>.*?<\/a>/gis, '');

    // Remove Elementor toggle/accordion sections completely
    markdown = markdown.replace(/<div[^>]*elementor-toggle[^>]*>.*?<\/div>/gis, '');

    // Remove remaining elementor-toggle-title anchor tags
    markdown = markdown.replace(/<a[^>]*class="[^"]*elementor-toggle-title[^"]*"[^>]*>.*?<\/a>/gis, '');

    // Remove anchor tags without href or with empty href (but keep content)
    markdown = markdown.replace(/<a\s+(?:[^>]*?\s+)?href=""[^>]*>(.*?)<\/a>/gi, '');

    // Remove all divs and their attributes (keep content)
    markdown = markdown.replace(/<div[^>]*>/gi, '');
    markdown = markdown.replace(/<\/div>/gi, '');

    // Remove spans with inline styles (keep content)
    markdown = markdown.replace(/<span[^>]*>/gi, '');
    markdown = markdown.replace(/<\/span>/gi, '');

    // Convert headers
    // H2 tags
    markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
    // H3 tags
    markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');

    // Convert strong/bold tags
    markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    markdown = markdown.replace(/<b>(.*?)<\/b>/gi, '**$1**');

    // Convert links
    markdown = markdown.replace(/<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // Convert unordered lists
    markdown = markdown.replace(/<ul[^>]*>/gi, '\n');
    markdown = markdown.replace(/<\/ul>/gi, '\n');
    markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // Convert paragraphs (add blank lines between them)
    markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // Remove &nbsp; HTML entities
    markdown = markdown.replace(/&nbsp;/gi, ' ');

    // Remove other common HTML entities
    markdown = markdown.replace(/&quot;/gi, '"');
    markdown = markdown.replace(/&apos;/gi, "'");
    markdown = markdown.replace(/&lt;/gi, '<');
    markdown = markdown.replace(/&gt;/gi, '>');
    markdown = markdown.replace(/&amp;/gi, '&');

    // Remove any remaining HTML tags
    markdown = markdown.replace(/<[^>]+>/g, '');

    // Clean up excessive whitespace
    // Replace multiple blank lines with just two newlines
    markdown = markdown.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Trim leading/trailing whitespace from each line
    markdown = markdown.split('\n').map(line => line.trim()).join('\n');

    // Remove empty headers (headers with no content or only whitespace)
    markdown = markdown.replace(/^#{1,6}\s*$/gm, '');

    // Clean up double bold formatting (e.g., **text** **more text**)
    markdown = markdown.replace(/\*\*\s*\*\*/g, '');

    // Remove leading/trailing blank lines
    markdown = markdown.trim();

    // Ensure proper spacing after headers
    markdown = markdown.replace(/^(#{1,6}\s+.+)$/gm, '\n$1\n');

    // Clean up any double spacing that might have been created
    markdown = markdown.replace(/\n{3,}/g, '\n\n');

    return markdown.trim();
}

// Export for use in Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { convertHtmlToMd };
}
