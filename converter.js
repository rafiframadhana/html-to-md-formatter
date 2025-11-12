/**
 * Converts HTML tables to Markdown table format
 * @param {string} html - The HTML string containing tables
 * @returns {string} - HTML with tables converted to Markdown
 */
function convertTablesToMarkdown(html) {
    // Find all table elements
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;

    return html.replace(tableRegex, (match, tableContent) => {
        const rows = [];

        // Extract table rows
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        let isFirstRow = true;

        while ((rowMatch = rowRegex.exec(tableContent)) !== null) {
            const cells = [];
            const cellContent = rowMatch[1];

            // Extract cells (th or td)
            const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
            let cellMatch;

            while ((cellMatch = cellRegex.exec(cellContent)) !== null) {
                // Clean cell content - remove nested tags but keep text
                let content = cellMatch[1];
                content = content.replace(/<[^>]+>/g, ''); // Remove HTML tags
                content = content.trim();
                cells.push(content);
            }

            if (cells.length > 0) {
                rows.push(cells);

                // Add separator row after first row (header)
                if (isFirstRow) {
                    const separator = cells.map(() => '---');
                    rows.push(separator);
                    isFirstRow = false;
                }
            }
        }

        // Convert to Markdown table format
        if (rows.length === 0) return '';

        const markdownTable = rows.map(row => {
            return '| ' + row.join(' | ') + ' |';
        }).join('\n');

        return '\n\n' + markdownTable + '\n\n';
    });
}

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
    // Try both the unicode character and HTML entity version
    const startMarkers = ['⚒ – Alles über Jobs', '⚒ &#8211; Alles über Jobs'];
    let lastStartIndex = -1;

    for (const marker of startMarkers) {
        const index = markdown.lastIndexOf(marker);
        if (index > lastStartIndex) {
            lastStartIndex = index;
        }
    }

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

    // Convert tables to Markdown format
    markdown = convertTablesToMarkdown(markdown);

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

    // Decode remaining HTML entities (like &#8211; for en-dash)
    const textarea = document.createElement('textarea');
    textarea.innerHTML = markdown;
    markdown = textarea.value;

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
